import { MockDatabase } from './mockData';
import { Affiliate, PaymentRequest, PromotionalMaterial, SystemSettings } from '../types';

export class AdminService {
  /**
   * Approves an affiliate application.
   */
  static approveAffiliate(affiliateId: string, adminEmail = 'admin@tanamaodasorte.com.br'): boolean {
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.id === affiliateId);
    if (!aff) return false;

    aff.status = 'aprovado';
    aff.approvedAt = new Date().toISOString();
    aff.approvedBy = adminEmail;
    MockDatabase.saveAffiliates(affiliates);

    // Notification for affiliate
    const notifs = MockDatabase.getNotifications();
    notifs.unshift({
      id: `notif_${Date.now()}`,
      userId: aff.id,
      title: 'Cadastro Aprovado com Sucesso! 🎉',
      message: 'Parabéns! Sua conta de afiliado foi aprovada. Seu link exclusivo já está ativo e pronto para você divulgar e lucrar no Pix!',
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    MockDatabase.saveNotifications(notifs);

    this.logAction(adminEmail, 'approve_affiliate', aff.id, { name: aff.fullName, code: aff.exclusiveCode });
    return true;
  }

  /**
   * Rejects an affiliate application.
   */
  static rejectAffiliate(affiliateId: string, reason: string, adminEmail = 'admin@tanamaodasorte.com.br'): boolean {
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.id === affiliateId);
    if (!aff) return false;

    aff.status = 'recusado';
    aff.rejectionReason = reason;
    MockDatabase.saveAffiliates(affiliates);

    const notifs = MockDatabase.getNotifications();
    notifs.unshift({
      id: `notif_${Date.now()}`,
      userId: aff.id,
      title: 'Atualização do seu cadastro',
      message: `Infelizmente seu cadastro não foi aprovado pelo seguinte motivo: ${reason}`,
      type: 'warning',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    MockDatabase.saveNotifications(notifs);

    this.logAction(adminEmail, 'reject_affiliate', aff.id, { reason });
    return true;
  }

  /**
   * Suspends an affiliate account.
   */
  static suspendAffiliate(affiliateId: string, reason: string, adminEmail = 'admin@tanamaodasorte.com.br'): boolean {
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.id === affiliateId);
    if (!aff) return false;

    aff.status = 'suspenso';
    aff.rejectionReason = reason;
    MockDatabase.saveAffiliates(affiliates);

    this.logAction(adminEmail, 'suspend_affiliate', aff.id, { reason });
    return true;
  }

  /**
   * Reactivates a suspended affiliate account.
   */
  static reactivateAffiliate(affiliateId: string, adminEmail = 'admin@tanamaodasorte.com.br'): boolean {
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.id === affiliateId);
    if (!aff) return false;

    aff.status = 'aprovado';
    delete aff.rejectionReason;
    MockDatabase.saveAffiliates(affiliates);

    this.logAction(adminEmail, 'reactivate_affiliate', aff.id, { name: aff.fullName });
    return true;
  }

  /**
   * Updates commission rate for an individual affiliate.
   */
  static updateAffiliateCommissionRate(affiliateId: string, newRate: number, adminEmail = 'admin@tanamaodasorte.com.br'): boolean {
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.id === affiliateId);
    if (!aff) return false;

    aff.commissionRate = newRate;
    MockDatabase.saveAffiliates(affiliates);

