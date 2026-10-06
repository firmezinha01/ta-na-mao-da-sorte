'use client';

import { useEffect } from 'react';

export function getAffiliateTracking(): { affiliateCode?: string; campaign?: string } | null {
  if (typeof window === 'undefined') return null;

  // 1. Tenta recuperar do cookie _tns_aff
  try {
    const match = document.cookie.match(/(?:^|;\s*)_tns_aff=([^;]+)/);
    if (match) {
      const data = JSON.parse(decodeURIComponent(match[1]));
      if (data && data.affiliateCode) return data;
    }
  } catch {}

  // 2. Tenta recuperar do localStorage
  try {
    const stored = localStorage.getItem('_tns_aff');
    if (stored) {
      const data = JSON.parse(stored);
      if (data && data.affiliateCode) return data;
    }
  } catch {}

  return null;
}

export function AffiliateTracker() {
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      const code = params.get('afiliado') || params.get('ref') || params.get('aff');
      const campaign = params.get('campanha') || params.get('utm_campaign') || undefined;

      if (code) {
        const cleanCode = code.trim().toUpperCase();
        const trackingData = {
          affiliateCode: cleanCode,
          campaign: campaign ? campaign.trim() : 'padrao',
          trackedAt: new Date().toISOString()
        };

        // Salva cookie de atribuição com validade de 30 dias
        const maxAge = 30 * 24 * 60 * 60;
        document.cookie = `_tns_aff=${encodeURIComponent(
          JSON.stringify(trackingData)
        )}; max-age=${maxAge}; path=/; SameSite=Lax`;

        // Salva também no localStorage
        localStorage.setItem('_tns_aff', JSON.stringify(trackingData));

        // Registra o clique na API (anti-spam: 1 clique a cada 15 minutos por sessão)
        const sessionKey = `_tns_click_${cleanCode}`;
        const lastClick = Number(sessionStorage.getItem(sessionKey) || '0');
        if (Date.now() - lastClick > 15 * 60 * 1000) {
          sessionStorage.setItem(sessionKey, String(Date.now()));
          fetch('/api/afiliados/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              affiliateCode: cleanCode,
              campaign: trackingData.campaign
            })
          }).catch(err => {
            console.warn('[Afiliados] Erro ao registrar clique:', err);
          });
        }
      }
    } catch (err) {
      console.warn('[Afiliados] Erro ao inicializar rastreamento:', err);
    }
  }, []);

  return null;
}
