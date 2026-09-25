import { NextResponse } from 'next/server';
import { createPixPayment } from '@/lib/mercadopago';

export async function POST(request: Request) {
  try {
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
