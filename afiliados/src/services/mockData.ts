import {
  Affiliate,
  AffiliateLink,
  ClickRecord,
  ConversionRecord,
  Commission,
  PaymentRequest,
  PromotionalMaterial,
  SystemNotification,
  SystemSettings,
  AuditLog
} from '../types';

const STORAGE_KEY_PREFIX = 'tns_affiliates_';

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export const INITIAL_SETTINGS: SystemSettings = {
  defaultCommissionRate: 0.15, // 15%
  minimumPayoutAmount: 50.00,  // R$ 50,00
  cookieDurationDays: 30,
  autoApproveAffiliates: false,
  supportWhatsapp: '(11) 98765-4321',
  maintenanceMode: false,
};

export const INITIAL_AFFILIATES: Affiliate[] = [
  {
    id: 'aff_lucas_oliveira',
    fullName: 'Lucas Oliveira da Silva',
    email: 'lucas.afiliado@tanamaodasorte.com.br',
    documentType: 'CPF',
    documentNumber: '12345678909',
    phone: '11987654321',
    whatsapp: '11987654321',
    birthDate: '1995-04-12',
    city: 'São Paulo',
    state: 'SP',
    exclusiveCode: 'LUCK-8821',
    status: 'aprovado',
    commissionRate: 0.15,
    pixKeyType: 'CPF',
    pixKey: '123.456.789-09',
    socialChannels: '@lucas_apostas_sorte (Instagram: 45k seguidores), Canal VIP Telegram (12k)',
    promotionStrategy: 'Stories diários antes das 19h mostrando os prêmios do dia e grupos de palpites no Telegram.',
    balanceAvailable: 345.50,
    balancePending: 180.00,
    balancePaid: 1250.00,
    totalClicks: 3420,
    totalConversions: 418,
    termsAcceptedAt: '2026-08-01T10:00:00Z',
    privacyAcceptedAt: '2026-08-01T10:00:00Z',
    consentIp: '189.120.45.12',
    createdAt: '2026-08-01T10:00:00Z',
    approvedAt: '2026-08-01T14:30:00Z',
    approvedBy: 'Admin Sistema'
  },
  {
    id: 'aff_mariana_santos',
    fullName: 'Mariana Santos Rodrigues',
    email: 'mariana.santos@gmail.com',
    documentType: 'CPF',
    documentNumber: '98765432100',
    phone: '21976543210',
    whatsapp: '21976543210',
    birthDate: '1998-11-23',
    city: 'Rio de Janeiro',
    state: 'RJ',
    exclusiveCode: 'MARI-3312',
    status: 'pendente',
    commissionRate: 0.15,
    pixKeyType: 'EMAIL',
    pixKey: 'mariana.santos@gmail.com',
    socialChannels: 'TikTok: @mari_premios (85k seguidores)',
    promotionStrategy: 'Vídeos curtos de unboxing e comemorações de sorteios.',
    balanceAvailable: 0,
    balancePending: 0,
    balancePaid: 0,
    totalClicks: 0,
    totalConversions: 0,
    termsAcceptedAt: '2026-09-27T18:20:00Z',
    privacyAcceptedAt: '2026-09-27T18:20:00Z',
    consentIp: '177.18.99.4',
    createdAt: '2026-09-27T18:20:00Z'
  },
  {
    id: 'aff_rodrigo_melo',
    fullName: 'Rodrigo Melo Marketing Digital',
    email: 'rodrigo.melo@agenciamelo.com.br',
    documentType: 'CNPJ',
    documentNumber: '12345678000199',
    phone: '31988887777',
    whatsapp: '31988887777',
    city: 'Belo Horizonte',
    state: 'MG',
    exclusiveCode: 'RODRIGO-VIP',
    status: 'aprovado',
    commissionRate: 0.20, // VIP rate
    pixKeyType: 'CNPJ',
    pixKey: '12.345.678/0001-99',
    socialChannels: 'Rede de sites de entretenimento e grupos de WhatsApp.',
    promotionStrategy: 'Tráfego pago no Google Ads e Meta Ads direcionado para landing page de sorteio diário.',
    balanceAvailable: 890.00,
    balancePending: 420.00,
    balancePaid: 4500.00,
    totalClicks: 14200,
    totalConversions: 1850,
    termsAcceptedAt: '2026-07-15T09:00:00Z',
    privacyAcceptedAt: '2026-07-15T09:00:00Z',
    createdAt: '2026-07-15T09:00:00Z',
    approvedAt: '2026-07-15T11:00:00Z'
  }
];

