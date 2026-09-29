import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';
import { Affiliate } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      password,
      documentType,
      documentNumber,
      phone,
      whatsapp,
      birthDate,
      city,
      state,
      pixKeyType,
      pixKey,
      socialChannels,
      promotionStrategy,
      termsAcceptedAt,
      privacyAcceptedAt
    } = body;

    if (!fullName || !email || !documentNumber || !phone || !whatsapp) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanDoc = documentNumber.replace(/\D/g, '');

    // Verifica se já existe por e-mail ou documento
    const existing = await DatabaseService.getAffiliateByIdOrDoc(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Este e-mail ou CPF/CNPJ já possui cadastro.' },
        { status: 400 }
      );
    }

    // Gera código exclusivo único
    const prefix = fullName.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'LUCK';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${randNum}`;

    const newAffiliate: Affiliate = {
      id: `aff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      password: password || '',
      documentType: documentType || 'CPF',
      documentNumber: cleanDoc,
      phone: phone.replace(/\D/g, ''),
      whatsapp: whatsapp.replace(/\D/g, ''),
      birthDate: birthDate || undefined,
      city: (city || '').trim(),
      state: (state || '').trim(),
      exclusiveCode: code,
      status: 'pendente',
      commissionRate: 0.15,
      pixKeyType: pixKeyType || 'CPF',
      pixKey: (pixKey || '').trim(),
      socialChannels: (socialChannels || '').trim(),
      promotionStrategy: (promotionStrategy || '').trim(),
      balanceAvailable: 0,
      balancePending: 0,
      balancePaid: 0,
      totalClicks: 0,
      totalConversions: 0,
      termsAcceptedAt: termsAcceptedAt || new Date().toISOString(),
      privacyAcceptedAt: privacyAcceptedAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const result = await DatabaseService.saveAffiliate(newAffiliate);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao salvar no banco de dados.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      affiliate: result.affiliate
    });
  } catch (error: any) {
    console.error('Erro na API de cadastro de afiliado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar cadastro no banco de dados.' },
      { status: 500 }
    );
  }
}
