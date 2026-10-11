import { z } from 'zod';
export function parseMoney(value: string): number {
  if (!/^\d{1,10}([.,]\d{1,2})?$/.test(value.trim()))
    throw new Error(
      'Use um valor positivo, sem separador de milhares e com até duas casas decimais.',
    );
  const [whole, fraction = ''] = value.trim().replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100_000_000_000)
    throw new Error('O valor deve ser superior a zero e até 1.000.000.000 MT.');
  return cents;
}
export const moneySchema = z.string().superRefine((v, c) => {
  try {
    parseMoney(v);
  } catch (e) {
    c.addIssue({ code: 'custom', message: (e as Error).message });
  }
});
export function formatMoney(cents: number): string {
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (cents < 0 ? '−' : '') + whole + ',' + String(absolute % 100).padStart(2, '0') + ' MT';
}
export function moneyInput(cents: number) {
  return Math.floor(cents / 100) + ',' + String(cents % 100).padStart(2, '0');
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date + 'T00:00:00Z'));
}
export function today() {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}