export const INITIAL_LINKS: AffiliateLink[] = [
  {
    id: 'link_lucas_1',
    affiliateId: 'aff_lucas_oliveira',
    affiliateCode: 'LUCK-8821',
    destinationPath: '/',
    campaignName: 'padrao',
    fullUrl: 'https://tanamaodasorte.com.br/?afiliado=LUCK-8821',
    clicksCount: 2150,
    conversionsCount: 260,
    revenueGenerated: 2600.00,
    isActive: true,
    createdAt: '2026-08-01T12:00:00Z'
  },
  {
    id: 'link_lucas_2',
    affiliateId: 'aff_lucas_oliveira',
    affiliateCode: 'LUCK-8821',
    destinationPath: '/',
    campaignName: 'stories_instagram',
    fullUrl: 'https://tanamaodasorte.com.br/?afiliado=LUCK-8821&campanha=stories_instagram',
    clicksCount: 890,
    conversionsCount: 112,
    revenueGenerated: 1120.00,
    isActive: true,
    createdAt: '2026-08-10T15:30:00Z'
  },
  {
    id: 'link_lucas_3',
    affiliateId: 'aff_lucas_oliveira',
    affiliateCode: 'LUCK-8821',
    destinationPath: '/',
    campaignName: 'telegram_vip',
    fullUrl: 'https://tanamaodasorte.com.br/?afiliado=LUCK-8821&campanha=telegram_vip',
    clicksCount: 380,
    conversionsCount: 46,
    revenueGenerated: 460.00,
    isActive: true,
    createdAt: '2026-08-20T19:00:00Z'
  }
];

export const INITIAL_COMMISSIONS: Commission[] = [
  {
    id: 'comm_01',
    conversionId: 'conv_01',
    affiliateId: 'aff_lucas_oliveira',
    affiliateName: 'Lucas Oliveira da Silva',
    orderAmount: 20.00,
    commissionRate: 0.15,
    commissionAmount: 3.00,
    campaign: 'stories_instagram',
    status: 'disponivel',
    availableAt: '2026-09-25T19:30:00Z',
    createdAt: '2026-09-25T15:10:00Z'
  },
  {
    id: 'comm_02',
    conversionId: 'conv_02',
    affiliateId: 'aff_lucas_oliveira',
    affiliateName: 'Lucas Oliveira da Silva',
    orderAmount: 50.00,
    commissionRate: 0.15,
    commissionAmount: 7.50,
    campaign: 'telegram_vip',
    status: 'disponivel',
    availableAt: '2026-09-26T19:30:00Z',
    createdAt: '2026-09-26T11:42:00Z'
  },
  {
    id: 'comm_03',
    conversionId: 'conv_03',
    affiliateId: 'aff_lucas_oliveira',
    affiliateName: 'Lucas Oliveira da Silva',
    orderAmount: 100.00,
    commissionRate: 0.15,
    commissionAmount: 15.00,
    campaign: 'stories_instagram',
    status: 'pendente',
    createdAt: '2026-09-28T09:15:00Z'
  },
  {
    id: 'comm_04',
    conversionId: 'conv_04',
    affiliateId: 'aff_lucas_oliveira',
    affiliateName: 'Lucas Oliveira da Silva',
    orderAmount: 30.00,
    commissionRate: 0.15,
    commissionAmount: 4.50,
    campaign: 'padrao',
    status: 'paga',
    paidAt: '2026-09-20T16:00:00Z',
    createdAt: '2026-09-18T14:20:00Z'
  }
];

