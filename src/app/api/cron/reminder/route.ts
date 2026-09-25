import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';

/**
 * Endpoint de disparo automático diário de lembrete antes das 19h
 * Chamado pelo Vercel Cron ou manualmente pelo painel de controle
 */
export async function GET() {
  try {
    const result = await DatabaseService.broadcastDailyReminder();
    return NextResponse.json({
      success: true,
      message: `Lembrete diário disparado com sucesso para ${result.count} participante(s)!`,
      count: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no cron de lembrete diário:', error);
    return NextResponse.json(
      { error: 'Falha ao disparar lembretes diários' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
