// زیان‌نگار — Loss / Damage formula engine
// Each formula declares the variables it needs. The engine evaluates each
// formula against the available inputs, marks it as computable or
// incomplete, and lists missing variables for manual entry.

import type { ManualDelayDays } from '../components/damage/DamageGateway';

export type VariableKey =
  | 'excusableDays'
  | 'nonExcusableDays'
  | 'compensableDays'
  | 'nonCompensableDays'
  | 'contractAmount'           // مبلغ قرارداد
  | 'contractDurationDays'     // مدت قرارداد (روز)
  | 'overheadDailyRate'        // نرخ بالاسری روزانه
  | 'machineryDailyRate'       // نرخ آلات و ماشین‌آلات روزانه
  | 'staffDailyRate'           // نرخ پرسنل ثابت روزانه
  | 'inflationFactor'          // ضریب تعدیل / تورم
  | 'delayPenaltyRate'         // نرخ خسارت تأخیر قرارداد
  | 'unrecoveredAdvancePayment'; // پیش‌پرداخت جذب‌نشده

export const VARIABLE_LABEL: Record<VariableKey, string> = {
  excusableDays: 'تاخیرات مجاز (روز)',
  nonExcusableDays: 'تاخیرات غیرمجاز (روز)',
  compensableDays: 'تاخیرات مجاز قابل جبران (روز)',
  nonCompensableDays: 'تاخیرات مجاز غیرقابل جبران (روز)',
  contractAmount: 'مبلغ قرارداد',
  contractDurationDays: 'مدت اولیه قرارداد (روز)',
  overheadDailyRate: 'نرخ بالاسری روزانه',
  machineryDailyRate: 'نرخ آلات و ماشین‌آلات روزانه',
  staffDailyRate: 'نرخ پرسنل ثابت روزانه',
  inflationFactor: 'ضریب تعدیل / تورم',
  delayPenaltyRate: 'نرخ خسارت تأخیر طبق قرارداد',
  unrecoveredAdvancePayment: 'پیش‌پرداخت جذب‌نشده',
};

export type Variables = Partial<Record<VariableKey, number>>;

export interface FormulaDef {
  id: string;
  title: string;
  category: string;
  needs: VariableKey[];
  formula: string; // human-readable
  compute: (v: Variables) => number;
}

export const FORMULAS: FormulaDef[] = [
  {
    id: 'overhead',
    title: 'هزینه بالاسری در دوره تاخیر',
    category: 'هزینه‌های ثابت',
    needs: ['compensableDays', 'overheadDailyRate'],
    formula: 'روزهای مجاز قابل جبران × نرخ بالاسری روزانه',
    compute: (v) => (v.compensableDays ?? 0) * (v.overheadDailyRate ?? 0),
  },
  {
    id: 'machinery',
    title: 'هزینه توقف آلات و ماشین‌آلات',
    category: 'منابع',
    needs: ['compensableDays', 'machineryDailyRate'],
    formula: 'روزهای مجاز قابل جبران × نرخ ماشین‌آلات روزانه',
    compute: (v) => (v.compensableDays ?? 0) * (v.machineryDailyRate ?? 0),
  },
  {
    id: 'staff',
    title: 'هزینه پرسنل ثابت در دوره تاخیر',
    category: 'منابع',
    needs: ['compensableDays', 'staffDailyRate'],
    formula: 'روزهای مجاز قابل جبران × نرخ پرسنل روزانه',
    compute: (v) => (v.compensableDays ?? 0) * (v.staffDailyRate ?? 0),
  },
  {
    id: 'inflation',
    title: 'اثر تورم بر کارهای باقیمانده',
    category: 'تعدیل',
    needs: ['contractAmount', 'contractDurationDays', 'excusableDays', 'inflationFactor'],
    formula: '(مبلغ قرارداد × روزهای مجاز ÷ مدت قرارداد) × ضریب تورم',
    compute: (v) => {
      const dur = v.contractDurationDays ?? 0;
      if (dur === 0) return 0;
      return ((v.contractAmount ?? 0) * (v.excusableDays ?? 0) / dur) * (v.inflationFactor ?? 0);
    },
  },
  {
    id: 'penalty_offset',
    title: 'حذف خسارت تاخیر بابت روزهای غیرمجاز کارفرما',
    category: 'حقوقی',
    needs: ['nonExcusableDays', 'delayPenaltyRate', 'contractAmount'],
    formula: 'روزهای غیرمجاز × نرخ خسارت × مبلغ قرارداد',
    compute: (v) => (v.nonExcusableDays ?? 0) * (v.delayPenaltyRate ?? 0) * (v.contractAmount ?? 0),
  },
  {
    id: 'advance_finance',
    title: 'هزینه تأمین مالی پیش‌پرداخت جذب‌نشده',
    category: 'مالی',
    needs: ['unrecoveredAdvancePayment', 'compensableDays'],
    formula: 'پیش‌پرداخت جذب‌نشده × روزهای مجاز قابل جبران ÷ ۳۶۵',
    compute: (v) => (v.unrecoveredAdvancePayment ?? 0) * (v.compensableDays ?? 0) / 365,
  },
];

export interface FormulaResult {
  id: string;
  computable: boolean;
  missing: VariableKey[];
  value: number;
}

export function evaluateFormulas(vars: Variables): FormulaResult[] {
  return FORMULAS.map((f) => {
    const missing = f.needs.filter((k) => vars[k] === undefined || vars[k] === null);
    const computable = missing.length === 0;
    return {
      id: f.id,
      computable,
      missing,
      value: computable ? f.compute(vars) : 0,
    };
  });
}

export function seedFromDelayDays(days: ManualDelayDays): Variables {
  return {
    excusableDays: days.excusable,
    nonExcusableDays: days.nonExcusable,
    compensableDays: days.excusableCompensable,
    nonCompensableDays: days.excusableNonCompensable,
  };
}
