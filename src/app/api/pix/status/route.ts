import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/mercadopago';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const force = searchParams.get('force') === 'true';

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId obrigatório' }, { status: 400 });
    }

    const result = await checkPaymentStatus(paymentId, force);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao verificar status do Pix:', error);
    return NextResponse.json({ status: 'pending', error: 'Erro interno' }, { status: 500 });
  }
}
