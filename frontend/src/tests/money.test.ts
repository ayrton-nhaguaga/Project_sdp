import { describe, it, expect } from 'vitest';
import { parseMoney, formatMoney } from '../utils/money';
import { formSchema } from '../components/transactions/TransactionForm';
describe('Money and form validation', () => {
  it.each([
    ['1500,50', 150050],
    ['25000', 2500000],
    ['0,01', 1],
    ['10.1', 1010],
    ['999,99', 99999],
  ])('converts %s exactly', (input, cents) => expect(parseMoney(input)).toBe(cents));
  it.each(['0', '-1', '1,234', '1.000,00', 'abc', '1e3', 'Infinity', '1000000001'])(
    'rejects %s',
    (value) => expect(() => parseMoney(value)).toThrow(),
  );
  it('formats meticais explicitly', () => {
    expect(formatMoney(2545000)).toBe('25.450,00 MT');
    expect(formatMoney(-1)).toBe('−0,01 MT');
    expect(formatMoney(0)).toBe('0,00 MT');
  });
  it('validates complete forms and rejects impossible dates', () => {
    const valid = {
      type: 'INCOME',
      description: 'Salário',
      amount: '25000',
      categoryId: '1',
      transactionDate: '2026-10-01',
    };
    expect(formSchema.safeParse(valid).success).toBe(true);
    expect(formSchema.safeParse({ ...valid, transactionDate: '2026-02-30' }).success).toBe(false);
    expect(formSchema.safeParse({ ...valid, description: 'ab', categoryId: '' }).success).toBe(
      false,
    );
  });
});
