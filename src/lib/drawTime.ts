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
  dayOfWeek: number; // 0 (Dom) a 6 (Sáb)
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
    const weekday = (getPart('weekday') || '').toLowerCase();

    const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    let dayOfWeek = weekdays.findIndex(w => weekday.includes(w));
    if (dayOfWeek === -1) {
      const utcMs = date.getTime();
      const brMs = utcMs - 3 * 3600 * 1000;
      dayOfWeek = new Date(brMs).getUTCDay();
    }

    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      dayOfWeek,
      isSunday: dayOfWeek === 0 || weekday.includes('sun') || weekday.includes('dom'),
      raw: date
    };
  } catch {
    const utcMs = date.getTime();
    const brMs = utcMs - 3 * 3600 * 1000;
    const d = new Date(brMs);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      second: d.getUTCSeconds(),
      dayOfWeek: d.getUTCDay(),
      isSunday: d.getUTCDay() === 0,
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

/**
 * Retorna a data exata da última Segunda-feira às 10:00h no horário oficial de Brasília.
 * Utilizado para a regra do cliente de apagar os dados do sorteio anterior toda segunda às 10h.
 */
export function getLastMonday10AM(referenceDate: Date = new Date()): Date {
  const b = getBrasiliaComponents(referenceDate);
  let daysToSubtract = 0;
  if (b.dayOfWeek === 1) { // Segunda-feira
    daysToSubtract = b.hour >= 10 ? 0 : 7;
  } else if (b.dayOfWeek === 0) { // Domingo
    daysToSubtract = 6;
  } else { // Terça (2) a Sábado (6)
    daysToSubtract = b.dayOfWeek - 1;
  }

  const refTime = referenceDate.getTime() - daysToSubtract * 24 * 3600 * 1000;
  const targetB = getBrasiliaComponents(new Date(refTime));
  const isoStr = `${targetB.year}-${String(targetB.month + 1).padStart(2, '0')}-${String(targetB.day).padStart(2, '0')}T10:00:00-03:00`;
  return new Date(isoStr);
}

/**
 * Regra do Cliente:
 * "deixe a milhar salva em algum campo para o jogador ver a milhar que saiu e o primeiro nome do ganahdor
 * e os 4 numeros finais do telefone quando for segunda as 10 da manha sempre apagar esses dados do sorteio"
 *
 * Retorna true se o sorteio deve ser exibido, ou false se já expirou pelo corte de Segunda-feira às 10:00h.
 */
export function shouldShowLastDrawResult(drawDateIso: string, referenceDate: Date = new Date()): boolean {
  try {
    const drawTimestamp = new Date(drawDateIso).getTime();
    if (isNaN(drawTimestamp)) return false;

    // Se o sorteio foi realizado há menos de 10 minutos (ex: durante testes ou simulações recentes), sempre exibe
    if (Date.now() - drawTimestamp < 10 * 60 * 1000) {
      return true;
    }

    const lastMonday10AM = getLastMonday10AM(referenceDate);
    // Se o sorteio foi realizado após ou na última segunda-feira às 10h, exibe na tela.
    // Se foi realizado antes, foi apagado pelo corte semanal.
    return drawTimestamp >= lastMonday10AM.getTime();
  } catch {
    return true;
  }
}