export const INITIAL_PAYMENTS: PaymentRequest[] = [
  {
    id: 'pay_01',
    affiliateId: 'aff_lucas_oliveira',
    affiliateName: 'Lucas Oliveira da Silva',
    affiliateDocument: '123.456.789-09',
    requestedAmount: 500.00,
    pixKeyType: 'CPF',
    pixKey: '123.456.789-09',
    status: 'pago',
    pixTransactionId: 'E00038166202609011928019234857',
    requestedAt: '2026-09-01T10:15:00Z',
    processedAt: '2026-09-01T14:40:00Z',
    processedBy: 'Financeiro TNS'
  },
  {
    id: 'pay_02',
    affiliateId: 'aff_lucas_oliveira',
    affiliateName: 'Lucas Oliveira da Silva',
    affiliateDocument: '123.456.789-09',
    requestedAmount: 750.00,
    pixKeyType: 'CPF',
    pixKey: '123.456.789-09',
    status: 'pago',
    pixTransactionId: 'E00038166202609151240182937461',
    requestedAt: '2026-09-15T09:30:00Z',
    processedAt: '2026-09-15T12:00:00Z',
    processedBy: 'Financeiro TNS'
  }
];

export const INITIAL_MATERIALS: PromotionalMaterial[] = [
  {
    id: 'mat_banner_01',
    title: 'Banner Oficial 1200x628 - Sorteios Diários',
    category: 'banner',
    fileType: 'image',
    fileUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1200x628',
    captionText: '🍀 Sorteio garantido hoje às 19h no Tá na Mão da Sorte! Milhares por apenas R$ 2,00 no Pix. Escolha seus números da sorte agora:',
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'mat_stories_01',
    title: 'Story 1080x1920 - Sorteio Diário às 19h',
    category: 'stories',
    fileType: 'image',
    fileUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1080&q=80',
    dimensions: '1080x1920',
    captionText: '🍀 SORTEIO DIÁRIO ÀS 19H! Prêmio de R$ 500,00 no Pix! Compre sua milhar por apenas R$ 2,00:',
    isActive: true,
    createdAt: '2026-09-10T00:00:00Z'
  },
  {
    id: 'mat_feed_01',
    title: 'Post Feed 1080x1080 - Pix Mercado Pago Instantâneo',
    category: 'feed',
    fileType: 'image',
    fileUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1080&q=80',
    dimensions: '1080x1080',
    captionText: 'Comprar sua milhar no Tá na Mão da Sorte é 100% seguro e rápido. Pagou via Pix, seus bilhetes já estão valendo pro sorteio de hoje!',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'mat_copy_01',
    title: 'Copy WhatsApp - Disparo para Grupos de Amigos',
    category: 'copy',
    fileType: 'text',
    fileUrl: '',
    captionText: 'Fala pessoal! 🍀 Hoje tem sorteio no Tá na Mão da Sorte às 19h! Prêmio de R$ 500,00 via Pix. A milhar tá saindo por apenas R$ 2,00.\n\nEscolham os números de vocês aqui pelo link antes das 18:50h:\n{SEU_LINK}',
    isActive: true,
    createdAt: '2026-09-15T00:00:00Z'
  },
  {
    id: 'mat_copy_02',
    title: 'Copy Instagram - Bio e Direct',
    category: 'copy',
    fileType: 'text',
    fileUrl: '',
    captionText: '🎯 Quer concorrer a R$ 500 todo dia por apenas R$ 2,00? O Tá na Mão da Sorte é 100% no Pix e com transmissão ao vivo. Acessa pelo link e garante sua milhar!',
    isActive: true,
    createdAt: '2026-09-18T00:00:00Z'
  },
  {
    id: 'mat_selo_01',
    title: 'Selo Oficial de Transparência e Pix',
    category: 'selo',
    fileType: 'image',
    fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    dimensions: '800x800',
    captionText: 'Selo de segurança oficial Tá na Mão da Sorte. Sorteios diários auditados às 19:00h.',
    isActive: true,
    createdAt: '2026-09-20T00:00:00Z'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif_01',
    userId: 'aff_lucas_oliveira',
    title: 'Nova comissão confirmada! 🍀',
    message: 'Você recebeu R$ 7,50 de comissão de uma compra realizada através da sua campanha telegram_vip.',
    type: 'success',
    isRead: false,
    createdAt: '2026-09-28T11:42:00Z'
  },
  {
    id: 'notif_02',
    userId: 'aff_lucas_oliveira',
    title: 'Novos criativos de Stories disponíveis',
    message: 'Adicionamos novas artes de Domingo da Sorte na sua biblioteca de materiais promocionais.',
    type: 'info',
    isRead: true,
    linkAction: '/afiliados/materiais',
    createdAt: '2026-09-27T14:00:00Z'
  },
  {
    id: 'notif_03',
    userId: 'aff_lucas_oliveira',
    title: 'Saque Pix de R$ 750,00 realizado com sucesso!',
    message: 'A transferência Pix foi concluída para sua chave cadastrada. ID End-to-End: E00038166202609151240182937461.',
    type: 'payment',
    isRead: true,
    linkAction: '/afiliados/comissoes',
    createdAt: '2026-09-15T12:05:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    adminId: 'admin_master',
    adminEmail: 'admin@tanamaodasorte.com.br',
    action: 'approve_affiliate',
    targetId: 'aff_lucas_oliveira',
    details: { affiliateName: 'Lucas Oliveira da Silva', code: 'LUCK-8821' },
    timestamp: '2026-08-01T14:30:00Z'
  },
  {
    id: 'log_02',
    adminId: 'admin_master',
    adminEmail: 'admin@tanamaodasorte.com.br',
    action: 'approve_payout',
    targetId: 'pay_02',
    details: { amount: 750.00, pixKey: '123.456.789-09' },
    timestamp: '2026-09-15T12:00:00Z'
  }
];

