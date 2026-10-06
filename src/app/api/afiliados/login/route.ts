import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'E-mail/CPF e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanDoc = identifier.replace(/\D/g, '');
    const pass = password.trim();

    // 1. Administrador do Sistema
    const isAdmin = (
      cleanId === 'admin@tanamaodasorte.com.br' ||
      cleanId === 'admin' ||
      cleanId === 'adm'
    );

    if (isAdmin) {
      const validAdminPasswords = ['sorte777', 'admin777', 'sorte2026', 'admin123'];
      if (validAdminPasswords.includes(pass)) {
        return NextResponse.json({
          success: true,
          user: {
            uid: 'admin_master',
            email: 'admin@tanamaodasorte.com.br',
            role: 'admin',
            createdAt: '2026-01-01T00:00:00Z'
          }
        });
      }
      return NextResponse.json(
        { success: false, error: 'Senha incorreta para a conta de administrador.' },
        { status: 401 }
      );
    }

    // 2. Afiliado
    const aff = await DatabaseService.getAffiliateByIdOrDoc(cleanId);
    if (!aff) {
      return NextResponse.json(
        { success: false, error: 'Nenhum afiliado encontrado com este e-mail ou CPF no banco de dados.' },
        { status: 404 }
      );
    }

    // Valida senha se cadastrada
    if (aff.password && aff.password !== pass) {
      return NextResponse.json(
        { success: false, error: 'Senha incorreta.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: aff.id,
        email: aff.email,
        role: 'affiliate',
        createdAt: aff.createdAt
      },
      affiliate: aff
    });
  } catch (error: any) {
    console.error('Erro na API de login de afiliado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao realizar login.' },
      { status: 500 }
    );
  }
}
