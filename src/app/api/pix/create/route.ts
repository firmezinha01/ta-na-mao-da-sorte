import { NextResponse } from 'next/server';
import { createPixPayment } from '@/lib/mercadopago';
import { isSalesCutoffActive } from '@/lib/drawTime';
import { DatabaseService } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // REGRA OFICIAL: A última compra de cada dia pode ser feita até as 18:55h.
    // Entre 18:55 e as 19:05, as vendas ficam suspensas para a realização do sorteio das 19h.
    if (isSalesCutoffActive()) {
      return NextResponse.json(
        { 
          error: 'Vendas encerradas temporariamente para o sorteio de hoje (bloqueio das 18:55 às 19:05). O sorteio acontece às 19:00h. Volte logo após a apuração!' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      amount, 
      tickets, 
      payerEmail, 
      payerName, 
      payerCpf, 
      payerWhatsapp, 
      affiliateCode, 
      campaign, 
      testMode 
    } = body;

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum bilhete selecionado.' },
        { status: 400 }
      );
    }

    const sanitizedTickets = [...new Set(tickets.map((t: string) => String(t).trim()))];

    // 1. Verifica se algum dos números já foi adquirido ou está em reserva ativa
    const [soldTickets, reservedData] = await Promise.all([
      DatabaseService.getTickets(),
      DatabaseService.getReservedTickets()
    ]);

    const soldSet = new Set(soldTickets.map(b => b.numero_milhar));
    const alreadySold = sanitizedTickets.filter(n => soldSet.has(n));
    if (alreadySold.length > 0) {
      return NextResponse.json(
        { error: `O(s) bilhete(s) ${alreadySold.join(', ')} já foi(ram) adquirido(s). Por favor, escolha outro(s) número(s).` },
        { status: 409 }
      );
    }

    const reservedSet = new Set(reservedData.tickets);
    const alreadyReserved = sanitizedTickets.filter(n => reservedSet.has(n));
    if (alreadyReserved.length > 0) {
      return NextResponse.json(
        { error: `O(s) bilhete(s) ${alreadyReserved.join(', ')} já está(ão) reservado(s) aguardando pagamento Pix de outro participante.` },
        { status: 409 }
      );
    }

    const calculatedAmount = sanitizedTickets.length * 2.00;
    const finalAmount = amount || calculatedAmount;

    // 2. Gera a cobrança Pix Oficial no Mercado Pago
    const paymentData = await createPixPayment({
      amount: finalAmount,
      tickets: sanitizedTickets,
      description: `Tá Na Mão da SORTE - ${sanitizedTickets.length} bilhete(s): ${sanitizedTickets.slice(0, 3).join(', ')}${sanitizedTickets.length > 3 ? '...' : ''}`,
      payerEmail,
      payerName,
      payerCpf,
      payerWhatsapp,
      affiliateCode,
      campaign,
      testMode
    });

    // 3. Registra a reserva dos números no banco de dados com validade de 15 minutos
    const reserveResult = await DatabaseService.createTicketReservation({
      paymentId: String(paymentData.paymentId),
      tickets: sanitizedTickets,
      amount: finalAmount,
      userName: payerName || 'Participante da Sorte',
      userCpf: payerCpf || '',
      userWhatsapp: payerWhatsapp || '',
      userEmail: payerEmail,
      affiliateCode,
      campaign,
      expiresMinutes: 15
    });

    if (!reserveResult.success) {
      console.warn('Alerta na reserva de bilhetes:', reserveResult.error);
    }

    return NextResponse.json(paymentData);
  } catch (error) {
    console.error('Erro na criação do Pix:', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar a cobrança Pix.' },
      { status: 500 }
    );
  }
}
