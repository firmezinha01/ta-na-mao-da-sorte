import QRCode from 'qrcode';
import { PixPaymentData } from '@/types';

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
 * Gera QR Code e Chave Pix Copia e Cola
 */
export async function createPixPayment(params: CreatePixParams): Promise<PixPaymentData> {
  const mpAccessToken = process.env.MP_ACCESS_TOKEN;
  const isTestMode = params.testMode === true && (!mpAccessToken || mpAccessToken.includes('TEST-DEMO'));

  // Se houver token do Mercado Pago configurado, gera o Pix oficial em tempo real
  if (mpAccessToken && !isTestMode) {
    try {
      const sanitizedTickets = params.tickets.join(', ');
      const desc = `Tá Na Mão da SORTE - Milhares: ${sanitizedTickets}`;
      const payerEmail = params.payerEmail || 'contato@tanamaodasorte.com.br';

      const mpPayload: Record<string, unknown> = {
        transaction_amount: Number(params.amount.toFixed(2)),
        description: desc.slice(0, 120),
        payment_method_id: 'pix',
        payer: {
          email: payerEmail,
          first_name: params.payerName?.split(' ')[0] || 'Participante',
          last_name: params.payerName?.split(' ').slice(1).join(' ') || 'Sorte'
        }
      };

      if (params.payerCpf) {
        const cleanCpf = params.payerCpf.replace(/\D/g, '');
        if (cleanCpf.length === 11) {
          (mpPayload.payer as Record<string, unknown>).identification = {
            type: 'CPF',
            number: cleanCpf
          };
        }
      }

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mpAccessToken}`,
          'X-Idempotency-Key': `pix-${Date.now()}-${params.tickets.join('-')}`
        },
        body: JSON.stringify(mpPayload)
      });

      if (response.ok) {
        const data = await response.json();
        const qrCodeText = data.point_of_interaction?.transaction_data?.qr_code || '';
        
        let qrCodeBase64 = '';
        if (data.point_of_interaction?.transaction_data?.qr_code_base64) {
          qrCodeBase64 = `data:image/png;base64,${data.point_of_interaction.transaction_data.qr_code_base64}`;
        } else if (qrCodeText) {
          qrCodeBase64 = await QRCode.toDataURL(qrCodeText, {
            width: 300,
            margin: 2,
            color: { dark: '#022c22', light: '#ffffff' }
          });
        }

        return {
          paymentId: String(data.id),
          qrCode: qrCodeText,
          qrCodeBase64,
          copyPaste: qrCodeText,
          amount: params.amount,
          tickets: params.tickets,
          expiresAt: data.date_of_expiration || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          status: (data.status as 'pending' | 'approved' | 'rejected') || 'pending'
        };
      } else {
        const errJson = await response.json();
        console.warn('Erro na resposta do Mercado Pago API:', errJson);
      }
    } catch (err) {
      console.warn('Erro ao chamar Mercado Pago API, fallback para simulação:', err);
    }
  }

  // Fallback para simulação local se não houver conexão com MP
  const paymentId = `TEST_MP_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const fakePixPayload = `00020126580014br.gov.bcb.pix0136${paymentId}520400005303986540${params.amount.toFixed(2)}5802BR5920TA NA MAO DA SORTE6009SAO PAULO62070503***6304ABCD`;
  
  const qrCodeBase64 = await QRCode.toDataURL(fakePixPayload, {
    width: 280,
    margin: 2,
    color: { dark: '#022c22', light: '#ffffff' }
  });

  return {
    paymentId,
    qrCode: fakePixPayload,
    qrCodeBase64,
    copyPaste: fakePixPayload,
    amount: params.amount,
    tickets: params.tickets,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: 'pending'
  };
}

/**
 * Consulta o status atual de um pagamento no Mercado Pago
 */
export async function checkPaymentStatus(paymentId: string): Promise<{ status: string; statusDetail?: string }> {
  const mpAccessToken = process.env.MP_ACCESS_TOKEN;

  // Se for ID de teste
  if (paymentId.startsWith('TEST_MP_')) {
    return { status: 'pending', statusDetail: 'pending_waiting_transfer' };
  }

  if (mpAccessToken) {
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
  }

  return { status: 'pending', statusDetail: 'unknown' };
}
