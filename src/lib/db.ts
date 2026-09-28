import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';
import { Usuario, Bilhete, Sorteio, Mensagem } from '@/types';
import { WhatsAppTemplates, sendWhatsAppMessage } from './whatsapp';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  usuarios: Usuario[];
  bilhetes: Bilhete[];
  sorteios: Sorteio[];
  mensagens: Mensagem[];
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
  bilhetes: [
    {
      id: 'bilhete_seed_1',
      numero_milhar: '1234',
      usuario_id: 'usr_seed_1',
      sorteio_id: 'sorteio_hoje',
      data_compra: '2026-09-24T11:00:00Z',
      status_pagamento: true,
      valor: 2.00
    },
    {
      id: 'bilhete_seed_2',
      numero_milhar: '7777',
      usuario_id: 'usr_seed_2',
      sorteio_id: 'sorteio_hoje',
      data_compra: '2026-09-24T12:30:00Z',
      status_pagamento: true,
      valor: 2.00
    },
    {
      id: 'bilhete_seed_3',
      numero_milhar: '0420',
      usuario_id: 'usr_seed_3',
      sorteio_id: 'sorteio_hoje',
      data_compra: '2026-09-24T13:45:00Z',
      status_pagamento: true,
      valor: 2.00
    }
  ],
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
  mensagens: []
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
    return JSON.parse(content);
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

    let foundUser: Usuario | null = null;
    let tickets: Bilhete[] = [];

    // 1. Tenta buscar no Supabase
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
          const { data: tData, error: tErr } = await supabase
            .from('bilhetes')
            .select('*, usuario:usuarios(*)')
            .eq('usuario_id', foundUser.id)
            .eq('status_pagamento', true)
            .order('data_compra', { ascending: false });

          if (!tErr && tData) {
            tickets = tData as Bilhete[];
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar CPF no Supabase:', err);
      }
    }

    // 2. Fallback / Mesclagem com o banco local
    const localDb = readLocalDb();
    if (!foundUser) {
      foundUser = localDb.usuarios.find(u => u.cpf.replace(/\D/g, '') === cleanCpf) || null;
    }

    if (foundUser) {
      const localTickets = (localDb.bilhetes || []).filter(
        b => (b.usuario_id === foundUser?.id || b.usuario?.cpf?.replace(/\D/g, '') === cleanCpf) && b.status_pagamento
      );

      for (const lt of localTickets) {
        tickets.push({ ...lt, usuario: foundUser });
      }
    }

    // 3. Deduplica estritamente por número da milhar para garantir que cada milhar só apareça uma vez
    const uniqueMap = new Map<string, Bilhete>();
    for (const t of tickets) {
      const key = `${t.numero_milhar}_${t.sorteio_id || 'default'}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, t);
      } else {
        const existing = uniqueMap.get(key)!;
        const eTime = new Date(existing.data_compra || 0).getTime();
        const tTime = new Date(t.data_compra || 0).getTime();
        if (tTime > eTime) {
          uniqueMap.set(key, t);
        }
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
   * Retorna todos os bilhetes vendidos (sem duplicatas, com dados do usuário)
   */
  static async getTickets(): Promise<Bilhete[]> {
    let tickets: Bilhete[] = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('bilhetes')
          .select('*, usuario:usuarios(*)')
          .eq('status_pagamento', true)
          .order('data_compra', { ascending: false });

        if (!error && data && data.length > 0) {
          tickets = data as Bilhete[];
        }
      } catch (err) {
        console.warn('Erro ao consultar bilhetes no Supabase:', err);
      }
    }

    const localDb = readLocalDb();
    const localTickets = (localDb.bilhetes || []).filter(b => b.status_pagamento);

    // Mescla e preenche dados do usuário se estiver faltando
    const ticketMap = new Map<string, Bilhete>();
    for (const t of [...tickets, ...localTickets]) {
      if (!t.usuario && t.usuario_id) {
        const u = localDb.usuarios.find(user => user.id === t.usuario_id);
        if (u) t.usuario = u;
      }

      const key = `${t.numero_milhar}_${t.sorteio_id || 'default'}`;
      if (!ticketMap.has(key)) {
        ticketMap.set(key, t);
      } else {
        const existing = ticketMap.get(key)!;
        const eTime = new Date(existing.data_compra || 0).getTime();
        const tTime = new Date(t.data_compra || 0).getTime();
        if (tTime > eTime) {
          ticketMap.set(key, t);
        }
      }
    }

    return Array.from(ticketMap.values());
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
}