// Helper to get or init mock state
export class MockDatabase {
  static getAffiliates(): Affiliate[] {
    return getStorage('affiliates', INITIAL_AFFILIATES);
  }
  static saveAffiliates(data: Affiliate[]): void {
    setStorage('affiliates', data);
  }

  static getLinks(): AffiliateLink[] {
    return getStorage('links', INITIAL_LINKS);
  }
  static saveLinks(data: AffiliateLink[]): void {
    setStorage('links', data);
  }

  static getCommissions(): Commission[] {
    return getStorage('commissions', INITIAL_COMMISSIONS);
  }
  static saveCommissions(data: Commission[]): void {
    setStorage('commissions', data);
  }

  static getPayments(): PaymentRequest[] {
    return getStorage('payments', INITIAL_PAYMENTS);
  }
  static savePayments(data: PaymentRequest[]): void {
    setStorage('payments', data);
  }

  static getMaterials(): PromotionalMaterial[] {
    return getStorage('materials', INITIAL_MATERIALS);
  }
  static saveMaterials(data: PromotionalMaterial[]): void {
    setStorage('materials', data);
  }

  static getNotifications(): SystemNotification[] {
    return getStorage('notifications', INITIAL_NOTIFICATIONS);
  }
  static saveNotifications(data: SystemNotification[]): void {
    setStorage('notifications', data);
  }

  static getSettings(): SystemSettings {
    return getStorage('settings', INITIAL_SETTINGS);
  }
  static saveSettings(data: SystemSettings): void {
    setStorage('settings', data);
  }

  static getAuditLogs(): AuditLog[] {
    return getStorage('auditLogs', INITIAL_AUDIT_LOGS);
  }
  static saveAuditLogs(data: AuditLog[]): void {
    setStorage('auditLogs', data);
  }

  static resetToDefault(): void {
    setStorage('affiliates', INITIAL_AFFILIATES);
    setStorage('links', INITIAL_LINKS);
    setStorage('commissions', INITIAL_COMMISSIONS);
    setStorage('payments', INITIAL_PAYMENTS);
    setStorage('materials', INITIAL_MATERIALS);
    setStorage('notifications', INITIAL_NOTIFICATIONS);
    setStorage('settings', INITIAL_SETTINGS);
    setStorage('auditLogs', INITIAL_AUDIT_LOGS);
  }
}
