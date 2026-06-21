import React, { useMemo, useState } from 'react';
import {
  CURRENCY_LABEL,
  computeFinancialDelayRow,
  totalQualifyingDays,
  type Currency,
  type FinancialDelayConfig,
  type FinancialDelayInput,
  type FinancialDelayRow,
} from '../../utils/financialDelay';

interface Props {
  isDark: boolean;
  onRowsChange?: (rows: FinancialDelayRow[]) => void;
}

type SubMethod = 'circulars' | 'late_payment';

const emptyInput = (): FinancialDelayInput => ({
  statementNo: '',
  submittedAt: '',
  amount: 0,
  paidAt: '',
});

const FinancialDelayTab: React.FC<Props> = ({ isDark, onRowsChange }) => {
  const [sub, setSub] = useState<SubMethod>('late_payment');
  const [cfg, setCfg] = useState<FinancialDelayConfig>({
    minAmount: 0,
    currency: 'IRR',
    contractDeadlineDays: 30,
  });
  const [inputs, setInputs] = useState<FinancialDelayInput[]>([emptyInput()]);

  const rows = useMemo<FinancialDelayRow[]>(
    () => inputs
      .filter((i) => i.statementNo && i.submittedAt && i.amount > 0)
      .map((i) => computeFinancialDelayRow(i, cfg)),
    [inputs, cfg],
  );

  React.useEffect(() => { onRowsChange?.(rows); }, [rows, onRowsChange]);

  const total = totalQualifyingDays(rows);

  const card = `rounded-2xl border p-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`;
  const lbl = `block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const inp = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`;
  const sel = inp;

  const subBtn = (k: SubMethod, label: string) => {
    const active = sub === k;
    return (
      <button
        onClick={() => setSub(k)}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
          active
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
            : isDark ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {subBtn('circulars', 'روش ۱ — بخشنامه‌های ۵۰۹۰ و ۱۳۰۰')}
        {subBtn('late_payment', 'روش ۲ — تاخیر در پرداخت مطالبات')}
      </div>

      {sub === 'circulars' && (
        <div className={`${card} text-center text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          جزئیات این روش ارسال خواهد شد.
        </div>
      )}

      {sub === 'late_payment' && (
        <div className="space-y-4">
          {/* Config */}
          <div className={card}>
            <div className={`text-xs font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>پیکربندی روش</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={lbl}>حداقل مبلغ</label>
                <input
                  type="number"
                  min={0}
                  className={inp}
                  value={cfg.minAmount}
                  onChange={(e) => setCfg({ ...cfg, minAmount: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className={lbl}>واحد پول</label>
                <select
                  className={sel}
                  value={cfg.currency}
                  onChange={(e) => setCfg({ ...cfg, currency: e.target.value as Currency })}
                >
                  {(Object.keys(CURRENCY_LABEL) as Currency[]).map((c) => (
                    <option key={c} value={c}>{CURRENCY_LABEL[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>مهلت پرداخت مقرر در قرارداد (روز)</label>
                <input
                  type="number"
                  min={0}
                  className={inp}
                  value={cfg.contractDeadlineDays}
                  onChange={(e) => setCfg({ ...cfg, contractDeadlineDays: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <p className={`mt-3 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              منطق: اگر پس از پایان مهلت مقرر، مطالبات پرداخت نشد و مبلغ ≥ حداقل تعیین‌شده بود، از روز بعد از مهلت تا تاریخ پرداخت به‌عنوان «تاخیر مجاز پیمانکار» محاسبه می‌شود و به تحلیل‌های IAP/TIA اضافه می‌شود.
            </p>
          </div>

          {/* Inputs */}
          <div className={card}>
            <div className="flex items-center justify-between mb-3">
              <div className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>صورت‌وضعیت‌ها</div>
              <button
                onClick={() => setInputs([...inputs, emptyInput()])}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${isDark ? 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
              >
                + افزودن ردیف
              </button>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <div>شماره صورت‌وضعیت</div>
              <div>تاریخ ارائه صورت‌وضعیت توسط پیمانکار</div>
              <div>مبلغ صورت‌وضعیت</div>
              <div>تاریخ پرداخت توسط کارفرما (در صورت پرداخت)</div>
              <div>عملیات</div>
            </div>
            <div className="space-y-2">
              {inputs.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <input
                    className={inp} placeholder="شماره صورت‌وضعیت"
                    value={row.statementNo}
                    onChange={(e) => { const c = [...inputs]; c[idx] = { ...row, statementNo: e.target.value }; setInputs(c); }}
                  />
                  <input
                    className={inp} type="date" title="تاریخ ارائه صورت‌وضعیت توسط پیمانکار"
                    value={row.submittedAt}
                    onChange={(e) => { const c = [...inputs]; c[idx] = { ...row, submittedAt: e.target.value }; setInputs(c); }}
                  />
                  <input
                    className={inp} type="number" min={0} placeholder="مبلغ"
                    value={row.amount || ''}
                    onChange={(e) => { const c = [...inputs]; c[idx] = { ...row, amount: Number(e.target.value) || 0 }; setInputs(c); }}
                  />
                  <input
                    className={inp} type="date" title="تاریخ پرداخت توسط کارفرما (در صورت پرداخت)"
                    value={row.paidAt || ''}
                    onChange={(e) => { const c = [...inputs]; c[idx] = { ...row, paidAt: e.target.value }; setInputs(c); }}
                  />
                  <button
                    onClick={() => setInputs(inputs.filter((_, i) => i !== idx))}
                    className={`text-[11px] font-bold px-3 py-2 rounded-lg ${isDark ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>

          </div>

          {/* Results table */}
          <div className={card}>
            <div className="flex items-center justify-between mb-3">
              <div className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>نتایج محاسبه تاخیر مالی</div>
              <div className={`text-[11px] font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                مجموع روزهای تاخیر مجاز قابل افزوده‌شدن به IAP/TIA: {total.toLocaleString('fa-IR')} روز
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    {['صورت‌وضعیت', 'تاریخ ارائه', 'مبلغ', 'مهلت', 'شروع تاخیر مالی', 'مدت (روز)'].map((h) => (
                      <th key={h} className="text-right font-bold px-3 py-2 border-b border-slate-200/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className={`text-center px-3 py-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ردیفی برای محاسبه وجود ندارد.</td></tr>
                  )}
                  {rows.map((r, i) => (
                    <tr key={i} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      <td className="px-3 py-2 border-b border-slate-200/20">{r.statementNo}</td>
                      <td className="px-3 py-2 border-b border-slate-200/20 tabular-nums">{r.submittedAt}</td>
                      <td className="px-3 py-2 border-b border-slate-200/20 tabular-nums">
                        {r.amount.toLocaleString('fa-IR')} {CURRENCY_LABEL[cfg.currency]}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-200/20 tabular-nums">{r.deadlineAt}</td>
                      <td className="px-3 py-2 border-b border-slate-200/20 tabular-nums">{r.delayStartAt ?? '—'}</td>
                      <td className={`px-3 py-2 border-b border-slate-200/20 tabular-nums font-bold ${r.qualifies && r.durationDays > 0 ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : ''}`}>
                        {r.durationDays.toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDelayTab;
