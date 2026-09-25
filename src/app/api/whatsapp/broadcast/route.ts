import { NextResponse } from 'next/server';
import { WhatsAppTemplates, sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, recipients, drawData } = body;

    let messageTemplate = '';
    if (type === 'lembrete') {
      messageTemplate = WhatsAppTemplates.lembrete();
    } else if (type === 'resultado' && drawData?.winnerName) {
      messageTemplate = WhatsAppTemplates.resultadoComGanhador({
        milhar: drawData.milhar,
        ganhadorNome: drawData.winnerName,
        telefoneMascarado: drawData.maskedPhone,
        premio: drawData.prize
      });
    } else if (type === 'resultado' && !drawData?.winnerName) {
      messageTemplate = WhatsAppTemplates.premioAcumulado({
        milhar: drawData.milhar,
        novoPremio: drawData.newPrize,
        ehDomingo: drawData.isSunday
      });
    }

    const results = [];
    if (Array.isArray(recipients)) {
      for (const rec of recipients) {
        const res = await sendWhatsAppMessage({
          toPhone: rec.whatsapp,
          recipientName: rec.nome_completo,
          userId: rec.id,
          content: messageTemplate,
          type
        });
        results.push(res);
      }
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error) {
    console.error('Erro no broadcast de WhatsApp:', error);
    return NextResponse.json({ error: 'Erro ao disparar mensagens WhatsApp' }, { status: 500 });
  }
}
