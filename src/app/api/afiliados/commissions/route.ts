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
    const rawCommissions = await DatabaseService.getCommissions(aff?.exclusiveCode || aff?.id || identifier);

    const enrichedCommissions = rawCommissions.map(c => {
      let buyerFirstName = c.buyerFirstName;
      if (!buyerFirstName) {
        if (c.buyerName && c.buyerName.trim()) {
          buyerFirstName = c.buyerName.trim().split(' ')[0];
        } else {
          buyerFirstName = 'Cliente';
        }
      }
      return {
        ...c,
        buyerFirstName
      };
    });

    const dynamicPending = enrichedCommissions
      .filter(c => c.status === 'pendente' || c.status === 'aprovada' || c.status === 'em_analise')
      .reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
    const dynamicAvailable = enrichedCommissions
      .filter(c => c.status === 'disponivel')
      .reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
    const dynamicPaid = enrichedCommissions
      .filter(c => c.status === 'pago')
      .reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
    const dynamicConversions = enrichedCommissions.filter(c => c.status !== 'cancelado' && c.status !== 'cancelada').length;

    const finalPending = Math.max(aff?.balancePending || 0, Number(dynamicPending.toFixed(2)));
    const finalAvailable = Math.max(aff?.balanceAvailable || 0, Number(dynamicAvailable.toFixed(2)));
    const finalPaid = Math.max(aff?.balancePaid || 0, Number(dynamicPaid.toFixed(2)));
    const finalConversions = Math.max(aff?.totalConversions || 0, dynamicConversions);

    return NextResponse.json({
      success: true,
      affiliate: aff ? {
        id: aff.id,
        fullName: aff.fullName,
        exclusiveCode: aff.exclusiveCode,
        status: aff.status,
        commissionRate: aff.commissionRate,
        balanceAvailable: finalAvailable,
        balancePending: finalPending,
        balancePaid: finalPaid,
        totalClicks: aff.totalClicks || 0,
        totalConversions: finalConversions
      } : null,
      commissions: enrichedCommissions
    });
  } catch (error: any) {
    console.error('Erro na API de comissões de afiliados:', error);
    return NextResponse.json({ error: 'Erro ao carregar comissões' }, { status: 500 });
  }
}
