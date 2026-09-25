export type TipoMensagem = 'lembrete' | 'resultado' | 'parabenizacao';

export interface Usuario {
  id: string;
  nome_completo: string;
  cpf: string;
  whatsapp: string;
  data_cadastro: string;
}

export interface Bilhete {
  id: string;
  numero_milhar: string; // "0000" to "9999"
  usuario_id: string;
  sorteio_id: string;
  data_compra: string;
  status_pagamento: boolean;
  payment_id?: string;
  valor: number;
  usuario?: Usuario;
}

export interface Sorteio {
  id: string;
  data_sorteio: string; // ISO string
  numeros_sorteados: string | null; // e.g. "1234"
  ganhador_id: string | null;
  premio: number; // default R$ 500
  acumulado: boolean;
  status: 'agendado' | 'em_andamento' | 'finalizado';
  eh_domingo?: boolean;
  ganhador?: Usuario | null;
}

export interface Mensagem {
  id: string;
  usuario_id: string;
  conteudo: string;
  tipo: TipoMensagem;
  data_envio: string;
  status_envio?: string;
  destinatario_nome?: string;
  destinatario_whatsapp?: string;
}

export interface PixPaymentData {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  copyPaste: string;
  amount: number;
  tickets: string[];
  expiresAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AppConfig {
  ticketPrice: number;
  defaultPrize: number;
  drawHour: number; // 19
  testMode: boolean; // Modo de teste ativo antes de subir para produção
  mpAccessToken?: string;
  mpPublicKey?: string;
  whatsappApiUrl?: string;
  whatsappApiToken?: string;
}
