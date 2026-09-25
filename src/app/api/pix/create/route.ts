import { NextResponse } from 'next/server';
import { createPixPayment } from '@/lib/mercadopago';
import { isSalesCutoffActive } from '@/lib/drawTime';

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
    const { amount, tickets, payerEmail, payerName, payerCpf, testMode } = body;

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum bilhete selecionado.' },
        { status: 400 }
      );
    }

    const calculatedAmount = tickets.length * 2.00;
    const finalAmount = amount || calculatedAmount;

    const paymentData = await createPixPayment({
      amount: finalAmount,
      tickets,
      description: `Tá Na Mão da SORTE - ${tickets.length} bilhete(s): ${tickets.slice(0, 3).join(', ')}${tickets.length > 3 ? '...' : ''}`,
      payerEmail,
      payerName,
      payerCpf,
      testMode
    });

    return NextResponse.json(paymentData);
  } catch (error) {
    console.error('Erro na criação do Pix:', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar a cobrança Pix.' },
      { status: 500 }
    );
  }
}
