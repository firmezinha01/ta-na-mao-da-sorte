import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/mercadopago';
import { DatabaseService } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Webhook Oficial Mercado Pago (Instant Payment Notification - IPN)
 * Notifica automaticamente assim que o cliente conclui o Pix em seu banco,
 * validando a reserva e vinculando permanentemente as milhares ao participante.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let paymentId: string | null = url.searchParams.get('data.id') || url.searchParams.get('id');

    let body: any = null;
    try {
      body = await request.json();
    } catch {
      // Corpo vazio ou não JSON
    }

    if (!paymentId && body) {
      paymentId = body?.data?.id || body?.id || null;
    }

    console.log('[Webhook MP] Notificação recebida:', {
      paymentId,
      action: body?.action,
      type: body?.type,
      topic: url.searchParams.get('topic')
    });

    if (paymentId) {
      const paymentIdStr = String(paymentId);
      // Consulta Mercado Pago de forma confiável
      const statusRes = await checkPaymentStatus(paymentIdStr);
      console.log(`[Webhook MP] Status retornado para ${paymentIdStr}: ${statusRes.status}`);

      if (statusRes.status === 'approved') {
        const confirmResult = await DatabaseService.confirmReservationByPaymentId(
          paymentIdStr,
          statusRes.paymentData
        );

        console.log(`[Webhook MP] Reserva confirmada para ${paymentIdStr}:`, {
          success: confirmResult.success,
          alreadyConfirmed: confirmResult.alreadyConfirmed,
          buyer: confirmResult.user?.nome_completo
        });

        return NextResponse.json({
          received: true,
          paymentId: paymentIdStr,
          status: 'approved',
          confirmed: confirmResult.success
        });
      }

      return NextResponse.json({
        received: true,
        paymentId: paymentIdStr,
        status: statusRes.status
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no processamento do webhook MP:', error);
    // Retorna 200 para o Mercado Pago não reenviar infinitamente caso seja erro interno transitório
    return NextResponse.json({ error: 'Erro interno no processamento', received: true }, { status: 200 });
  }
}

/**
 * Suporte a requisição GET para healthchecks e validação de URL do Mercado Pago
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (paymentId) {
      const paymentIdStr = String(paymentId);
      const statusRes = await checkPaymentStatus(paymentIdStr);
      if (statusRes.status === 'approved') {
        await DatabaseService.confirmReservationByPaymentId(paymentIdStr, statusRes.paymentData);
      }
      return NextResponse.json({ received: true, paymentId: paymentIdStr, status: statusRes.status });
    }

    return NextResponse.json({ ok: true, message: 'Webhook endpoint online' });
  } catch (error) {
    console.error('Erro em GET Webhook MP:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
