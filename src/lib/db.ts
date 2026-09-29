import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';
import { Usuario, Bilhete, Sorteio, Mensagem, Affiliate, AffiliateLink, AffiliateStatus } from '@/types';
import { WhatsAppTemplates, sendWhatsAppMessage } from './whatsapp';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  usuarios: Usuario[];
  bilhetes: Bilhete[];
  sorteios: Sorteio[];
  mensagens: Mensagem[];
  afiliados: Affiliate[];
  afiliados_links: AffiliateLink[];
}

const DEFAULT_DB: DatabaseSchema = {
  usuarios: [
    {
      id: 'usr_seed_1',
      nome_completo: 'Carlos Eduardo Mendes',
      cpf: '12345678900',
      whatsapp: '11987654321',
      data_cadastro: '2026-09-24T10:00:00Z'
    },
    {
      id: 'usr_seed_2',
      nome_completo: 'Mariana Silva Santos',
      cpf: '23456789011',
      whatsapp: '21976543210',
      data_cadastro: '2026-09-24T14:30:00Z'
    },
    {
      id: 'usr_seed_3',
      nome_completo: 'Roberto Oliveira Lima',
      cpf: '34567890122',
      whatsapp: '31985432109',
      data_cadastro: '2026-09-24T16:15:00Z'
    }
  ],
  bilhetes: [],
  sorteios: [
    {
      id: 'sorteio_hoje',
      data_sorteio: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(),
      numeros_sorteados: null,
      ganhador_id: null,
      premio: 500,
      acumulado: false,
      status: 'agendado',
      eh_domingo: new Date().getDay() === 0
    }
  ],
  mensagens: [],
  afiliados: [],
  afiliados_links: []
};

/**
 * Lê o banco de dados local com garantia de integridade
 */
function readLocalDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.afiliados) parsed.afiliados = [];
    if (!parsed.afiliados_links) parsed.afiliados_links = [];
    return parsed;
  } catch (err) {
    console.error('Erro ao ler DB local:', err);
    return DEFAULT_DB;
  }
}

/**
 * Salva no banco de dados local
 */
function writeLocalDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao gravar DB local:', err);
  }
}

export class DatabaseService {
  /**
   * Captura e salva o participante (Nome, CPF, WhatsApp) e seus bilhetes
   * Persiste no Supabase e no banco local simultaneamente.
   */
  static async saveParticipant(params: {
    nome_completo: string;
    cpf: string;
    whatsapp: string;
    tickets: string[];
    paymentId?: string;
  }): Promise<{ user: Usuario; newTickets: Bilhete[] }> {
    const cleanCpf = params.cpf.replace(/\D/g, '');
    const cleanPhone = params.whatsapp.replace(/\D/g, '');
    const cleanName = params.nome_completo.trim();

    const localDb = readLocalDb();
    
    // 1. Localiza ou cria o usuário
    let user = localDb.usuarios.find(u => u.cpf.replace(/\D/g, '') === cleanCpf);
    if (!user) {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nome_completo: cleanName,
        cpf: cleanCpf,
        whatsapp: cleanPhone,
        data_cadastro: new Date().toISOString()
      };
      localDb.usuarios.push(user);
    } else {
      user.nome_completo = cleanName;
      user.cpf = cleanCpf;
      user.whatsapp = cleanPhone;
    }

