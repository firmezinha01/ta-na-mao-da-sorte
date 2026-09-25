import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';

export async function GET() {
  try {
    const participants = await DatabaseService.getParticipants();
    const tickets = await DatabaseService.getTickets();

    // Agrupa contagem de bilhetes por participante
    const userTicketsCount: Record<string, number> = {};
    for (const t of tickets) {
      userTicketsCount[t.usuario_id] = (userTicketsCount[t.usuario_id] || 0) + 1;
    }

    const enriched = participants.map(u => ({
      ...u,
      total_bilhetes: userTicketsCount[u.id] || 0
    }));

    return NextResponse.json({ participants: enriched, total: enriched.length });
  } catch (error) {
    console.error('Erro ao buscar participantes:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar participantes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome_completo, cpf, whatsapp, tickets, paymentId } = body;

    if (!nome_completo || !cpf || !whatsapp) {
      return NextResponse.json(
        { error: 'Nome completo, CPF e WhatsApp são obrigatórios.' },
        { status: 400 }
      );
    }

    const result = await DatabaseService.saveParticipant({
      nome_completo,
      cpf,
      whatsapp,
      tickets: tickets || [],
      paymentId
    });

    return NextResponse.json({
      success: true,
      message: 'Participante e bilhetes cadastrados com sucesso!',
      user: result.user,
      ticketsCount: result.newTickets.length
    });
  } catch (error) {
    console.error('Erro ao salvar participante:', error);
    return NextResponse.json(
      { error: 'Erro interno ao salvar participante' },
      { status: 500 }
    );
  }
}
