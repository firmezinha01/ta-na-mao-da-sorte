import { Bilhete, Mensagem, Sorteio, Usuario } from '@/types';
import { WhatsAppTemplates, sendWhatsAppMessage, maskPhoneNumber } from './whatsapp';

// Seed inicial realista de participantes para testes imediatos
export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 'usr_1',
    nome_completo: 'Carlos Eduardo Mendes',
    cpf: '123.456.789-00',
    whatsapp: '11987654321',
    data_cadastro: '2026-09-20T10:00:00Z'
  },
  {
    id: 'usr_2',
    nome_completo: 'Mariana Silva Santos',
    cpf: '234.567.890-11',
    whatsapp: '21976543210',
    data_cadastro: '2026-09-21T14:30:00Z'
  },
  {
    id: 'usr_3',
    nome_completo: 'Roberto Oliveira Lima',
    cpf: '345.678.901-22',
    whatsapp: '31985432109',
    data_cadastro: '2026-09-22T09:15:00Z'
  },
  {
    id: 'usr_4',
    nome_completo: 'Fernanda Costa Ribeiro',
    cpf: '456.789.012-33',
    whatsapp: '41994321098',
    data_cadastro: '2026-09-23T16:40:00Z'
  }
];

export const INITIAL_SORTEIO: Sorteio = {
  id: 'sorteio_hoje',
  data_sorteio: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(),
  numeros_sorteados: null,
  ganhador_id: null,
  premio: 500,
  acumulado: false,
  status: 'agendado',
  eh_domingo: new Date().getDay() === 0 // true se hoje for domingo
};

export const INITIAL_BILHETES: Bilhete[] = [
  {
    id: 'bilhete_1',
    numero_milhar: '1234',
    usuario_id: 'usr_1',
    sorteio_id: 'sorteio_hoje',
    data_compra: '2026-09-24T11:00:00Z',
    status_pagamento: true,
    valor: 2.00
  },
  {
    id: 'bilhete_2',
    numero_milhar: '7777',
    usuario_id: 'usr_2',
    sorteio_id: 'sorteio_hoje',
    data_compra: '2026-09-24T12:30:00Z',
    status_pagamento: true,
    valor: 2.00
  },
  {
    id: 'bilhete_3',
    numero_milhar: '0420',
    usuario_id: 'usr_3',
    sorteio_id: 'sorteio_hoje',
    data_compra: '2026-09-24T13:45:00Z',
    status_pagamento: true,
    valor: 2.00
  },
  {
    id: 'bilhete_4',
    numero_milhar: '9850',
    usuario_id: 'usr_4',
    sorteio_id: 'sorteio_hoje',
    data_compra: '2026-09-24T14:10:00Z',
    status_pagamento: true,
    valor: 2.00
  },
  {
    id: 'bilhete_5',
    numero_milhar: '0007',
    usuario_id: 'usr_1',
    sorteio_id: 'sorteio_hoje',
    data_compra: '2026-09-24T14:50:00Z',
    status_pagamento: true,
    valor: 2.00
  }
];

export const INITIAL_MENSAGENS: Mensagem[] = [
  {
    id: 'msg_seed_1',
    usuario_id: 'usr_1',
    conteudo: WhatsAppTemplates.lembrete(),
    tipo: 'lembrete',
    data_envio: '2026-09-24T18:00:00Z',
    status_envio: 'entregue',
    destinatario_nome: 'Carlos Eduardo Mendes',
    destinatario_whatsapp: '5511987654321'
  }
];

const STORAGE_KEYS = {
  USUARIOS: 'tanamao_usuarios_v1',
  BILHETES: 'tanamao_bilhetes_v1',
  SORTEIO: 'tanamao_sorteio_v1',
  MENSAGENS: 'tanamao_mensagens_v1',
  CURRENT_USER: 'tanamao_current_user_v1',
  TEST_MODE: 'tanamao_test_mode_v1'
};

