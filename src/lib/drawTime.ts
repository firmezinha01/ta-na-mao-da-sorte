/**
 * Utilitários para horário oficial de Brasília e regras de vendas
 * Regra: A última compra de cada dia pode ser feita até as 18:55h.
 * Entre 18:55 e o término do sorteio (19:05h), as vendas ficam fechadas e reabrem logo após.
 */

export function getBrasiliaTime(): {
  hours: number;
  minutes: number;
  seconds: number;
  isSunday: boolean;
  raw: Date;
} {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      weekday: 'short',
      hour12: false
    });
    const parts = formatter.formatToParts(now);

    const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const seconds = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';

    return {
      hours,
      minutes,
      seconds,
      isSunday: weekday.toLowerCase().includes('dom'),
      raw: now
    };
  } catch {
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      isSunday: now.getDay() === 0,
      raw: now
    };
  }
}

/**
 * Retorna true se estiver no período de corte das vendas (18:55 às 19:05)
 */
export function isSalesCutoffActive(): boolean {
  const { hours, minutes } = getBrasiliaTime();

  // Bloqueio das 18:55:00 até 19:05:00
  if (hours === 18 && minutes >= 55) {
    return true;
  }
  if (hours === 19 && minutes < 5) {
    return true;
  }
  return false;
}
