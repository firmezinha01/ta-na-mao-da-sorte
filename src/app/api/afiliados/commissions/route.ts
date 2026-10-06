import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');
    const affiliateCode = searchParams.get('affiliateCode');
    const role = searchParams.get('role');

    if (role === 'admin') {
      const allCommissions = await DatabaseService.getCommissions('all');
      const affiliates = await DatabaseService.getAffiliates();
      return NextResponse.json({
        success: true,
        commissions: allCommissions,
        affiliates,
        totalSales: allCommissions.reduce((acc, c) => acc + (c.orderAmount || 0), 0),
        totalCommissions: allCommissions.reduce((acc, c) => acc + (c.commissionAmount || 0), 0)
      });
    }

    const identifier = affiliateCode || affiliateId;
    if (!identifier) {
      return NextResponse.json(
        { error: 'affiliateCode ou affiliateId é obrigatório' },
        { status: 400 }
      );
    }

    const aff = await DatabaseService.getAffiliateByIdOrDoc(identifier);
    const commissions = await DatabaseService.getCommissions(aff?.exclusiveCode || identifier);

    return NextResponse.json({
      success: true,
      affiliate: aff ? {
        id: aff.id,
        fullName: aff.fullName,
        exclusiveCode: aff.exclusiveCode,
        status: aff.status,
        commissionRate: aff.commissionRate,
        balanceAvailable: aff.balanceAvailable || 0,
        balancePending: aff.balancePending || 0,
        balancePaid: aff.balancePaid || 0,
        totalClicks: aff.totalClicks || 0,
        totalConversions: aff.totalConversions || 0
      } : null,
      commissions
    });
  } catch (error: any) {
    console.error('Erro na API de comissões de afiliados:', error);
    return NextResponse.json({ error: 'Erro ao carregar comissões' }, { status: 500 });
  }
}
