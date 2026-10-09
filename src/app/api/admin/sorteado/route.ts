import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sorteado
 * Retorna o ganhador programado atualmente ativo para o sorteio das 19h
 */
export async function GET() {
  try {
    const sorteado = await DatabaseService.getSorteadoProgramado();
    return NextResponse.json({
      success: true,
      sorteado
    });
  } catch (error) {
    console.error('Erro ao consultar sorteado programado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao consultar ganhador programado' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sorteado
 * Cadastra ou atualiza o apostador e milhar que vencerão o sorteio das 19h
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { nome_completo, cpf, whatsapp, numero_milhar } = body;

    if (!nome_completo || typeof nome_completo !== 'string' || !nome_completo.trim()) {
      return NextResponse.json(
        { success: false, error: 'O campo Nome Completo * é obrigatório.' },
        { status: 400 }
      );
    }

    const cleanCpf = String(cpf || '').replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length < 11) {
      return NextResponse.json(
        { success: false, error: 'O campo CPF * deve conter 11 dígitos numéricos.' },
        { status: 400 }
      );
    }

    const cleanWhatsapp = String(whatsapp || '').replace(/\D/g, '');
    if (!cleanWhatsapp || cleanWhatsapp.length < 10) {
      return NextResponse.json(
        { success: false, error: 'O campo WhatsApp com DDD * é obrigatório (mínimo 10 dígitos).' },
        { status: 400 }
      );
    }

    const cleanMilhar = String(numero_milhar ?? '').replace(/\D/g, '');
    if (cleanMilhar.length === 0 || cleanMilhar.length > 4) {
      return NextResponse.json(
        { success: false, error: 'O campo Milhar * deve conter até 4 dígitos (ex: 1234 ou 0421).' },
        { status: 400 }
      );
    }

    const sorteado = await DatabaseService.saveSorteadoProgramado({
      nome_completo: nome_completo.trim(),
      cpf: cleanCpf,
      whatsapp: cleanWhatsapp,
      numero_milhar: cleanMilhar.padStart(4, '0')
    });

    return NextResponse.json({
      success: true,
      message: 'Ganhador programado com sucesso para o sorteio das 19h!',
      sorteado
    });
  } catch (error) {
    console.error('Erro ao salvar ganhador programado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao registrar ganhador programado' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sorteado
 * Remove / cancela a programação do ganhador
 */
export async function DELETE() {
  try {
    await DatabaseService.clearSorteadoProgramado();
    return NextResponse.json({
      success: true,
      message: 'Ganhador programado cancelado com sucesso.'
    });
  } catch (error) {
    console.error('Erro ao cancelar ganhador programado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao cancelar programação' },
      { status: 500 }
    );
  }
}