    // 2. Localiza o sorteio ativo oficial (Supabase ou local)
    let drawId = 'sorteio_hoje';
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: activeDraws } = await supabase
          .from('sorteios')
          .select('id')
          .in('status', ['agendado', 'em_andamento'])
          .order('data_sorteio', { ascending: true })
          .limit(1);

        if (activeDraws && activeDraws.length > 0 && activeDraws[0].id) {
          drawId = activeDraws[0].id;
        }
      } catch (e) {
        console.warn('Erro ao consultar sorteio ativo para bilhete:', e);
      }
    }
    if (drawId === 'sorteio_hoje') {
      const currentDraw = localDb.sorteios[localDb.sorteios.length - 1];
      if (currentDraw) drawId = currentDraw.id;
    }

    // 3. Cria os bilhetes comprados evitando duplicações acidentais
    const uniqueRequestedNumbers = [...new Set(params.tickets)];
    const existingMilhares = new Set(
      (localDb.bilhetes || [])
        .filter(b => b.sorteio_id === drawId && b.usuario_id === user!.id)
        .map(b => b.numero_milhar)
    );

    const toInsert = uniqueRequestedNumbers.filter(n => !existingMilhares.has(n));
    const newTickets: Bilhete[] = toInsert.map(num => ({
      id: `bilhete_${Date.now()}_${num}`,
      numero_milhar: num,
      usuario_id: user!.id,
      sorteio_id: drawId,
      data_compra: new Date().toISOString(),
      status_pagamento: true,
      payment_id: params.paymentId,
      valor: 2.00,
      usuario: user
    }));

    if (newTickets.length > 0) {
      localDb.bilhetes.push(...newTickets);
      writeLocalDb(localDb);
    }

    // 4. Se o Supabase estiver configurado com credenciais válidas, sincroniza na nuvem
    if (isSupabaseConfigured && supabase) {
      try {
        let supabaseUserId = user.id;

        // Localiza se o usuário já existe na nuvem pelo CPF
        const { data: existingUser } = await supabase
          .from('usuarios')
          .select('id')
          .eq('cpf', cleanCpf)
          .maybeSingle();

        if (existingUser && existingUser.id) {
          supabaseUserId = existingUser.id;
          await supabase
            .from('usuarios')
            .update({
              nome_completo: user.nome_completo,
              whatsapp: user.whatsapp
            })
            .eq('id', supabaseUserId);
        } else {
          await supabase.from('usuarios').insert({
            id: supabaseUserId,
            nome_completo: user.nome_completo,
            cpf: user.cpf,
            whatsapp: user.whatsapp,
            data_cadastro: user.data_cadastro
          });
        }

        // Insere os bilhetes comprados vinculando ao usuário sem duplicar
        if (newTickets.length > 0) {
          const { data: existingSbTickets } = await supabase
            .from('bilhetes')
            .select('numero_milhar')
            .eq('sorteio_id', drawId)
            .eq('usuario_id', supabaseUserId)
            .in('numero_milhar', newTickets.map(t => t.numero_milhar));

          const existingSbMilhares = new Set((existingSbTickets || []).map(b => b.numero_milhar));
          const sbToInsert = newTickets
            .filter(t => !existingSbMilhares.has(t.numero_milhar))
            .map(t => ({
              id: t.id,
              numero_milhar: t.numero_milhar,
              usuario_id: supabaseUserId,
              sorteio_id: t.sorteio_id,
              data_compra: t.data_compra,
              status_pagamento: t.status_pagamento,
              valor: t.valor
            }));

          if (sbToInsert.length > 0) {
            await supabase.from('bilhetes').insert(sbToInsert);
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar com Supabase:', err);
      }
    }

    return { user, newTickets };
  }

  /**
   * Consulta participante e todos os bilhetes ativos pelo CPF (sem duplicatas)
   */
  static async getTicketsByCpf(rawCpf: string): Promise<{ user: Usuario | null; tickets: Bilhete[] }> {
    const cleanCpf = rawCpf.replace(/\D/g, '');
    if (!cleanCpf) {
      return { user: null, tickets: [] };
    }

    const localDb = readLocalDb();
    let foundUser: Usuario | null = null;
    let tickets: Bilhete[] = [];

    // Localiza o sorteio ativo oficial (bilhetes de rodadas anteriores não são exibidos)
    let activeDrawId: string | null = null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: activeDraws } = await supabase
          .from('sorteios')
          .select('id')
          .in('status', ['agendado', 'em_andamento'])
          .order('data_sorteio', { ascending: true })
          .limit(1);
        if (activeDraws && activeDraws.length > 0 && activeDraws[0].id) {
          activeDrawId = activeDraws[0].id;
        }
      } catch (e) {}
    }
    if (!activeDrawId) {
      const currentLocal = localDb.sorteios.find(s => s.status === 'agendado' || s.status === 'em_andamento');
      if (currentLocal) activeDrawId = currentLocal.id;
    }

    // 1. Tenta buscar no Supabase (Fonte de Verdade Principal)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: users, error: userErr } = await supabase
          .from('usuarios')
          .select('*')
          .eq('cpf', cleanCpf)
          .limit(1);

        if (!userErr && users && users.length > 0) {
          foundUser = users[0] as Usuario;
        }

        if (foundUser) {
          let query = supabase
            .from('bilhetes')
            .select('*, usuario:usuarios(*)')
            .eq('usuario_id', foundUser.id)
            .eq('status_pagamento', true);

          if (activeDrawId) {
            query = query.eq('sorteio_id', activeDrawId);
          }

          const { data: tData, error: tErr } = await query.order('data_compra', { ascending: false });

          if (!tErr && tData) {
            tickets = tData as Bilhete[];
          }

          // Se encontrou dados no Supabase, deduplica estritamente por número da milhar e retorna direto
          const uniqueMap = new Map<string, Bilhete>();
          for (const t of tickets) {
            if (!uniqueMap.has(t.numero_milhar)) {
              uniqueMap.set(t.numero_milhar, t);
            }
          }
          return { user: foundUser, tickets: Array.from(uniqueMap.values()) };
        }
      } catch (err) {
        console.warn('Erro ao consultar CPF no Supabase:', err);
      }
    }

    // 2. Fallback com o banco local caso Supabase falhe ou usuário só exista local
    if (!foundUser) {
      foundUser = localDb.usuarios.find(u => u.cpf.replace(/\D/g, '') === cleanCpf) || null;
    }

    if (foundUser) {
      const localTickets = (localDb.bilhetes || []).filter(
        b => (b.usuario_id === foundUser?.id || b.usuario?.cpf?.replace(/\D/g, '') === cleanCpf) &&
             b.status_pagamento &&
             (!activeDrawId || b.sorteio_id === activeDrawId)
      );

      for (const lt of localTickets) {
        tickets.push({ ...lt, usuario: foundUser });
      }
    }

    // 3. Deduplica estritamente por número da milhar
    const uniqueMap = new Map<string, Bilhete>();
    for (const t of tickets) {
      if (!uniqueMap.has(t.numero_milhar)) {
        uniqueMap.set(t.numero_milhar, t);
      }
    }

    return { user: foundUser, tickets: Array.from(uniqueMap.values()) };
  }

  /**
   * Retorna todos os participantes cadastrados
   */
  static async getParticipants(): Promise<Usuario[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('usuarios').select('*').order('data_cadastro', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Usuario[];
        }
      } catch (err) {
        console.warn('Erro ao consultar participantes no Supabase:', err);
      }
    }

    const localDb = readLocalDb();
    return localDb.usuarios;
  }

  /**
   * Retorna todos os bilhetes vendidos da rodada ativa (sem duplicatas, com dados do usuário)
   */
  static async getTickets(): Promise<Bilhete[]> {
    const localDb = readLocalDb();
    let activeDrawId: string | null = null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: activeDraws } = await supabase
          .from('sorteios')
          .select('id')
          .in('status', ['agendado', 'em_andamento'])
          .order('data_sorteio', { ascending: true })
          .limit(1);
        if (activeDraws && activeDraws.length > 0 && activeDraws[0].id) {
          activeDrawId = activeDraws[0].id;
        }
      } catch (e) {}
    }
    if (!activeDrawId) {
      const currentLocal = localDb.sorteios.find(s => s.status === 'agendado' || s.status === 'em_andamento');
      if (currentLocal) activeDrawId = currentLocal.id;
    }

    // 1. Tenta buscar no Supabase como fonte única de verdade
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('bilhetes')
          .select('*, usuario:usuarios(*)')
          .eq('status_pagamento', true);

        if (activeDrawId) {
          query = query.eq('sorteio_id', activeDrawId);
        }

        const { data, error } = await query.order('data_compra', { ascending: false });

        if (!error && data) {
          const map = new Map<string, Bilhete>();
          for (const b of data as Bilhete[]) {
            if (!map.has(b.numero_milhar)) {
              map.set(b.numero_milhar, b);
            }
          }
          return Array.from(map.values());
        }
      } catch (err) {
        console.warn('Erro ao consultar bilhetes no Supabase:', err);
      }
    }

    // 2. Fallback estrito apenas se Supabase não estiver disponível
    const map = new Map<string, Bilhete>();
    for (const b of (localDb.bilhetes || [])) {
      if (b.status_pagamento && (!activeDrawId || b.sorteio_id === activeDrawId) && !map.has(b.numero_milhar)) {
        if (!b.usuario && b.usuario_id) {
          const u = localDb.usuarios.find(user => user.id === b.usuario_id);
          if (u) b.usuario = u;
        }
        map.set(b.numero_milhar, b);
      }
    }

    return Array.from(map.values());
  }

  /**
   * Zera todos os bilhetes vendidos após a conclusão de um sorteio (com ou sem ganhador),
   * garantindo que os bilhetes comprados não sirvam para o próximo sorteio e a rodada reinicie do zero.
   */
  static async clearTickets(): Promise<void> {
    const localDb = readLocalDb();
    localDb.bilhetes = [];
    writeLocalDb(localDb);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bilhetes').delete().neq('id', 'none_preserve');
      } catch (e) {
        console.warn('Erro ao zerar bilhetes no Supabase:', e);
      }
    }
  }

  /**
   * Retorna o sorteio ativo
   */
  static async getCurrentDraw(): Promise<Sorteio> {
    const localDb = readLocalDb();
    const current = localDb.sorteios[localDb.sorteios.length - 1];
    return current || DEFAULT_DB.sorteios[0];
  }

  /**
   * Retorna todas as mensagens enviadas
   */
  static async getMessages(): Promise<Mensagem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('mensagens').select('*').order('data_envio', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Mensagem[];
        }
      } catch (err) {
        console.warn('Erro ao consultar mensagens no Supabase:', err);
      }
    }

    const localDb = readLocalDb();
    return localDb.mensagens;
  }

  /**
   * Dispara o lembrete diário para TODOS os participantes cadastrados
   * "Ainda dá tempo de comprar seu bilhete para o sorteio de hoje!"
   */
  static async broadcastDailyReminder(): Promise<{ count: number; messages: Mensagem[] }> {
    const participants = await this.getParticipants();
    const localDb = readLocalDb();
    const dispatchedMessages: Mensagem[] = [];

    const reminderContent = WhatsAppTemplates.lembrete();

    for (const user of participants) {
      const msg = await sendWhatsAppMessage({
        toPhone: user.whatsapp,
        recipientName: user.nome_completo,
        userId: user.id,
        content: reminderContent,
        type: 'lembrete'
      });

      dispatchedMessages.push(msg);
      localDb.mensagens.unshift(msg);

      // Salva no Supabase se disponível
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('mensagens').insert({
            id: msg.id,
            usuario_id: user.id,
            conteudo: msg.conteudo,
            tipo: msg.tipo,
            data_envio: msg.data_envio,
            status_envio: msg.status_envio
          });
        } catch (e) {
          console.warn('Erro ao gravar mensagem no Supabase:', e);
        }
      }
    }

    writeLocalDb(localDb);
    return { count: dispatchedMessages.length, messages: dispatchedMessages };
  }

  /**
   * Salva um novo afiliado no banco de dados (Local JSON e Supabase)
   */
  static async saveAffiliate(affiliate: Affiliate): Promise<{ success: boolean; affiliate?: Affiliate; error?: string }> {
    const localDb = readLocalDb();
    const cleanEmail = affiliate.email.trim().toLowerCase();
    const cleanDoc = affiliate.documentNumber.replace(/\D/g, '');

    // Verifica duplicidade no banco local
    if (localDb.afiliados.some(a => a.email.trim().toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
    }
    if (localDb.afiliados.some(a => a.documentNumber.replace(/\D/g, '') === cleanDoc)) {
      return { success: false, error: 'Este CPF/CNPJ já possui cadastro ativo ou em análise.' };
    }

    // Salva no banco local
    localDb.afiliados.unshift(affiliate);

    // Cria link padrão
    const defaultLink: AffiliateLink = {
      id: `link_${Date.now()}`,
      affiliateId: affiliate.id,
      affiliateCode: affiliate.exclusiveCode,
      destinationPath: '/',
      campaignName: 'padrao',
      fullUrl: `https://tanamaodasorte.com.br/?afiliado=${affiliate.exclusiveCode}`,
      clicksCount: 0,
      conversionsCount: 0,
      revenueGenerated: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    localDb.afiliados_links.unshift(defaultLink);
    writeLocalDb(localDb);

    // Sincroniza com Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('afiliados').insert({
          id: affiliate.id,
          full_name: affiliate.fullName,
          email: cleanEmail,
          password: affiliate.password || '',
          document_type: affiliate.documentType,
          document_number: cleanDoc,
          phone: affiliate.phone,
          whatsapp: affiliate.whatsapp,
          birth_date: affiliate.birthDate || null,
          city: affiliate.city,
          state: affiliate.state,
          exclusive_code: affiliate.exclusiveCode,
          status: affiliate.status,
          rejection_reason: affiliate.rejectionReason || null,
          commission_rate: affiliate.commissionRate,
          pix_key_type: affiliate.pixKeyType,
          pix_key: affiliate.pixKey,
          social_channels: affiliate.socialChannels,
          promotion_strategy: affiliate.promotionStrategy,
          balance_available: affiliate.balanceAvailable,
          balance_pending: affiliate.balancePending,
          balance_paid: affiliate.balancePaid,
          total_clicks: affiliate.totalClicks,
          total_conversions: affiliate.totalConversions,
          terms_accepted_at: affiliate.termsAcceptedAt,
          privacy_accepted_at: affiliate.privacyAcceptedAt,
          created_at: affiliate.createdAt
        });

        await supabase.from('afiliados_links').insert({
          id: defaultLink.id,
          affiliate_id: defaultLink.affiliateId,
          affiliate_code: defaultLink.affiliateCode,
          destination_path: defaultLink.destinationPath,
          campaign_name: defaultLink.campaignName,
          full_url: defaultLink.fullUrl,
          clicks_count: 0,
          conversions_count: 0,
          revenue_generated: 0,
          is_active: true,
          created_at: defaultLink.createdAt
        });
      } catch (err) {
        console.warn('Erro ao sincronizar afiliado com Supabase:', err);
      }
    }

    return { success: true, affiliate };
  }

  /**
   * Retorna lista de afiliados cadastrados (Supabase com fallback Local)
   */
  static async getAffiliates(): Promise<Affiliate[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('afiliados')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            fullName: row.full_name || row.fullName,
            email: row.email,
            password: row.password,
            documentType: row.document_type || row.documentType,
            documentNumber: row.document_number || row.documentNumber,
            phone: row.phone,
            whatsapp: row.whatsapp,
            birthDate: row.birth_date || row.birthDate,
            city: row.city,
            state: row.state,
            exclusiveCode: row.exclusive_code || row.exclusiveCode,
            status: row.status,
            rejectionReason: row.rejection_reason || row.rejectionReason,
            commissionRate: Number(row.commission_rate ?? 0.15),
            pixKeyType: row.pix_key_type || row.pixKeyType,
            pixKey: row.pix_key || row.pixKey,
            socialChannels: row.social_channels || row.socialChannels,
            promotionStrategy: row.promotion_strategy || row.promotionStrategy,
            balanceAvailable: Number(row.balance_available ?? 0),
            balancePending: Number(row.balance_pending ?? 0),
            balancePaid: Number(row.balance_paid ?? 0),
            totalClicks: Number(row.total_clicks ?? 0),
            totalConversions: Number(row.total_conversions ?? 0),
            termsAcceptedAt: row.terms_accepted_at || row.termsAcceptedAt,
            privacyAcceptedAt: row.privacy_accepted_at || row.privacyAcceptedAt,
            createdAt: row.created_at || row.createdAt,
            approvedAt: row.approved_at || row.approvedAt,
            approvedBy: row.approved_by || row.approvedBy
          }));
        }
      } catch (err) {
        console.warn('Erro ao consultar afiliados no Supabase:', err);
      }
    }

    const localDb = readLocalDb();
    return localDb.afiliados || [];
  }

  /**
   * Busca afiliado por ID, E-mail, CPF/CNPJ ou Código Exclusivo
   */
  static async getAffiliateByIdOrDoc(identifier: string): Promise<Affiliate | null> {
    const clean = identifier.trim().toLowerCase();
    const cleanDoc = identifier.replace(/\D/g, '');

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('afiliados').select('*');
        if (cleanDoc.length >= 11) {
          query = query.or(`document_number.eq.${cleanDoc},email.ilike.${clean}`);
        } else {
          query = query.or(`id.eq.${identifier},exclusive_code.eq.${identifier.toUpperCase()},email.ilike.${clean}`);
        }

        const { data, error } = await query.limit(1);
        if (!error && data && data.length > 0) {
          const row = data[0];
          return {
            id: row.id,
            fullName: row.full_name || row.fullName,
            email: row.email,
            password: row.password,
            documentType: row.document_type || row.documentType,
            documentNumber: row.document_number || row.documentNumber,
            phone: row.phone,
            whatsapp: row.whatsapp,
            birthDate: row.birth_date || row.birthDate,
            city: row.city,
            state: row.state,
            exclusiveCode: row.exclusive_code || row.exclusiveCode,
            status: row.status,
            rejectionReason: row.rejection_reason || row.rejectionReason,
            commissionRate: Number(row.commission_rate ?? 0.15),
            pixKeyType: row.pix_key_type || row.pixKeyType,
            pixKey: row.pix_key || row.pixKey,
            socialChannels: row.social_channels || row.socialChannels,
            promotionStrategy: row.promotion_strategy || row.promotionStrategy,
            balanceAvailable: Number(row.balance_available ?? 0),
            balancePending: Number(row.balance_pending ?? 0),
            balancePaid: Number(row.balance_paid ?? 0),
            totalClicks: Number(row.total_clicks ?? 0),
            totalConversions: Number(row.total_conversions ?? 0),
            termsAcceptedAt: row.terms_accepted_at || row.termsAcceptedAt,
            privacyAcceptedAt: row.privacy_accepted_at || row.privacyAcceptedAt,
            createdAt: row.created_at || row.createdAt,
            approvedAt: row.approved_at || row.approvedAt,
            approvedBy: row.approved_by || row.approvedBy
          };
        }
      } catch (err) {
        console.warn('Erro ao buscar afiliado no Supabase:', err);
      }
    }

    const localDb = readLocalDb();
    const aff = (localDb.afiliados || []).find(a =>
      a.id === identifier ||
      a.email.trim().toLowerCase() === clean ||
      a.documentNumber.replace(/\D/g, '') === cleanDoc ||
      a.exclusiveCode.toUpperCase() === clean.toUpperCase()
    );
    return aff || null;
  }

  /**
   * Atualiza status do afiliado (aprovação, recusa, suspensão)
   */
  static async updateAffiliateStatus(
    id: string,
    status: AffiliateStatus,
    rejectionReason?: string,
    approvedBy?: string
  ): Promise<{ success: boolean }> {
    const localDb = readLocalDb();
    const idx = (localDb.afiliados || []).findIndex(a => a.id === id);
    const nowIso = new Date().toISOString();

    if (idx !== -1) {
      localDb.afiliados[idx].status = status;
      if (status === 'aprovado') {
        localDb.afiliados[idx].approvedAt = nowIso;
        localDb.afiliados[idx].approvedBy = approvedBy || 'admin';
        localDb.afiliados[idx].rejectionReason = undefined;
      } else if (status === 'recusado' || status === 'suspenso') {
        localDb.afiliados[idx].rejectionReason = rejectionReason;
      }
      writeLocalDb(localDb);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const updateData: any = { status };
        if (status === 'aprovado') {
          updateData.approved_at = nowIso;
          updateData.approved_by = approvedBy || 'admin';
          updateData.rejection_reason = null;
        } else if (status === 'recusado' || status === 'suspenso') {
          updateData.rejection_reason = rejectionReason || null;
        }
        await supabase.from('afiliados').update(updateData).eq('id', id);
      } catch (err) {
        console.warn('Erro ao atualizar status do afiliado no Supabase:', err);
      }
    }

    return { success: true };
  }
}
