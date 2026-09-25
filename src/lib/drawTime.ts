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
  label: string;           // ex: "20:45h" ou "19:00h"
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
 * Calcula a programação exata do próximo sorteio
 * - À noite (após as 20h): roda janelas de teste de 5 em 5 minutos (ex: 20:45, 20:50, etc.)
 * - Durante o dia regular: pontualmente às 19:00:00h de Brasília
 */
export function getNextDrawSchedule(referenceDate: Date = new Date()): DrawSchedule {
  const b = getBrasiliaComponents(referenceDate);
  const tzOffset = '-03:00';

  // Modo de teste noturno para validação do usuário (entre 20h e 22h de Brasília)
  if (b.hour === 20 || b.hour === 21) {
    const nextMin = Math.ceil((b.minute + 1) / 5) * 5;
    let targetHour = b.hour;
    let targetMinute = nextMin;
    let targetDay = b.day;

    if (nextMin >= 60) {
      targetHour += 1;
      targetMinute = nextMin - 60;
    }

    const isoString = `${b.year}-${String(b.month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}:00${tzOffset}`;
    const targetDate = new Date(isoString);

    return {
      targetTimestamp: targetDate.getTime(),
      targetIso: targetDate.toISOString(),
      label: `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}h`,
      isSunday: b.isSunday,
      isTestMode: true
    };
  }

  // Horário oficial de Brasília: 19:00h
  let targetYear = b.year;
  let targetMonth = b.month + 1;
  let targetDay = b.day;

  // Se já passou das 19h no horário de Brasília, o próximo é amanhã às 19h
  if (b.hour >= 19) {
    const tomorrow = new Date(referenceDate.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowB = getBrasiliaComponents(tomorrow);
    targetYear = tomorrowB.year;
    targetMonth = tomorrowB.month + 1;
    targetDay = tomorrowB.day;
  }

  const isoString = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T19:00:00${tzOffset}`;
  const targetDate = new Date(isoString);

  return {
    targetTimestamp: targetDate.getTime(),
    targetIso: targetDate.toISOString(),
    label: '19:00h',
    isSunday: b.isSunday,
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
