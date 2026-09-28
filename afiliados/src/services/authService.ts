import { MockDatabase } from './mockData';
import { Affiliate, UserProfile } from '../types';

const SESSION_KEY = 'tns_affiliates_session';

export class AuthService {
  /**
   * Retrieves the current logged in user.
   */
  static getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves full affiliate data for current user.
   */
  static getCurrentAffiliate(): Affiliate | null {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'affiliate') return null;
    const affiliates = MockDatabase.getAffiliates();
    return affiliates.find(a => a.id === user.uid) || null;
  }

  /**
   * Authenticates user via email/CPF and password.
   */
  static async login(identifier: string, pass: string): Promise<{ success: boolean; user?: UserProfile; affiliate?: Affiliate; error?: string }> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanDoc = identifier.replace(/\D/g, '');

    // 1. Check for Admin
    if (cleanId === 'admin@tanamaodasorte.com.br' || cleanId === 'admin') {
      if (pass === 'admin123' || pass.length >= 6) {
        const adminProfile: UserProfile = {
          uid: 'admin_master',
          email: 'admin@tanamaodasorte.com.br',
          role: 'admin',
          createdAt: '2026-01-01T00:00:00Z'
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(adminProfile));
        return { success: true, user: adminProfile };
      }
      return { success: false, error: 'Senha incorreta para a conta de administrador.' };
    }

    // 2. Check for Affiliate
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a =>
      a.email.toLowerCase() === cleanId ||
      a.documentNumber.replace(/\D/g, '') === cleanDoc
    );

    if (!aff) {
      return { success: false, error: 'Nenhum afiliado encontrado com este e-mail ou CPF.' };
    }

    if (pass.length < 6) {
      return { success: false, error: 'A senha informada está incorreta.' };
    }

    const profile: UserProfile = {
      uid: aff.id,
      email: aff.email,
      role: 'affiliate',
      createdAt: aff.createdAt
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    return { success: true, user: profile, affiliate: aff };
  }

  /**
   * Registers a new affiliate with validation and status "pendente".
   */
  static async register(params: Omit<Affiliate, 'id' | 'exclusiveCode' | 'status' | 'balanceAvailable' | 'balancePending' | 'balancePaid' | 'totalClicks' | 'totalConversions' | 'createdAt'>): Promise<{ success: boolean; affiliate?: Affiliate; error?: string }> {
    const affiliates = MockDatabase.getAffiliates();

    // Check duplicate email
    if (affiliates.some(a => a.email.toLowerCase() === params.email.trim().toLowerCase())) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
    }

    // Check duplicate CPF/CNPJ
    const cleanDoc = params.documentNumber.replace(/\D/g, '');
    if (affiliates.some(a => a.documentNumber.replace(/\D/g, '') === cleanDoc)) {
      return { success: false, error: 'Este CPF/CNPJ já possui cadastro ativo ou em análise.' };
    }

    // Generate unique code (e.g. LUCK-XXXX or name prefix)
    const prefix = params.fullName.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'LUCK';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${randNum}`;

    const newAffiliate: Affiliate = {
      ...params,
      id: `aff_${Date.now()}`,
      exclusiveCode: code,
      status: 'pendente',
      commissionRate: 0.15,
      balanceAvailable: 0,
      balancePending: 0,
      balancePaid: 0,
      totalClicks: 0,
      totalConversions: 0,
      createdAt: new Date().toISOString()
    };

    affiliates.unshift(newAffiliate);
    MockDatabase.saveAffiliates(affiliates);

    // Create default link for the new affiliate
    const links = MockDatabase.getLinks();
    links.unshift({
      id: `link_${Date.now()}`,
      affiliateId: newAffiliate.id,
      affiliateCode: code,
      destinationPath: '/',
      campaignName: 'padrao',
      fullUrl: `https://tanamaodasorte.com.br/?afiliado=${code}`,
      clicksCount: 0,
      conversionsCount: 0,
      revenueGenerated: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    });
    MockDatabase.saveLinks(links);

    // Create initial welcome notification
    const notifications = MockDatabase.getNotifications();
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: newAffiliate.id,
      title: 'Cadastro recebido com sucesso! ⏳',
      message: 'Recebemos sua solicitação de cadastro no programa de afiliados. Seu perfil está em análise e será liberado em breve.',
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    MockDatabase.saveNotifications(notifications);

    return { success: true, affiliate: newAffiliate };
  }

  /**
   * Resets password simulation.
   */
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const affiliates = MockDatabase.getAffiliates();
    const exists = affiliates.some(a => a.email.toLowerCase() === cleanEmail) || cleanEmail === 'admin@tanamaodasorte.com.br';

    if (!exists) {
      return { success: false, message: 'Nenhum usuário encontrado com este e-mail.' };
    }

    return {
      success: true,
      message: `Enviamos as instruções seguras de recuperação de senha para ${cleanEmail}. Verifique sua caixa de entrada.`
    };
  }

  /**
   * Clears session.
   */
  static logout(): void {
    localStorage.removeItem(SESSION_KEY);
  }
}
