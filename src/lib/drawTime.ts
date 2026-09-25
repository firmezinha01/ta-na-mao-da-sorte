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

/**
 * Retorna a data/hora do próximo sorteio programado
 * Inclui o modo de teste automático para esta noite:
 * Durante a noite de testes (a partir das 20h), programa o sorteio na próxima janela (20:20, 20:25, etc.)
 * permitindo ao usuário testar o alerta de 1 minuto e a inicialização 100% automática.
 * E como padrão oficial do app, pontualmente todos os dias às 19:00h.
 */
export function getNextDrawTargetDate(): Date {
  const now = new Date();

  // Modo de teste noturno para validação do usuário (hoje após as 20h)
  if (now.getHours() === 20 || (now.getHours() === 21 && now.getMinutes() < 30)) {
    const nextMin = Math.ceil((now.getMinutes() + 1) / 5) * 5;
    const testTarget = new Date(now);
    if (nextMin >= 60) {
      testTarget.setHours(now.getHours() + 1, nextMin - 60, 0, 0);
    } else {
      testTarget.setHours(now.getHours(), nextMin, 0, 0);
    }
    return testTarget;
  }

  // Horário padrão oficial: 19:00h de hoje
  const standardToday = new Date();
  standardToday.setHours(19, 0, 0, 0);

  if (now.getTime() < standardToday.getTime()) {
    return standardToday;
  }

  // Se já passou das 19h (e fora da janela de teste), o próximo é amanhã às 19:00h
  const tomorrow19h = new Date();
  tomorrow19h.setDate(tomorrow19h.getDate() + 1);
  tomorrow19h.setHours(19, 0, 0, 0);
  return tomorrow19h;
}
