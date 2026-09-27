import QRCode from 'qrcode';
import { PixPaymentData } from '@/types';

// Credencial oficial fornecida pelo usuário
const MP_OFFICIAL_ACCESS_TOKEN = 'APP_USR-8485940889959543-092511-f0a03205dd25420d739e1d4272c1ada0-3607386507';

export interface CreatePixParams {
  amount: number;
  tickets: string[];
  description: string;
  payerEmail?: string;
  payerName?: string;
  payerCpf?: string;
  testMode?: boolean;
}

/**
 * Criação de cobrança Pix oficial via Mercado Pago
 * Gera QR Code e Chave Pix Copia e Cola reais e válidos
 */
export async function createPixPayment(params: CreatePixParams): Promise<PixPaymentData> {
  const mpAccessToken = process.env.MP_ACCESS_TOKEN || MP_OFFICIAL_ACCESS_TOKEN;

  const sanitizedTickets = params.tickets.join(', ');
  const desc = `Tá Na Mão da SORTE - Milhar(es): ${sanitizedTickets}`.slice(0, 100);
  const payerEmail = params.payerEmail || 'contato@tanamaodasorte.com.br';
  const firstName = params.payerName?.trim().split(' ')[0] || 'Cliente';
  const lastName = params.payerName?.trim().split(' ').slice(1).join(' ') || 'Sorte';
  const cleanCpf = params.payerCpf ? params.payerCpf.replace(/\D/g, '') : '';

  const buildPayload = (includeCpf: boolean) => {
    const payload: Record<string, unknown> = {
      transaction_amount: Number(params.amount.toFixed(2)),
      description: desc,
      payment_method_id: 'pix',
      payer: {
        email: payerEmail,
        first_name: firstName,
        last_name: lastName
      }
    };

    if (includeCpf && cleanCpf.length === 11) {
      (payload.payer as Record<string, unknown>).identification = {
        type: 'CPF',
        number: cleanCpf
      };
    }
    return payload;
  };

  let mpResponse: any = null;

  try {
    // Tentativa 1: Envia com CPF se fornecido
    const payload1 = buildPayload(Boolean(cleanCpf && cleanCpf.length === 11));
    let response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mpAccessToken}`,
        'X-Idempotency-Key': `pix-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      },
      body: JSON.stringify(payload1)
    });

    // Se falhar (ex: CPF rejeitado pelo algoritmo do Mercado Pago), retenta imediatamente sem CPF
    if (!response.ok && payload1.payer && (payload1.payer as any).identification) {
      const errBody = await response.json().catch(() => ({}));
      console.warn('Tentativa 1 com CPF retornou erro no Mercado Pago:', errBody?.message || response.status, 'Retentando sem CPF...');
      
      const payload2 = buildPayload(false);
      response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mpAccessToken}`,
          'X-Idempotency-Key': `pix-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        },
        body: JSON.stringify(payload2)
      });
    }

    if (response.ok) {
      mpResponse = await response.json();
    } else {
      const errJson = await response.json().catch(() => ({}));
      console.error('Erro na resposta do Mercado Pago API:', JSON.stringify(errJson));
      throw new Error(errJson.message || 'Falha ao processar cobrança Pix no Mercado Pago');
    }
  } catch (err) {
    console.error('Erro ao chamar Mercado Pago API:', err);
    throw err;
  }

  // Gera dados oficiais a partir da resposta real do Mercado Pago
  const qrCodeText = mpResponse?.point_of_interaction?.transaction_data?.qr_code || '';
  if (!qrCodeText) {
    throw new Error('Mercado Pago não retornou o código Pix (qr_code).');
  }

  let qrCodeBase64 = '';
  if (mpResponse.point_of_interaction?.transaction_data?.qr_code_base64) {
    qrCodeBase64 = `data:image/png;base64,${mpResponse.point_of_interaction.transaction_data.qr_code_base64}`;
  } else {
    qrCodeBase64 = await QRCode.toDataURL(qrCodeText, {
      width: 320,
      margin: 2,
      color: { dark: '#022c22', light: '#ffffff' }
    });
  }

  return {
    paymentId: String(mpResponse.id),
    qrCode: qrCodeText,
    qrCodeBase64,
    copyPaste: qrCodeText,
    amount: params.amount,
    tickets: params.tickets,
    expiresAt: mpResponse.date_of_expiration || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: (mpResponse.status as 'pending' | 'approved' | 'rejected') || 'pending'
  };
}

/**
 * Consulta o status atual de um pagamento no Mercado Pago
 */
export async function checkPaymentStatus(
  paymentId: string,
  forceApprove: boolean = false
): Promise<{ status: string; statusDetail?: string }> {
  if (forceApprove) {
    return { status: 'approved', statusDetail: 'accredited' };
  }

  // Se for teste ou mock e já passou alguns segundos, aprova para não bloquear o fluxo
  if (paymentId.startsWith('MOCK_') || paymentId.startsWith('TEST_MP_')) {
    const rawTs = paymentId.replace(/\D/g, '');
    const createdTs = rawTs ? parseInt(rawTs, 10) : 0;
    if (createdTs > 0 && Date.now() - createdTs > 3000) {
      return { status: 'approved', statusDetail: 'accredited' };
    }
    return { status: 'pending', statusDetail: 'pending_waiting_transfer' };
  }

  const mpAccessToken = process.env.MP_ACCESS_TOKEN || MP_OFFICIAL_ACCESS_TOKEN;

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mpAccessToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        status: data.status,
        statusDetail: data.status_detail
      };
    }
  } catch (err) {
    console.warn('Erro ao consultar status no Mercado Pago:', err);
  }

  return { status: 'pending', statusDetail: 'unknown' };
}

