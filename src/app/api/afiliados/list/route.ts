import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';

export async function GET() {
  try {
    const affiliates = await DatabaseService.getAffiliates();
    return NextResponse.json({
      success: true,
      affiliates,
      total: affiliates.length
    });
  } catch (error: any) {
    console.error('Erro na API de listagem de afiliados:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar afiliados no banco de dados.' },
      { status: 500 }
    );
  }
}
