import { Mensagem, TipoMensagem, Usuario } from '@/types';

export interface SendWhatsAppParams {
  toPhone: string;
  recipientName: string;
  userId: string;
  content: string;
  type: TipoMensagem;
}

/**
 * Formata o telefone para o padrão internacional do WhatsApp (DDI 55 Brasil)
 */
export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) {
    return digits;
  }
  return `55${digits}`;
}

/**
 * Mascara o telefone para exibição pública conforme a regra:
 * "O app mostra o primeiro nome e os 4 dígitos finais do telefone do vencedor"
 * Ex: "(11) 98765-4321" -> "(xx) xxxxx-4321"
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    return `(xx) xxxxx-${last4}`;
  }
  return '(xx) xxxxx-****';
}

/**
 * Extrai o primeiro nome de um nome completo
 */
export function getFirstName(fullName: string): string {
  if (!fullName) return 'Participante';
  return fullName.trim().split(' ')[0];
}

/**
 * Gera os templates oficiais de mensagem conforme requisitos do sistema
 */
export const WhatsAppTemplates = {
  lembrete: () => {
    return `📢 *Tá Na Mão da SORTE* 🍀\n\nAinda dá tempo de comprar seu bilhete para o sorteio de hoje às 19h! ⏰\n\nGaranta sua milhar por apenas *R$ 2,00* e concorra a um prêmio incrível!\nAcesse o app e escolha seus números da sorte! 🎟️`;
  },

  resultadoComGanhador: (params: { milhar: string; ganhadorNome: string; telefoneMascarado: string; premio: number }) => {
    const primeiroNome = getFirstName(params.ganhadorNome);
    const valorFormatado = params.premio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return `🎉 *RESULTADO DO SORTEIO - Tá Na Mão da SORTE* 🍀\n\n🔢 Milhar sorteado: *${params.milhar}*\n🏆 Ganhador(a): *${primeiroNome}* (${params.telefoneMascarado})\n💰 Prêmio: *${valorFormatado}*\n\nParabéns ao ganhador! Amanhã tem novo sorteio às 19h. Boa sorte a todos!`;
  },

  parabenizacaoGanhador: (params: { nomeCompleto: string; milhar: string; premio: number }) => {
    const valorFormatado = params.premio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return `🎊 *PARABÉNS, ${params.nomeCompleto.toUpperCase()}!* 🎊\n\nVocê é o grande vencedor do sorteio de hoje no *Tá Na Mão da SORTE*!\n\n🎟️ Seu bilhete premiado: *${params.milhar}*\n💰 Prêmio conquistado: *${valorFormatado}*\n\nNossa equipe entrará em contato em instantes por este número para realizar o seu PIX imediatamente! Parabéns! 🚀🍀`;
  },

  premioAcumulado: (params: { milhar: string; novoPremio: number; ehDomingo?: boolean }) => {
    const valorFormatado = params.novoPremio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (params.ehDomingo) {
      return `🎲 *DOMINGO DA SORTE - Tá Na Mão da SORTE* 🍀\n\nNeste domingo a roleta gira até sair um vencedor garantido do prêmio acumulado de *${valorFormatado}*! Fique ligado no app!`;
    }
    return `🔥 *ACUMULOU! - Tá Na Mão da SORTE* 🍀\n\n🔢 Milhar sorteado: *${params.milhar}*\nNenhum participante comprou esta milhar hoje. O prêmio ACUMULOU para o sorteio de amanhã!\n\n💰 Novo prêmio: *${valorFormatado}*\n\nAproveite e garanta já o seu bilhete para amanhã às 19h!`;
  }
};

/**
 * Envia uma mensagem via WhatsApp (Twilio / Evolution API / WhatsApp Business API ou Simulação)
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<Mensagem> {
  const formattedPhone = formatWhatsAppPhone(params.toPhone);
  const evolutionApiUrl = process.env.WHATSAPP_API_URL;
  const evolutionApiToken = process.env.WHATSAPP_API_TOKEN;

  let envioRealizado = false;

  // Se houver configuração de API externa (ex: Evolution API ou Z-API)
  if (evolutionApiUrl && evolutionApiToken) {
    try {
      const response = await fetch(`${evolutionApiUrl}/message/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiToken
        },
        body: JSON.stringify({
          number: formattedPhone,
          textMessage: {
            text: params.content
          }
        })
      });
      if (response.ok) {
        envioRealizado = true;
      }
    } catch (err) {
      console.warn('Falha no envio direto pela API externa do WhatsApp, gravando em log:', err);
    }
  }

  // Gera o registro da mensagem na estrutura do banco
  const mensagemCriada: Mensagem = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    usuario_id: params.userId,
    conteudo: params.content,
    tipo: params.type,
    data_envio: new Date().toISOString(),
    status_envio: envioRealizado ? 'entregue' : 'simulado_sucesso',
    destinatario_nome: params.recipientName,
    destinatario_whatsapp: formattedPhone
  };

  return mensagemCriada;
}

/**
 * Disparo em lote para múltiplos usuários
 */
export async function broadcastWhatsApp(
  usuarios: Usuario[],
  contentGenerator: (user: Usuario) => { content: string; type: TipoMensagem }
): Promise<Mensagem[]> {
  const resultados: Mensagem[] = [];

  for (const usuario of usuarios) {
    const { content, type } = contentGenerator(usuario);
    const msg = await sendWhatsAppMessage({
      toPhone: usuario.whatsapp,
      recipientName: usuario.nome_completo,
      userId: usuario.id,
      content,
      type
    });
    resultados.push(msg);
  }

  return resultados;
}

/**
 * Gera link do WhatsApp Web direto para teste prático
 */
export function generateWhatsAppWebLink(phone: string, text: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
