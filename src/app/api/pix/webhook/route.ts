import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook Mercado Pago recebido:', body);

    // Mercado Pago envia notificações no formato:
    // { action: 'payment.updated', data: { id: '123456789' }, type: 'payment' }
    if (body.type === 'payment' || body.action === 'payment.created' || body.action === 'payment.updated') {
      const paymentId = body.data?.id;
      // Em produção com chave real, consulta o status da transação:
      // const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, ...)
      return NextResponse.json({ received: true, paymentId, status: 'processed' });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no processamento do webhook MP:', error);
    return NextResponse.json({ error: 'Falha no webhook' }, { status: 500 });
  }
}
