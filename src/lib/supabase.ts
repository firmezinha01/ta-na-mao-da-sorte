import { createClient } from '@supabase/supabase-js';

const SUPABASE_OFFICIAL_URL = 'https://grgpodnzbuqqafaibson.supabase.co';
const SUPABASE_OFFICIAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ3BvZG56YnVxcWFmYWlic29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNjQyMzgsImV4cCI6MjEwNTk0MDIzOH0.V6H8qlZtblpm4I0Gh9G0UsM7K8_L3C3CCF5IPLRNgeI';

/**
 * Limpa e padroniza a URL do Supabase, removendo `/rest/v1` ou barras extras se fornecidas
 */
function cleanSupabaseUrl(url: string): string {
  if (!url) return '';
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_OFFICIAL_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_OFFICIAL_ANON_KEY;

export const supabaseUrl = cleanSupabaseUrl(rawUrl);
export const supabaseAnonKey = rawKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('sua-url') &&
  !supabaseAnonKey.includes('sua-chave')
);

// Cria o cliente se as variáveis estiverem configuradas
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
