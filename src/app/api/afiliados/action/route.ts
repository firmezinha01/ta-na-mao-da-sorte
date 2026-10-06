import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { affiliateId, action, rejectionReason, approvedBy } = body;

    if (!affiliateId || !action) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos.' },
        { status: 400 }
      );
    }

    let status: 'aprovado' | 'recusado' | 'suspenso' | 'pendente' = 'pendente';
    if (action === 'approve') status = 'aprovado';
    else if (action === 'reject') status = 'recusado';
    else if (action === 'suspend') status = 'suspenso';
    else if (action === 'reactivate') status = 'aprovado';

    const result = await DatabaseService.updateAffiliateStatus(affiliateId, status, rejectionReason, approvedBy);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao atualizar afiliado no banco de dados.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Status atualizado para ${status} com sucesso.`
    });
  } catch (error: any) {
    console.error('Erro na API de ação de afiliado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar afiliado no banco de dados.' },
      { status: 500 }
    );
  }
}
