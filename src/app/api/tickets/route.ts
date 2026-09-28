import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tickets?cpf=...
 * Valida o CPF e retorna todos os bilhetes ativos vinculados àquele CPF
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCpf = searchParams.get('cpf');

    // Se não informou CPF ou solicitou all=true, retorna todos os bilhetes vendidos (Painel Administrativo)
    if (!rawCpf || searchParams.get('all') === 'true') {
      const tickets = await DatabaseService.getTickets();
      return NextResponse.json({
        success: true,
        tickets,
        total: tickets.length
      });
    }

    const cleanCpf = rawCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve conter exatamente 11 dígitos numéricos.' },
        { status: 400 }
      );
    }

    const { user, tickets } = await DatabaseService.getTicketsByCpf(cleanCpf);

    return NextResponse.json({
      success: true,
      user,
      tickets,
      total: tickets.length
    });
  } catch (error) {
    console.error('Erro na rota GET /api/tickets:', error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar bilhetes por CPF' },
      { status: 500 }
    );
  }
}