export class AppStore {
  static getUsuarios(): Usuario[] {
    if (typeof window === 'undefined') return INITIAL_USUARIOS;
    const stored = localStorage.getItem(STORAGE_KEYS.USUARIOS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(INITIAL_USUARIOS));
      return INITIAL_USUARIOS;
    }
    return JSON.parse(stored);
  }

  static getBilhetes(): Bilhete[] {
    if (typeof window === 'undefined') return INITIAL_BILHETES;
    const stored = localStorage.getItem(STORAGE_KEYS.BILHETES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.BILHETES, JSON.stringify(INITIAL_BILHETES));
      return INITIAL_BILHETES;
    }
    return JSON.parse(stored);
  }

  static getSorteio(): Sorteio {
    if (typeof window === 'undefined') return INITIAL_SORTEIO;
    const stored = localStorage.getItem(STORAGE_KEYS.SORTEIO);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.SORTEIO, JSON.stringify(INITIAL_SORTEIO));
      return INITIAL_SORTEIO;
    }
    return JSON.parse(stored);
  }

  static getMensagens(): Mensagem[] {
    if (typeof window === 'undefined') return INITIAL_MENSAGENS;
    const stored = localStorage.getItem(STORAGE_KEYS.MENSAGENS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.MENSAGENS, JSON.stringify(INITIAL_MENSAGENS));
      return INITIAL_MENSAGENS;
    }
    return JSON.parse(stored);
  }

  static getCurrentUser(): Usuario | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  }

  static setCurrentUser(user: Usuario): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  static isTestMode(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEYS.TEST_MODE);
    return stored !== null ? stored === 'true' : true; // Por padrão inicia em MODO DE TESTE conforme especificado
  }

  static setTestMode(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TEST_MODE, String(enabled));
  }

  /**
   * Salva compra de bilhetes e atualiza usuário
   */
  static purchaseTickets(
    numeros: string[],
    userData: { nome_completo: string; cpf: string; whatsapp: string }
  ): { user: Usuario; newTickets: Bilhete[] } {
    const usuarios = this.getUsuarios();
    const bilhetes = this.getBilhetes();
    const sorteio = this.getSorteio();

    // Localiza ou cadastra usuário
    let user = usuarios.find(u => u.cpf.replace(/\D/g, '') === userData.cpf.replace(/\D/g, ''));
    if (!user) {
      user = {
        id: `usr_${Date.now()}`,
        nome_completo: userData.nome_completo,
        cpf: userData.cpf,
        whatsapp: userData.whatsapp.replace(/\D/g, ''),
        data_cadastro: new Date().toISOString()
      };
      usuarios.push(user);
    } else {
      user.nome_completo = userData.nome_completo;
      user.whatsapp = userData.whatsapp.replace(/\D/g, '');
    }

    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));
    this.setCurrentUser(user);

    // Cria os bilhetes
    const newTickets: Bilhete[] = numeros.map(num => ({
      id: `bilhete_${Date.now()}_${num}`,
      numero_milhar: num,
      usuario_id: user!.id,
      sorteio_id: sorteio.id,
      data_compra: new Date().toISOString(),
      status_pagamento: true,
      valor: 2.00
    }));

    const updatedBilhetes = [...bilhetes, ...newTickets];
    localStorage.setItem(STORAGE_KEYS.BILHETES, JSON.stringify(updatedBilhetes));

    return { user, newTickets };
  }

  /**
   * Realiza o sorteio com regras oficiais:
   * - Gera o milhar de 4 algarismos (0000 a 9999).
   * - Aos domingos: roleta gira até sair um vencedor caso haja bilhetes vendidos!
   * - Dispara WhatsApp para todos os cadastrados e para o vencedor.
   */
  static async executeDraw(options?: {
    forcedWinnerMilhar?: string;
    isSunday?: boolean;
  }): Promise<{ sorteio: Sorteio; ganhador: Usuario | null; milhar: string; mensagensGeradas: Mensagem[] }> {
    const bilhetes = this.getBilhetes();
    const usuarios = this.getUsuarios();
    const sorteio = this.getSorteio();
    const isSunday = options?.isSunday ?? sorteio.eh_domingo ?? false;

    let milharSorteado = '';
    let bilheteGanhador: Bilhete | undefined;

    if (options?.forcedWinnerMilhar) {
      milharSorteado = options.forcedWinnerMilhar;
      bilheteGanhador = bilhetes.find(b => b.numero_milhar === milharSorteado);
    } else if (isSunday && bilhetes.length > 0) {
      // Regra de domingo: gira a roleta até sair um vencedor
      const sorteioAleatorio = bilhetes[Math.floor(Math.random() * bilhetes.length)];
      milharSorteado = sorteioAleatorio.numero_milhar;
      bilheteGanhador = sorteioAleatorio;
    } else {
      // Sorteio diário padrão: número aleatório entre 0000 e 9999
      const randomNum = Math.floor(Math.random() * 10000);
      milharSorteado = randomNum.toString().padStart(4, '0');
      bilheteGanhador = bilhetes.find(b => b.numero_milhar === milharSorteado);
    }

    let ganhador: Usuario | null = null;
    let novoPremio = sorteio.premio;
    let acumulou = false;

    const novasMensagens: Mensagem[] = [];

    if (bilheteGanhador) {
      ganhador = usuarios.find(u => u.id === bilheteGanhador?.usuario_id) || null;
      acumulou = false;

      // Mensagem para todos os cadastrados informando o resultado
      const templateBroadcast = WhatsAppTemplates.resultadoComGanhador({
        milhar: milharSorteado,
        ganhadorNome: ganhador ? ganhador.nome_completo : 'Participante',
        telefoneMascarado: ganhador ? maskPhoneNumber(ganhador.whatsapp) : '(xx) xxxxx-****',
        premio: sorteio.premio
      });

      for (const u of usuarios) {
        const msg = await sendWhatsAppMessage({
          toPhone: u.whatsapp,
          recipientName: u.nome_completo,
          userId: u.id,
          content: templateBroadcast,
          type: 'resultado'
        });
        novasMensagens.push(msg);
      }

      // Mensagem exclusiva para o vencedor
      if (ganhador) {
        const msgVencedor = await sendWhatsAppMessage({
          toPhone: ganhador.whatsapp,
          recipientName: ganhador.nome_completo,
          userId: ganhador.id,
          content: WhatsAppTemplates.parabenizacaoGanhador({
            nomeCompleto: ganhador.nome_completo,
            milhar: milharSorteado,
            premio: sorteio.premio
          }),
          type: 'parabenizacao'
        });
        novasMensagens.push(msgVencedor);
      }
    } else {
      // Não houve ganhador -> Acumula R$ 500 para o próximo sorteio
      acumulou = true;
      novoPremio = sorteio.premio + 500;

      const templateAcumulado = WhatsAppTemplates.premioAcumulado({
        milhar: milharSorteado,
        novoPremio,
        ehDomingo: isSunday
      });

      for (const u of usuarios) {
        const msg = await sendWhatsAppMessage({
          toPhone: u.whatsapp,
          recipientName: u.nome_completo,
          userId: u.id,
          content: templateAcumulado,
          type: 'resultado'
        });
        novasMensagens.push(msg);
      }

      // REGRA OFICIAL: Não houve ganhador -> zera os bilhetes no sistema para iniciar a nova venda
      localStorage.setItem(STORAGE_KEYS.BILHETES, JSON.stringify([]));
    }

    const sorteioFinalizado: Sorteio = {
      ...sorteio,
      numeros_sorteados: milharSorteado,
      ganhador_id: ganhador ? ganhador.id : null,
      premio: novoPremio,
      status: 'finalizado',
      acumulado: acumulou,
      ganhador
    };

    localStorage.setItem(STORAGE_KEYS.SORTEIO, JSON.stringify(sorteioFinalizado));

    // Salva as mensagens geradas
    const mensagensExistentes = this.getMensagens();
    const todasMensagens = [...novasMensagens, ...mensagensExistentes];
    localStorage.setItem(STORAGE_KEYS.MENSAGENS, JSON.stringify(todasMensagens));

    return {
      sorteio: sorteioFinalizado,
      ganhador,
      milhar: milharSorteado,
      mensagensGeradas: novasMensagens
    };
  }

  /**
   * Dispara o lembrete diário das 18h / antes das 19h para todos
   */
  static async broadcastDailyReminder(): Promise<Mensagem[]> {
    const usuarios = this.getUsuarios();
    const novasMensagens: Mensagem[] = [];
    const conteudo = WhatsAppTemplates.lembrete();

    for (const u of usuarios) {
      const msg = await sendWhatsAppMessage({
        toPhone: u.whatsapp,
        recipientName: u.nome_completo,
        userId: u.id,
        content: conteudo,
        type: 'lembrete'
      });
      novasMensagens.push(msg);
    }

    const mensagensExistentes = this.getMensagens();
    localStorage.setItem(STORAGE_KEYS.MENSAGENS, JSON.stringify([...novasMensagens, ...mensagensExistentes]));
    return novasMensagens;
  }

  /**
   * Reseta o ciclo para o próximo sorteio (novo dia) e zera os bilhetes para a nova venda
   */
  static startNewDrawCycle(carryOverPrize?: number): Sorteio {
    const sorteioAnterior = this.getSorteio();
    let premioInicial = 500;

    if (carryOverPrize !== undefined) {
      premioInicial = carryOverPrize;
    } else if (sorteioAnterior.acumulado) {
      premioInicial = sorteioAnterior.premio;
    }

    // REGRA OFICIAL: Zera os bilhetes comprados do ciclo anterior para iniciar a nova venda
    localStorage.setItem(STORAGE_KEYS.BILHETES, JSON.stringify([]));

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(19, 0, 0, 0);

    const novoSorteio: Sorteio = {
      id: `sorteio_${Date.now()}`,
      data_sorteio: amanha.toISOString(),
      numeros_sorteados: null,
      ganhador_id: null,
      premio: premioInicial,
      acumulado: false,
      status: 'agendado',
      eh_domingo: amanha.getDay() === 0
    };

    localStorage.setItem(STORAGE_KEYS.SORTEIO, JSON.stringify(novoSorteio));
    return novoSorteio;
  }

  /**
   * Limpa e reseta todos os dados para o estado de fábrica
   */
  static resetToDefault(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(INITIAL_USUARIOS));
    localStorage.setItem(STORAGE_KEYS.BILHETES, JSON.stringify(INITIAL_BILHETES));
    localStorage.setItem(STORAGE_KEYS.SORTEIO, JSON.stringify(INITIAL_SORTEIO));
    localStorage.setItem(STORAGE_KEYS.MENSAGENS, JSON.stringify(INITIAL_MENSAGENS));
    localStorage.setItem(STORAGE_KEYS.TEST_MODE, 'true');
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}
