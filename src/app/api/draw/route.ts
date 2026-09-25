import { NextResponse } from 'next/server';
import { ServerDrawService } from '@/lib/serverDraw';
import { getNextDrawSchedule, isSalesCutoffActive } from '@/lib/drawTime';

export const dynamic = 'force-dynamic';

/**
 * GET /api/draw
 * Retorna o estado oficial centralizado do sorteio, sincronização de tempo do servidor e bilhetes vendidos.
 */
export async function GET() {
  try {
    const serverTime = Date.now();
    const schedule = getNextDrawSchedule();
    const [draw, tickets] = await Promise.all([
      ServerDrawService.getCurrentOrScheduledDraw(),
      ServerDrawService.getConfirmedTickets()
    ]);
    const isCutoff = isSalesCutoffActive();

    return NextResponse.json({
      serverTime,
      draw,
      tickets,
      schedule,
      isCutoff
    });
  } catch (error) {
    console.error('Erro em GET /api/draw:', error);
    return NextResponse.json({ error: 'Erro ao consultar sorteio central' }, { status: 500 });
  }
}

/**
 * POST /api/draw
 * Executa o sorteio de forma centralizada e 100% atômica no servidor.
 * Retorna exatamente o mesmo resultado para computador, celular e qualquer dispositivo.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, drawId, forcedWinnerMilhar } = body;

    if (action === 'new_cycle') {
      const newDraw = await ServerDrawService.startNewCycle();
      return NextResponse.json({ success: true, draw: newDraw });
    }

    // Ação padrão: Executa o sorteio oficial ou retorna o que já foi finalizado
    const result = await ServerDrawService.executeOfficialDraw({
      drawId,
      forcedWinnerMilhar
    });

    return NextResponse.json({
      success: true,
      sorteio: result.sorteio,
      milhar: result.milhar,
      ganhador: result.ganhador,
      mensagensGeradas: result.mensagensGeradas
    });
  } catch (error) {
    console.error('Erro em POST /api/draw:', error);
    return NextResponse.json({ error: 'Erro ao executar sorteio central' }, { status: 500 });
  }
}
