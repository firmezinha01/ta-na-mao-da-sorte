import { MockDatabase } from './mockData';
import { Affiliate, AffiliateLink, PaymentRequest, SystemNotification } from '../types';

export class AffiliateService {
  /**
   * Requests a Pix payout.
   */
  static requestPayout(affiliateId: string, amount: number): { success: boolean; message: string; payment?: PaymentRequest } {
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.id === affiliateId);
    if (!aff) {
      return { success: false, message: 'Afiliado não encontrado.' };
    }

    if (aff.status !== 'aprovado') {
      return { success: false, message: 'Sua conta precisa estar aprovada para solicitar pagamentos.' };
    }

    const settings = MockDatabase.getSettings();
    if (amount < settings.minimumPayoutAmount) {
      return { success: false, message: `O valor mínimo para solicitação de saque é de R$ ${settings.minimumPayoutAmount.toFixed(2)}.` };
    }

    if (aff.balanceAvailable < amount) {
      return { success: false, message: 'Saldo disponível insuficiente para realizar este saque.' };
    }

    if (!aff.pixKey || !aff.pixKeyType) {
      return { success: false, message: 'Cadastre sua Chave Pix antes de solicitar um pagamento.' };
    }

    // Deduct from available balance
    aff.balanceAvailable = Number((aff.balanceAvailable - amount).toFixed(2));
    MockDatabase.saveAffiliates(affiliates);

    // Create payment request
    const payments = MockDatabase.getPayments();
    const newPayment: PaymentRequest = {
      id: `pay_${Date.now()}`,
      affiliateId: aff.id,
      affiliateName: aff.fullName,
      affiliateDocument: aff.documentNumber,
      requestedAmount: amount,
      pixKeyType: aff.pixKeyType,
      pixKey: aff.pixKey,
      status: 'solicitado',
      requestedAt: new Date().toISOString()
    };
    payments.unshift(newPayment);
    MockDatabase.savePayments(payments);

    // Notification for affiliate
    const notifications = MockDatabase.getNotifications();
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: aff.id,
      title: 'Solicitação de Saque Enviada 💸',
      message: `Sua solicitação de saque de R$ ${amount.toFixed(2)} foi recebida e está em análise pelo departamento financeiro.`,
      type: 'payment',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    MockDatabase.saveNotifications(notifications);

    return {
      success: true,
      message: 'Solicitação de saque enviada com sucesso! Em breve o valor será transferido para sua Chave Pix.',
      payment: newPayment
    };
  }

  /**
   * Updates affiliate profile.
   */
  static updateProfile(affiliateId: string, updates: Partial<Affiliate>): { success: boolean; message: string; affiliate?: Affiliate } {
    const affiliates = MockDatabase.getAffiliates();
    const index = affiliates.findIndex(a => a.id === affiliateId);
    if (index === -1) {
      return { success: false, message: 'Afiliado não encontrado.' };
    }

    // Protect sensitive fields from direct tampering
    const safeUpdates: Partial<Affiliate> = {
      fullName: updates.fullName,
      phone: updates.phone,
      whatsapp: updates.whatsapp,
      city: updates.city,
      state: updates.state,
      socialChannels: updates.socialChannels,
      promotionStrategy: updates.promotionStrategy,
      pixKey: updates.pixKey,
      pixKeyType: updates.pixKeyType
    };

    affiliates[index] = { ...affiliates[index], ...safeUpdates };
    MockDatabase.saveAffiliates(affiliates);

    return {
      success: true,
      message: 'Dados cadastrais atualizados com sucesso!',
      affiliate: affiliates[index]
    };
  }

  /**
   * Generates a new tracking link with campaign tags.
   */
  static createLink(affiliateId: string, affiliateCode: string, destinationPath: string, campaignName: string): { success: boolean; link?: AffiliateLink; message?: string } {
    const cleanCamp = campaignName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'campanha';
    const baseUrl = 'https://tanamaodasorte.com.br';
    const path = destinationPath.startsWith('/') ? destinationPath : `/${destinationPath}`;
    const fullUrl = `${baseUrl}${path}?afiliado=${affiliateCode}&campanha=${cleanCamp}`;

    const links = MockDatabase.getLinks();
    const newLink: AffiliateLink = {
      id: `link_${Date.now()}`,
      affiliateId,
      affiliateCode,
      destinationPath: path,
      campaignName: cleanCamp,
      fullUrl,
      clicksCount: 0,
      conversionsCount: 0,
      revenueGenerated: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    links.unshift(newLink);
    MockDatabase.saveLinks(links);

    return { success: true, link: newLink };
  }

  /**
   * Toggles link status.
   */
  static toggleLink(linkId: string): boolean {
    const links = MockDatabase.getLinks();
    const link = links.find(l => l.id === linkId);
    if (link) {
      link.isActive = !link.isActive;
      MockDatabase.saveLinks(links);
      return true;
    }
    return false;
  }

  /**
   * Marks a notification as read.
   */
  static markNotificationRead(notifId: string): void {
    const notifs = MockDatabase.getNotifications();
    const n = notifs.find(item => item.id === notifId);
    if (n) {
      n.isRead = true;
      MockDatabase.saveNotifications(notifs);
    }
  }

  /**
   * Marks all notifications as read.
   */
  static markAllNotificationsRead(userId: string): void {
    const notifs = MockDatabase.getNotifications();
    notifs.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    MockDatabase.saveNotifications(notifs);
  }
}