    this.logAction(adminEmail, 'update_affiliate_rate', aff.id, { newRate });
    return true;
  }

  /**
   * Approves and records a Pix payout as paid.
   */
  static approvePayout(paymentId: string, pixTransactionId: string, adminEmail = 'admin@tanamaodasorte.com.br'): boolean {
    const payments = MockDatabase.getPayments();
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return false;

    payment.status = 'pago';
    payment.pixTransactionId = pixTransactionId || `E000${Date.now()}TNSPIX`;
    payment.processedAt = new Date().toISOString();
    payment.processedBy = adminEmail;
    MockDatabase.savePayments(payments);

    // Update affiliate total paid
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.id === payment.affiliateId);
    if (aff) {
      aff.balancePaid = Number(((aff.balancePaid || 0) + payment.requestedAmount).toFixed(2));
      MockDatabase.saveAffiliates(affiliates);
    }

    // Send notification
    const notifs = MockDatabase.getNotifications();
    notifs.unshift({
      id: `notif_${Date.now()}`,
      userId: payment.affiliateId,
      title: 'Saque Pix Concluído! 💸🍀',
      message: `Seu pagamento no valor de R$ ${payment.requestedAmount.toFixed(2)} foi transferido com sucesso para a Chave Pix cadastrada. ID End-to-End: ${payment.pixTransactionId}`,
      type: 'payment',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    MockDatabase.saveNotifications(notifs);

    this.logAction(adminEmail, 'approve_payout', payment.id, {
      amount: payment.requestedAmount,
      pixTransactionId: payment.pixTransactionId
    });
    return true;
  }

  /**
   * Rejects a payout request and refunds balance to affiliate.
   */
  static rejectPayout(paymentId: string, reason: string, adminEmail = 'admin@tanamaodasorte.com.br'): boolean {
    const payments = MockDatabase.getPayments();
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return false;

    payment.status = 'recusado';
    payment.rejectionReason = reason;
    payment.processedAt = new Date().toISOString();
    payment.processedBy = adminEmail;
    MockDatabase.savePayments(payments);

    // Refund available balance
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.id === payment.affiliateId);
    if (aff) {
      aff.balanceAvailable = Number(((aff.balanceAvailable || 0) + payment.requestedAmount).toFixed(2));
      MockDatabase.saveAffiliates(affiliates);
    }

    // Send notification
    const notifs = MockDatabase.getNotifications();
    notifs.unshift({
      id: `notif_${Date.now()}`,
      userId: payment.affiliateId,
      title: 'Saque Pix Recusado / Estornado',
      message: `Sua solicitação de saque de R$ ${payment.requestedAmount.toFixed(2)} foi recusada pelo seguinte motivo: ${reason}. O valor foi estornado para o seu saldo disponível.`,
      type: 'warning',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    MockDatabase.saveNotifications(notifs);

    this.logAction(adminEmail, 'reject_payout', payment.id, { reason });
    return true;
  }

  /**
   * Adds a promotional material item.
   */
  static addMaterial(material: Omit<PromotionalMaterial, 'id' | 'createdAt'>): PromotionalMaterial {
    const materials = MockDatabase.getMaterials();
    const newMat: PromotionalMaterial = {
      ...material,
      id: `mat_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    materials.unshift(newMat);
    MockDatabase.saveMaterials(materials);
    return newMat;
  }

  /**
   * Removes a promotional material item.
   */
  static deleteMaterial(id: string): boolean {
    const materials = MockDatabase.getMaterials();
    const filtered = materials.filter(m => m.id !== id);
    MockDatabase.saveMaterials(filtered);
    return true;
  }

  /**
   * Updates global settings.
   */
  static updateSettings(settings: Partial<SystemSettings>, adminEmail = 'admin@tanamaodasorte.com.br'): SystemSettings {
    const current = MockDatabase.getSettings();
    const updated = { ...current, ...settings };
    MockDatabase.saveSettings(updated);
    this.logAction(adminEmail, 'update_settings', 'general', settings);
    return updated;
  }

  /**
   * Internal audit logging.
   */
  private static logAction(adminEmail: string, action: string, targetId: string, details: Record<string, any>): void {
    const logs = MockDatabase.getAuditLogs();
    logs.unshift({
      id: `log_${Date.now()}`,
      adminId: 'admin_master',
      adminEmail,
      action,
      targetId,
      details,
      timestamp: new Date().toISOString()
    });
    MockDatabase.saveAuditLogs(logs);
  }
}
