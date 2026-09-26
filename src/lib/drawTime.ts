/**
 * Utilitários para horário oficial de Brasília (America/Sao_Paulo) e regras de vendas
 * Regra: A última compra de cada dia pode ser feita até as 18:55h.
 * Entre 18:55 e o término do sorteio (19:05h), as vendas ficam fechadas e reabrem logo após.
 */

export interface BrasiliaTimeComponents {
  year: number;
  month: number; // 0-11
  day: number;
  hour: number;
  minute: number;
  second: number;
  isSunday: boolean;
  raw: Date;
}

export interface DrawSchedule {
  targetTimestamp: number; // epoch ms UTC
  targetIso: string;       // ISO string UTC
  label: string;           // ex: "19:00h"
  isSunday: boolean;
  isTestMode: boolean;
}

/**
 * Retorna os componentes exatos de data e hora no fuso de Brasília (America/Sao_Paulo)
 * Funciona de forma idêntica tanto no servidor (Vercel UTC) quanto no navegador do usuário.
 */
export function getBrasiliaComponents(date: Date = new Date()): BrasiliaTimeComponents {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;

    const hourRaw = getPart('hour') || '0';
    const hour = parseInt(hourRaw === '24' ? '0' : hourRaw, 10);
    const minute = parseInt(getPart('minute') || '0', 10);
    const second = parseInt(getPart('second') || '0', 10);
    const year = parseInt(getPart('year') || String(date.getFullYear()), 10);
    const month = parseInt(getPart('month') || '1', 10) - 1;
    const day = parseInt(getPart('day') || '1', 10);
    const weekday = getPart('weekday') || '';

    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      isSunday: weekday.toLowerCase().includes('sun') || weekday.toLowerCase().includes('dom'),
      raw: date
    };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      isSunday: date.getDay() === 0,
      raw: date
    };
  }
}

/**
 * Retorna objeto simplificado para compatibilidade
 */
export function getBrasiliaTime() {
  const b = getBrasiliaComponents();
  return {
    hours: b.hour,
    minutes: b.minute,
    seconds: b.second,
    isSunday: b.isSunday,
    raw: b.raw
  };
}

/**
 * Programação oficial do sorteio diário:
 * Pontualmente todos os dias às 19:00:00h de Brasília.
 * Se já passou das 19h no dia atual, agenda o sorteio para amanhã às 19:00h.
 * Faz um sorteio diário e PARA até o dia seguinte.
 */
export function getNextDrawSchedule(referenceDate: Date = new Date()): DrawSchedule {
  const b = getBrasiliaComponents(referenceDate);
  const tzOffset = '-03:00';

  let targetYear = b.year;
  let targetMonth = b.month + 1;
  let targetDay = b.day;

  // Se já passou das 19:00h de hoje no horário oficial de Brasília, o próximo sorteio é amanhã às 19:00h
  if (b.hour >= 19) {
    const tomorrow = new Date(referenceDate.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowB = getBrasiliaComponents(tomorrow);
    targetYear = tomorrowB.year;
    targetMonth = tomorrowB.month + 1;
    targetDay = tomorrowB.day;
  }

  const isoString = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T19:00:00${tzOffset}`;
  const targetDate = new Date(isoString);

  // Verifica se o dia do sorteio agendado cai num domingo
  const targetSunday = targetDate.getUTCDay() === 0 || (new Date(targetDate.getTime() - 3 * 3600000).getDay() === 0);

  return {
    targetTimestamp: targetDate.getTime(),
    targetIso: targetDate.toISOString(),
    label: '19:00h',
    isSunday: targetSunday,
    isTestMode: false
  };
}

/**
 * Retorna true se estiver no período de corte das vendas (18:55 às 19:05)
 */
export function isSalesCutoffActive(): boolean {
  const { hour, minute } = getBrasiliaComponents();

  // Bloqueio das 18:55:00 até 19:05:00 no horário de Brasília
  if (hour === 18 && minute >= 55) {
    return true;
  }
  if (hour === 19 && minute < 5) {
    return true;
  }
  return false;
}

/**
 * Compatibilidade: Retorna a Date do próximo sorteio
 */
export function getNextDrawTargetDate(): Date {
  const schedule = getNextDrawSchedule();
  return new Date(schedule.targetTimestamp);
}
