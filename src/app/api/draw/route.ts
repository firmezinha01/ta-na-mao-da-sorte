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
    let schedule = getNextDrawSchedule();
    const [draw, tickets] = await Promise.all([
      ServerDrawService.getCurrentOrScheduledDraw(),
      ServerDrawService.getConfirmedTickets()
    ]);
    const isCutoff = isSalesCutoffActive();

    // Se estiver em modo de Simulação dos 7 dias (Segunda a Domingo a cada 5 min)
    if (draw.id.startsWith('sorteio_simulacao_etapa_')) {
      const stepMatch = draw.id.match(/sorteio_simulacao_etapa_(\d+)/);
      const step = stepMatch ? parseInt(stepMatch[1], 10) : 1;
      const dayNames = [
        '',
        'Segunda-feira (Sorteio 1/7)',
        'Terça-feira (Sorteio 2/7)',
        'Quarta-feira (Sorteio 3/7)',
        'Quinta-feira (Sorteio 4/7)',
        'Sexta-feira (Sorteio 5/7)',
        'Sábado (Sorteio 6/7)',
        '🌟 DOMINGO DA SORTE (Sorteio 7/7)'
      ];
      const targetDate = new Date(draw.data_sorteio);
      const targetH = String(targetDate.getHours()).padStart(2, '0');
      const targetM = String(targetDate.getMinutes()).padStart(2, '0');

      schedule = {
        targetTimestamp: targetDate.getTime(),
        targetIso: draw.data_sorteio,
        label: `${targetH}:${targetM}h • ${dayNames[step] || `Etapa ${step}/7`}`,
        isSunday: step === 7,
        isTestMode: true
      };
    }

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
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, drawId, forcedWinnerMilhar, isSunday, delayMinutes } = body;

    if (action === 'start_week_simulation') {
      const step1 = await ServerDrawService.startWeekSimulation(delayMinutes || 5);
      return NextResponse.json({ success: true, draw: step1 });
    }

    if (action === 'new_cycle') {
      const newDraw = await ServerDrawService.startNewCycle();
      return NextResponse.json({ success: true, draw: newDraw });
    }

    // Ação padrão: Executa o sorteio oficial ou retorna o que já foi finalizado
    const result = await ServerDrawService.executeOfficialDraw({
      drawId,
      forcedWinnerMilhar,
      isSunday
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
