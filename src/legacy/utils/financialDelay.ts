// Financial delay (Method 2): late-payment-triggered permitted contractor delays.
// If a payment claim is not paid by deadline AND amount >= threshold,
// the days from (deadline + 1) to actual payment date count as
// "تاخیر مجاز پیمانکار" and feed into IAP/TIA as excusable delay.

export type Currency = 'IRR' | 'IRT' | 'USD' | 'EUR';

export const CURRENCY_LABEL: Record<Currency, string> = {
  IRR: 'ریال',
  IRT: 'تومان',
  USD: 'دلار',
  EUR: 'یورو',
};

export interface FinancialDelayInput {
  /** صورت‌وضعیت */
  statementNo: string;
  /** تاریخ ارائه (ISO yyyy-mm-dd) */
  submittedAt: string;
  /** مبلغ */
  amount: number;
  /** تاریخ پرداخت واقعی (ISO) — اگر خالی، هنوز پرداخت نشده */
  paidAt?: string;
}

export interface FinancialDelayConfig {
  /** حداقل مبلغ */
  minAmount: number;
  currency: Currency;
  /** مهلت مقرر در قرارداد (روز) */
  contractDeadlineDays: number;
}

export interface FinancialDelayRow extends FinancialDelayInput {
  deadlineAt: string;       // submittedAt + deadlineDays
  delayStartAt: string | null; // deadline + 1 day (if amount qualifies)
  durationDays: number;     // 0 if not qualifying or not yet overdue
  qualifies: boolean;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(fromIso: string, toIso: string): number {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000) + 1);
}

export function computeFinancialDelayRow(
  input: FinancialDelayInput,
  cfg: FinancialDelayConfig,
  todayIso: string = new Date().toISOString().slice(0, 10),
): FinancialDelayRow {
  const deadlineAt = addDays(input.submittedAt, cfg.contractDeadlineDays);
  const qualifies = input.amount >= cfg.minAmount;
  const endIso = input.paidAt || todayIso;
  const isOverdue = new Date(endIso).getTime() > new Date(deadlineAt).getTime();

  if (!qualifies || !isOverdue) {
    return { ...input, deadlineAt, delayStartAt: null, durationDays: 0, qualifies };
  }
  const delayStartAt = addDays(deadlineAt, 1);
  const durationDays = diffDays(delayStartAt, endIso);
  return { ...input, deadlineAt, delayStartAt, durationDays, qualifies };
}

export function totalQualifyingDays(rows: FinancialDelayRow[]): number {
  return rows.reduce((s, r) => s + (r.qualifies ? r.durationDays : 0), 0);
}
