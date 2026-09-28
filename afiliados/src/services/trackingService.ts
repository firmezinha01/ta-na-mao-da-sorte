import { MockDatabase } from './mockData';
import { Commission, ConversionRecord } from '../types';

const COOKIE_NAME = '_tns_aff';
const COOKIE_DAYS = 30;

export interface TrackingData {
  affiliateCode: string;
  campaign?: string;
  trackedAt: string;
}

export class TrackingService {
  /**
   * Sets the affiliate tracking cookie and localStorage.
   */
  static setTrackingCookie(data: TrackingData): void {
    const d = new Date();
    d.setTime(d.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))};${expires};path=/;SameSite=Lax`;
    localStorage.setItem(COOKIE_NAME, JSON.stringify(data));
  }

  /**
   * Gets the active tracking data if present.
   */
  static getTrackingData(): TrackingData | null {
    // 1. Try cookie
    const name = COOKIE_NAME + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        try {
          return JSON.parse(c.substring(name.length, c.length));
        } catch {
          // fallback to localStorage
        }
      }
    }

    // 2. Try localStorage
    try {
      const local = localStorage.getItem(COOKIE_NAME);
      if (local) return JSON.parse(local);
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Captures ?afiliado= or ?ref= from the current window location.
   */
  static initUrlTracking(): TrackingData | null {
    const urlParams = new URLSearchParams(window.location.search);
    const affiliateCode = urlParams.get('afiliado') || urlParams.get('ref') || urlParams.get('aff');
    const campaign = urlParams.get('campanha') || urlParams.get('utm_campaign') || undefined;

    if (affiliateCode) {
      const data: TrackingData = {
        affiliateCode: affiliateCode.trim().toUpperCase(),
        campaign: campaign ? campaign.trim() : undefined,
        trackedAt: new Date().toISOString()
      };
      this.setTrackingCookie(data);
      this.recordClick(data.affiliateCode, data.campaign);
      return data;
    }

    return this.getTrackingData();
  }

  /**
   * Records a click with deduplication.
   */
  static recordClick(affiliateCode: string, campaign?: string): boolean {
    const now = Date.now();
    const lastClickKey = `_tns_last_click_${affiliateCode}`;
    const lastClickTime = Number(sessionStorage.getItem(lastClickKey) || '0');

    // Anti-spam deduplication: 1 click per session/15min
    if (now - lastClickTime < 15 * 60 * 1000) {
      return false;
    }

    sessionStorage.setItem(lastClickKey, String(now));

    // Update in MockDatabase
    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.exclusiveCode.toUpperCase() === affiliateCode.toUpperCase());
    if (aff) {
      aff.totalClicks = (aff.totalClicks || 0) + 1;
      MockDatabase.saveAffiliates(affiliates);

      // Update link if matching campaign
      const links = MockDatabase.getLinks();
      const link = links.find(l => l.affiliateId === aff.id && (!campaign || l.campaignName === campaign));
      if (link) {
        link.clicksCount = (link.clicksCount || 0) + 1;
        MockDatabase.saveLinks(links);
      }
      return true;
    }

    return false;
  }

  /**
   * Simulates a completed ticket purchase attribution.
   */
  static simulatePurchase(params: {
    ticketsCount: number;
    ticketPrice?: number;
    buyerDocument?: string;
    buyerName?: string;
  }): { success: boolean; message: string; commission?: number } {
    const tracking = this.getTrackingData();
    if (!tracking) {
      return { success: false, message: 'Nenhum afiliado atribuído para esta compra.' };
    }

    const affiliates = MockDatabase.getAffiliates();
    const aff = affiliates.find(a => a.exclusiveCode.toUpperCase() === tracking.affiliateCode.toUpperCase());
    if (!aff) {
      return { success: false, message: 'Afiliado não encontrado no sistema.' };
    }

    if (aff.status !== 'aprovado') {
      return { success: false, message: 'Afiliado com conta pendente ou inativa.' };
    }

    // Anti-self-purchase check
    if (params.buyerDocument && aff.documentNumber.replace(/\D/g, '') === params.buyerDocument.replace(/\D/g, '')) {
      return { success: false, message: 'Auto-compra detectada. Comissões para compra própria são vedadas pelo regulamento.' };
    }

    const price = params.ticketPrice || 2.00; // R$ 2,00 per ticket
    const orderTotal = params.ticketsCount * price;
    const rate = aff.commissionRate || 0.15;
    const commissionValue = Number((orderTotal * rate).toFixed(2));

    // Update affiliate balance
    aff.balancePending = Number(((aff.balancePending || 0) + commissionValue).toFixed(2));
    aff.totalConversions = (aff.totalConversions || 0) + 1;
    MockDatabase.saveAffiliates(affiliates);

    // Record commission
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newCommission: Commission = {
      id: `comm_${Date.now()}`,
      conversionId: `conv_${Date.now()}`,
      affiliateId: aff.id,
      affiliateName: aff.fullName,
      orderAmount: orderTotal,
      commissionRate: rate,
      commissionAmount: commissionValue,
      campaign: tracking.campaign || 'padrao',
      status: 'pendente',
      createdAt: new Date().toISOString()
    };
    const commissions = MockDatabase.getCommissions();
    commissions.unshift(newCommission);
    MockDatabase.saveCommissions(commissions);

    // Send notification
    const notifications = MockDatabase.getNotifications();
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: aff.id,
      title: 'Nova conversão realizada! 🍀',
      message: `Você gerou uma venda de ${params.ticketsCount} milhares (R$ ${orderTotal.toFixed(2)}) e auferiu R$ ${commissionValue.toFixed(2)} de comissão.`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    MockDatabase.saveNotifications(notifications);

    return {
      success: true,
      message: `Conversão registrada com sucesso para o afiliado ${aff.fullName} (${aff.exclusiveCode})!`,
      commission: commissionValue
    };
  }
}
