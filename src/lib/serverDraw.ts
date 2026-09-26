import { supabase, isSupabaseConfigured } from './supabase';
import { Bilhete, Mensagem, Sorteio, Usuario } from '@/types';
import { getNextDrawSchedule } from './drawTime';
import { WhatsAppTemplates, sendWhatsAppMessage } from './whatsapp';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function readLocalDbFallback() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch {}
  return { usuarios: [], bilhetes: [], sorteios: [], mensagens: [] };
}

function writeLocalDbFallback(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

export interface DrawExecutionResult {
  sorteio: Sorteio;
  milhar: string;
  ganhador: Usuario | null;
  mensagensGeradas: Mensagem[];
}

export class ServerDrawService {
  /**
   * Mutex para requisições simultâneas concorrentes (evita race-condition entre celular e PC)
   */
  private static inFlightExecution: Promise<DrawExecutionResult> | null = null;

  /**
   * Cache de memória para sincronização instantânea em tempo real (últimos 60s)
   */
  private static lastExecution: {
    drawId: string;
    milhar: string;
    sorteio: Sorteio;
    ganhador: Usuario | null;
    mensagensGeradas: Mensagem[];
    timestamp: number;
  } | null = null;

  /**
   * Inicia a Simulação da Semana Completa (7 Sorteios a cada 5 minutos):
   * - Etapas 1 a 6 (Segunda a Sábado): NÃO sai ganhador -> Prêmio acumula +R$ 500 por etapa até R$ 3.500.
   * - Etapa 7 (Domingo da Sorte): Roda 4 vezes na tela, sai ganhador garantido e libera o prêmio!
   * - Após a etapa 7: Encerra o teste e retorna automaticamente ao horário oficial normal (às 19:00h com R$ 500).
   */
  static async startWeekSimulation(firstStepDelayMinutes: number = 5): Promise<Sorteio> {
    this.lastExecution = null;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sorteios').delete().neq('id', 'keep_none');
      } catch (e) {
        console.warn('Erro ao limpar sorteios anteriores:', e);
      }
    }

    const firstTarget = new Date(Date.now() + firstStepDelayMinutes * 60 * 1000);

    const step1Draw: Sorteio = {
      id: 'sorteio_simulacao_etapa_1',
      data_sorteio: firstTarget.toISOString(),
      numeros_sorteados: null,
      ganhador_id: null,
      premio: 500,
      acumulado: false,
      status: 'agendado',
      eh_domingo: false
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sorteios').insert([step1Draw]);
      } catch (e) {
        console.warn('Erro ao inserir Etapa 1 no Supabase:', e);
      }
    }

    const local = readLocalDbFallback();
    local.sorteios = [step1Draw];
    writeLocalDbFallback(local);

    return step1Draw;
  }

  /**
   * Retorna o sorteio ativo agendado na nuvem (Supabase).
   * Se não existir nenhum agendado, inicializa o próximo automaticamente.
   */
  static async getCurrentOrScheduledDraw(): Promise<Sorteio> {
    const schedule = getNextDrawSchedule();

    // Se houve sorteio nos últimos 30 segundos, exibe ele para todos os clientes acompanharem a celebração
    if (this.lastExecution && (Date.now() - this.lastExecution.timestamp < 30000)) {
      return this.lastExecution.sorteio;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Busca sorteio agendado ou em andamento
        const { data: activeDraws, error } = await supabase
          .from('sorteios')
          .select('*')
          .in('status', ['agendado', 'em_andamento'])
          .order('data_sorteio', { ascending: true })
          .limit(1);

        if (!error && activeDraws && activeDraws.length > 0) {
          const row = activeDraws[0] as Sorteio;
          if (row.ganhador_id) {
            const { data: user } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', row.ganhador_id)
              .maybeSingle();
            row.ganhador = user || null;
          }
          return row;
        }

        // 2. Se não encontrou ativo, verifica o último sorteio para saber se acumulou
        const { data: lastDraws } = await supabase
          .from('sorteios')
          .select('*')
          .order('data_sorteio', { ascending: false })
          .limit(1);

        let prize = 500;
        let isAcumulado = false;

        if (lastDraws && lastDraws.length > 0) {
          const last = lastDraws[0];
          if (last.acumulado) {
            prize = Number(last.premio) || 500;
            isAcumulado = true;
          }
        }

        // 3. Cria um novo sorteio agendado na nuvem
        const newDrawId = `sorteio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newDrawRecord = {
          id: newDrawId,
          data_sorteio: schedule.targetIso,
          numeros_sorteados: null,
          ganhador_id: null,
          premio: prize,
          acumulado: isAcumulado,
          status: 'agendado',
          eh_domingo: schedule.isSunday
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('sorteios')
          .insert([newDrawRecord])
          .select()
          .single();

        if (!insertErr && inserted) {
          return inserted as Sorteio;
        }
      } catch (err) {
        console.warn('Erro ao consultar/criar sorteio no Supabase:', err);
      }
    }

    // Fallback local caso Supabase falhe temporariamente
    const local = readLocalDbFallback();
    let current = local.sorteios.find((s: Sorteio) => s.status === 'agendado' || s.status === 'em_andamento');
    if (!current) {
      current = {
        id: `sorteio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        data_sorteio: schedule.targetIso,
        numeros_sorteados: null,
        ganhador_id: null,
        premio: 500,
        acumulado: false,
        status: 'agendado',
        eh_domingo: schedule.isSunday
      };
      local.sorteios.push(current);
      writeLocalDbFallback(local);
    }
    return current;
  }

  /**
   * Retorna os bilhetes vendidos e confirmados para o sorteio atual
   */
  static async getConfirmedTickets(): Promise<Bilhete[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('bilhetes')
          .select('*, usuario:usuarios(*)')
          .eq('status_pagamento', true);

        if (!error && data) {
          return data as Bilhete[];
        }
      } catch (e) {
        console.warn('Erro ao buscar bilhetes confirmados:', e);
      }
    }

    const local = readLocalDbFallback();
    return (local.bilhetes || []).filter((b: Bilhete) => b.status_pagamento);
  }

  /**
   * Executa o sorteio centralizado no Servidor de forma 100% ATÔMICA e IDEMPOTENTE.
   */
  static async executeOfficialDraw(options?: {
    drawId?: string;
    forcedWinnerMilhar?: string;
    isSunday?: boolean;
  }): Promise<DrawExecutionResult> {
    // 🔒 MUTEX CONCORRENTE: Se outra requisição (ex: PC) já estiver executando neste exato instante,
    // a requisição do Celular aguarda e recebe o MESMO resultado!
    if (this.inFlightExecution) {
      return await this.inFlightExecution;
    }

    this.inFlightExecution = this.runAtomicDraw(options);
    try {
      const result = await this.inFlightExecution;
      return result;
    } finally {
      this.inFlightExecution = null;
    }
  }

  private static async runAtomicDraw(options?: {
    drawId?: string;
    forcedWinnerMilhar?: string;
    isSunday?: boolean;
  }): Promise<DrawExecutionResult> {
    const now = Date.now();

    // 1. SINCRONIZAÇÃO EM TEMPO REAL:
    // Se houve sorteio executado nos últimos 60 segundos, todos os dispositivos recebem EXATAMENTE o mesmo!
    if (this.lastExecution && (now - this.lastExecution.timestamp < 60000)) {
      if (!options?.drawId || options.drawId === this.lastExecution.drawId) {
        return {
          sorteio: this.lastExecution.sorteio,
          milhar: this.lastExecution.milhar,
          ganhador: this.lastExecution.ganhador,
          mensagensGeradas: this.lastExecution.mensagensGeradas
        };
      }
    }

    let targetDraw: Sorteio | null = null;

    // 2. Se um drawId específico foi passado, busca no Supabase
    if (options?.drawId && isSupabaseConfigured && supabase) {
      const { data: found } = await supabase
        .from('sorteios')
        .select('*')
        .eq('id', options.drawId)
        .maybeSingle();

      if (found) {
        targetDraw = found as Sorteio;
      }
    }

    // 3. IDEMPOTÊNCIA NO SUPABASE:
    // Se o sorteio com esse ID já estiver finalizado, retorna IMEDIATAMENTE ele!
    if (targetDraw && targetDraw.status === 'finalizado' && targetDraw.numeros_sorteados) {
      let winner: Usuario | null = null;
      if (targetDraw.ganhador_id && isSupabaseConfigured && supabase) {
        const { data: u } = await supabase.from('usuarios').select('*').eq('id', targetDraw.ganhador_id).maybeSingle();
        winner = u || null;
      }
      return {
        sorteio: { ...targetDraw, ganhador: winner },
        milhar: targetDraw.numeros_sorteados,
        ganhador: winner,
        mensagensGeradas: []
      };
    }

    // 4. Se não havia sorteio específico, busca o ativo agendado
    if (!targetDraw) {
      targetDraw = await this.getCurrentOrScheduledDraw();
    }

    // Se o ativo já estiver finalizado
    if (targetDraw.status === 'finalizado' && targetDraw.numeros_sorteados) {
      let winner: Usuario | null = null;
      if (targetDraw.ganhador_id && isSupabaseConfigured && supabase) {
        const { data: u } = await supabase.from('usuarios').select('*').eq('id', targetDraw.ganhador_id).maybeSingle();
        winner = u || null;
      }
      return {
        sorteio: { ...targetDraw, ganhador: winner },
        milhar: targetDraw.numeros_sorteados,
        ganhador: winner,
        mensagensGeradas: []
      };
    }

    // 5. Busca bilhetes vendidos confirmados
    const bilhetes = await this.getConfirmedTickets();
    const isSunday = options?.isSunday ?? targetDraw.eh_domingo ?? false;

    // Verifica se este sorteio faz parte da Simulação dos 7 dias
    const isSimulacao = targetDraw.id.startsWith('sorteio_simulacao_etapa_');
    const stepMatch = targetDraw.id.match(/sorteio_simulacao_etapa_(\d+)/);
    const stepNum = stepMatch ? parseInt(stepMatch[1], 10) : 0;

    let milharSorteado = '';
    let bilheteGanhador: Bilhete | undefined;
    let ganhadorUsuario: Usuario | null = null;
    let foiAcumulado = false;
    let novoPremio = 500;

    // =========================================================================
    // CASO A: SIMULAÇÃO DA SEMANA (ETAPAS 1 A 7)
    // =========================================================================
    if (isSimulacao && stepNum >= 1 && stepNum <= 6) {
      // 🌟 ETAPAS 1 A 6 (Segunda a Sábado): NÃO SAI GANHADOR! Acumula R$ 500 por etapa
      const soldSet = new Set(bilhetes.map(b => b.numero_milhar));
      let rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      while (soldSet.has(rand)) {
        rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      }

      milharSorteado = rand;
      bilheteGanhador = undefined;
      ganhadorUsuario = null;
      foiAcumulado = true;
      novoPremio = targetDraw.premio + 500;

      // Zera bilhetes anteriores para a próxima rodada de vendas
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('bilhetes').delete().neq('id', 'none_preserve');
        } catch (e) {
          console.warn('Erro ao zerar bilhetes no Supabase:', e);
        }
      }

      // Agenda a próxima etapa para daqui a 5 minutos
      const nextStepTarget = new Date(Date.now() + 5 * 60 * 1000);
      const isNextSunday = (stepNum + 1 === 7);
      const nextStepRecord = {
        id: `sorteio_simulacao_etapa_${stepNum + 1}`,
        data_sorteio: nextStepTarget.toISOString(),
        numeros_sorteados: null,
        ganhador_id: null,
        premio: novoPremio,
        acumulado: true,
        status: 'agendado',
        eh_domingo: isNextSunday
      };

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('sorteios').insert([nextStepRecord]);
        } catch (e) {
          console.warn('Erro ao agendar próxima etapa no Supabase:', e);
        }
      }
    } else if (isSimulacao && stepNum === 7) {
      // 🌟 ETAPA 7 (DOMINGO DA SORTE): SAI GANHADOR GARANTIDO E LIBERA O PRÊMIO!
      let winningTicket = bilhetes.length > 0 ? bilhetes[0] : undefined;

      // Se nenhum bilhete foi comprado, seleciona o participante cadastrado no Supabase
      if (!winningTicket) {
        let candidateUser: Usuario | null = null;
        if (isSupabaseConfigured && supabase) {
          const { data: users } = await supabase.from('usuarios').select('*').limit(1);
          if (users && users.length > 0) {
            candidateUser = users[0] as Usuario;
          }
        }
        if (!candidateUser) {
          candidateUser = {
            id: 'usr_flavio_oficial',
            nome_completo: 'Flavio Participante Oficial',
            cpf: '01234567890',
            whatsapp: '11987654321',
            data_cadastro: new Date().toISOString()
          };
        }

        winningTicket = {
          id: 'bilhete_oficial_ganhador_domingo',
          numero_milhar: '7777',
          usuario_id: candidateUser.id,
          sorteio_id: targetDraw.id,
          data_compra: new Date().toISOString(),
          status_pagamento: true,
          valor: 2.00,
          usuario: candidateUser
        };
      }

      milharSorteado = winningTicket.numero_milhar;
      bilheteGanhador = winningTicket;
      ganhadorUsuario = winningTicket.usuario || null;
      foiAcumulado = false;
      novoPremio = 500;

      // 🎉 FIM DA SIMULAÇÃO: Agenda o retorno ao modo oficial padrão (Amanhã às 19:00h com R$ 500)
      const normalSchedule = getNextDrawSchedule();
      const returnToNormalRecord = {
        id: 'sorteio_oficial_diario',
        data_sorteio: normalSchedule.targetIso,
        numeros_sorteados: null,
        ganhador_id: null,
        premio: 500,
        acumulado: false,
        status: 'agendado',
        eh_domingo: false
      };

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('sorteios').insert([returnToNormalRecord]);
        } catch (e) {
          console.warn('Erro ao retornar ao sorteio normal no Supabase:', e);
        }
      }
    } else {
      // =========================================================================
      // CASO B: OPERAÇÃO PADRÃO DIÁRIA (PRODUÇÃO)
      // =========================================================================
      if (options?.forcedWinnerMilhar) {
        milharSorteado = options.forcedWinnerMilhar;
        bilheteGanhador = bilhetes.find(b => b.numero_milhar === milharSorteado);
      } else if (isSunday && bilhetes.length > 0) {
        // 🌟 REGRA DO DOMINGO: A roleta gira exclusivamente entre os bilhetes comprados até sair vencedor garantido
        const sorteado = bilhetes[Math.floor(Math.random() * bilhetes.length)];
        milharSorteado = sorteado.numero_milhar;
        bilheteGanhador = sorteado;
      } else {
        // Sorteio diário padrão: 0000 a 9999
        const randInt = Math.floor(Math.random() * 10000);
        milharSorteado = String(randInt).padStart(4, '0');
        bilheteGanhador = bilhetes.find(b => b.numero_milhar === milharSorteado);
      }

      if (bilheteGanhador) {
        foiAcumulado = false;
        novoPremio = 500;
        if (bilheteGanhador.usuario) {
          ganhadorUsuario = bilheteGanhador.usuario;
        } else if (bilheteGanhador.usuario_id && isSupabaseConfigured && supabase) {
          const { data: u } = await supabase.from('usuarios').select('*').eq('id', bilheteGanhador.usuario_id).maybeSingle();
          ganhadorUsuario = u || null;
        }
      } else {
        foiAcumulado = true;
        novoPremio = targetDraw.premio + 500;

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('bilhetes').delete().neq('id', 'none_preserve');
          } catch (e) {
            console.warn('Erro ao zerar bilhetes no Supabase:', e);
          }
        }
        const local = readLocalDbFallback();
        local.bilhetes = [];
        writeLocalDbFallback(local);
      }

      // Agenda a próxima rodada oficial para amanhã às 19:00h
      const nextSchedule = getNextDrawSchedule(new Date(Date.now() + 60000));
      const nextId = `sorteio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('sorteios').insert([
            {
              id: nextId,
              data_sorteio: nextSchedule.targetIso,
              numeros_sorteados: null,
              ganhador_id: null,
              premio: novoPremio,
              acumulado: foiAcumulado,
              status: 'agendado',
              eh_domingo: nextSchedule.isSunday
            }
          ]);
        } catch (err) {
          console.warn('Erro ao atualizar sorteio no Supabase:', err);
        }
      }
    }

    // 8. Atualiza o sorteio atual no Supabase marcando como finalizado
    const finalizedDraw: Sorteio = {
      ...targetDraw,
      numeros_sorteados: milharSorteado,
      ganhador_id: ganhadorUsuario ? ganhadorUsuario.id : null,
      ganhador: ganhadorUsuario,
      status: 'finalizado',
      acumulado: foiAcumulado
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('sorteios')
          .update({
            numeros_sorteados: milharSorteado,
            ganhador_id: ganhadorUsuario ? ganhadorUsuario.id : null,
            status: 'finalizado',
            acumulado: foiAcumulado
          })
          .eq('id', targetDraw.id);
      } catch (err) {
        console.warn('Erro ao finalizar sorteio no Supabase:', err);
      }
    }

    // Atualiza fallback local
    const local = readLocalDbFallback();
    const idx = local.sorteios.findIndex((s: Sorteio) => s.id === targetDraw.id);
    if (idx >= 0) {
      local.sorteios[idx] = finalizedDraw;
    } else {
      local.sorteios.push(finalizedDraw);
    }
    writeLocalDbFallback(local);

    // 9. Mensagens de Notificação via WhatsApp para o Ganhador
    const mensagensGeradas: Mensagem[] = [];
    try {
      if (ganhadorUsuario) {
        const winMsg = await sendWhatsAppMessage({
          toPhone: ganhadorUsuario.whatsapp,
          recipientName: ganhadorUsuario.nome_completo,
          userId: ganhadorUsuario.id,
          content: WhatsAppTemplates.parabenizacaoGanhador({
            nomeCompleto: ganhadorUsuario.nome_completo,
            milhar: milharSorteado,
            premio: targetDraw.premio
          }),
          type: 'parabenizacao'
        });
        mensagensGeradas.push(winMsg);
      }
    } catch (e) {
      console.warn('Erro ao registrar mensagem WhatsApp:', e);
    }

    // Armazena no cache de sincronização instantânea
    this.lastExecution = {
      drawId: targetDraw.id,
      milhar: milharSorteado,
      sorteio: finalizedDraw,
      ganhador: ganhadorUsuario,
      mensagensGeradas,
      timestamp: Date.now()
    };

    return {
      sorteio: finalizedDraw,
      milhar: milharSorteado,
      ganhador: ganhadorUsuario,
      mensagensGeradas
    };
  }

  /**
   * Reseta manualmente o ciclo e inicia um novo sorteio
   */
  static async startNewCycle(): Promise<Sorteio> {
    this.lastExecution = null;
    const schedule = getNextDrawSchedule(new Date(Date.now() + 60000));
    const nextId = `sorteio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newDraw: Sorteio = {
      id: nextId,
      data_sorteio: schedule.targetIso,
      numeros_sorteados: null,
      ganhador_id: null,
      premio: 500,
      acumulado: false,
      status: 'agendado',
      eh_domingo: schedule.isSunday
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bilhetes').delete().neq('id', 'none_preserve');
        await supabase.from('sorteios').insert([newDraw]);
      } catch (e) {
        console.warn('Erro ao iniciar novo ciclo no Supabase:', e);
      }
    }

    const local = readLocalDbFallback();
    local.bilhetes = [];
    local.sorteios.push(newDraw);
    writeLocalDbFallback(local);

    return newDraw;
  }
}
