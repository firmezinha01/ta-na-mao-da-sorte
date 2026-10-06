import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { affiliateCode, campaign } = body;

    if (!affiliateCode) {
      return NextResponse.json({ error: 'Código de afiliado obrigatório' }, { status: 400 });
    }

    const result = await DatabaseService.recordAffiliateClick(affiliateCode, campaign);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na API de track de afiliados:', error);
    return NextResponse.json({ error: 'Erro ao registrar clique' }, { status: 500 });
  }
}
