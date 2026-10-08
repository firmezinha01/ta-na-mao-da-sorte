import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/mercadopago';
import { DatabaseService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const force = searchParams.get('force') === 'true';

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId obrigatório' }, { status: 400 });
    }

    const result = await checkPaymentStatus(paymentId, force);

    // Se o pagamento foi aprovado, auto-valida a reserva imediatamente no servidor
    if (result.status === 'approved') {
      const confirmRes = await DatabaseService.confirmReservationByPaymentId(paymentId, result.paymentData);
      return NextResponse.json({
        ...result,
        confirmed: confirmRes.success,
        tickets: confirmRes.tickets,
        user: confirmRes.user
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao verificar status do Pix:', error);
    return NextResponse.json({ status: 'pending', error: 'Erro interno' }, { status: 500 });
  }
}
