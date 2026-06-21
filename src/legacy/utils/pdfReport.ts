// Persian-ready report generation.
//
// The previous implementation tried to convert HTML to PDF inside the page
// with jsPDF.html() + html2canvas. That pipeline mangles bidi / RTL Persian
// glyphs (letters appear reversed or disconnected — exactly what the user
// reported). We replace it with two reliable paths:
//
//   1. PDF  → open a print window with fully-shaped HTML and let the browser
//             render Persian, then trigger window.print(). The user saves as
//             PDF from the browser's native print dialog. Text remains real,
//             selectable, and correctly shaped.
//   2. DOCX → generate a real editable Microsoft Word document using the
//             `docx` package so the user can edit the brief afterwards.
//
// Both reports share the same data model so the on-screen analysis is fully
// reflected in either format.

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} from 'docx';

export interface ProjectMeta {
  projectName?: string;
  contractor?: string;
  employer?: string;
  contractNumber?: string;
  briefScope?: string;
}

function shamsiDate(): string {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toLocaleDateString('fa-IR');
  }
}

function sanitizeForFilename(s: string): string {
  return (s || 'گزارش').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 60);
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function fa(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '۰';
  return Number(n).toLocaleString('fa-IR');
}

function openPrintWindow(title: string, body: string): void {
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) {
    alert('لطفاً اجازه باز شدن پنجره چاپ را به مرورگر بدهید تا گزارش PDF تهیه شود.');
    return;
  }
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" />
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #0f172a; }
    body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; font-size: 12pt; line-height: 1.9; }
    .header-bar { background: linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; padding: 14px 18px; border-radius: 10px; margin-bottom: 16px; }
    .header-bar.dmg { background: linear-gradient(135deg,#e11d48,#be123c); }
    .header-bar h1 { margin: 0; font-size: 20pt; font-weight: 800; }
    .header-bar .sub { font-size: 10pt; opacity: .9; margin-top: 4px; }
    h2 { font-size: 14pt; font-weight: 800; margin: 18px 0 8px; color:#1e293b; border-bottom: 2px solid #c7d2fe; padding-bottom: 4px; }
    p { margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11pt; }
    th, td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: right; vertical-align: top; }
    th { background:#eef2ff; font-weight: 800; }
    .meta-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 4px 16px; margin-bottom: 8px; }
    .meta-grid .row { font-size: 11pt; }
    .meta-grid .k { color:#475569; font-weight: 800; margin-left: 6px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
    .cell { border: 1px solid #c7d2fe; border-radius: 8px; padding: 10px; background:#f8fafc; }
    .cell .label { font-size: 10pt; color:#475569; }
    .cell .val { font-size: 14pt; font-weight: 800; color:#4338ca; margin-top: 2px; }
    .badge { display:inline-block; padding:1px 8px; border-radius:999px; font-size:10pt; font-weight:800; }
    .badge-ex { background:#dcfce7; color:#166534; }
    .badge-nex { background:#fee2e2; color:#991b1b; }
    .footer { margin-top: 24px; padding-top: 8px; border-top: 1px dashed #94a3b8; font-size: 9pt; color:#64748b; text-align:center; }
    .print-bar { position: fixed; top: 12px; left: 12px; z-index: 9999; background:#4338ca; color:#fff; padding: 8px 14px; border-radius: 8px; font-weight: 800; cursor: pointer; border: none; }
    @media print { .print-bar { display: none; } body { font-size: 11pt; } }
  </style>
</head>
<body>
  <button class="print-bar" onclick="window.print()">🖨️ ذخیره به‌صورت PDF</button>
  ${body}
  <script>
    document.addEventListener('DOMContentLoaded', function(){
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function(){ setTimeout(function(){ window.focus(); window.print(); }, 350); });
      } else {
        setTimeout(function(){ window.focus(); window.print(); }, 700);
      }
    });
  </script>
</body>
</html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ---------- Delay Report ----------

export interface DelayReportData {
  project: ProjectMeta;
  methodLabel: string;
  summary: {
    excusable: number;
    nonExcusable: number;
    concurrent: number;
    excusableCompensable: number;
    excusableNonCompensable: number;
    critical: number;
    nonCritical: number;
    originalEndDate?: string;
    newEndDate?: string;
  };
  events: Array<{
    title: string;
    category: string;
    startDate: string;
    endDate: string;
    finalDurationDays: number;
    delayType: 'excusable' | 'nonExcusable';
  }>;
  conclusion?: string;
}

function delayReportHtml(data: DelayReportData): { title: string; body: string } {
  const date = shamsiDate();
  const p = data.project || {};
  const s = data.summary;
  const eventsRows = data.events.length === 0
    ? `<tr><td colspan="7" style="text-align:center;color:#64748b">رویدادی ثبت نشده است.</td></tr>`
    : data.events.map((e, i) => `
      <tr>
        <td>${fa(i + 1)}</td>
        <td>${escapeHtml(e.title)}</td>
        <td>${escapeHtml(e.category)}</td>
        <td>${escapeHtml(e.startDate)}</td>
        <td>${escapeHtml(e.endDate)}</td>
        <td>${fa(e.finalDurationDays)}</td>
        <td><span class="badge ${e.delayType === 'excusable' ? 'badge-ex' : 'badge-nex'}">${e.delayType === 'excusable' ? 'مجاز' : 'غیرمجاز'}</span></td>
      </tr>`).join('');

  const body = `
    <div class="header-bar">
      <h1>لایحه تحلیل تأخیرات پروژه</h1>
      <div class="sub">تاریخ تهیه: ${date}${p.briefScope ? ' — دامنه لایحه: ' + escapeHtml(p.briefScope) : ''}</div>
    </div>

    <h2>اطلاعات پروژه</h2>
    <div class="meta-grid">
      <div class="row"><span class="k">نام پروژه:</span>${escapeHtml(p.projectName || '—')}</div>
      <div class="row"><span class="k">شماره قرارداد:</span>${escapeHtml(p.contractNumber || '—')}</div>
      <div class="row"><span class="k">پیمانکار:</span>${escapeHtml(p.contractor || '—')}</div>
      <div class="row"><span class="k">کارفرما:</span>${escapeHtml(p.employer || '—')}</div>
    </div>

    <h2>خلاصه نتایج</h2>
    <div class="summary-grid">
      <div class="cell"><div class="label">تاخیرات مجاز</div><div class="val">${fa(s.excusable)}</div></div>
      <div class="cell"><div class="label">تاخیرات غیرمجاز</div><div class="val">${fa(s.nonExcusable)}</div></div>
      <div class="cell"><div class="label">همزمان</div><div class="val">${fa(s.concurrent)}</div></div>
      <div class="cell"><div class="label">مجاز قابل جبران</div><div class="val">${fa(s.excusableCompensable)}</div></div>
      <div class="cell"><div class="label">مجاز غیرقابل جبران</div><div class="val">${fa(s.excusableNonCompensable)}</div></div>
      <div class="cell"><div class="label">بحرانی</div><div class="val">${fa(s.critical)}</div></div>
      <div class="cell"><div class="label">غیربحرانی</div><div class="val">${fa(s.nonCritical)}</div></div>
      <div class="cell"><div class="label">پایان اولیه / جدید</div><div class="val" style="font-size:10pt">${escapeHtml(s.originalEndDate || '—')} → ${escapeHtml(s.newEndDate || '—')}</div></div>
    </div>

    <h2>روش تحلیل</h2>
    <p>روش تحلیل به‌کاررفته: <b>${escapeHtml(data.methodLabel)}</b></p>

    <h2>جدول رویدادهای تاخیر</h2>
    <table>
      <thead><tr><th>#</th><th>عنوان</th><th>دسته</th><th>تاریخ شروع</th><th>تاریخ پایان</th><th>مدت (روز)</th><th>نوع</th></tr></thead>
      <tbody>${eventsRows}</tbody>
    </table>

    <h2>نتیجه‌گیری</h2>
    <p>${escapeHtml(data.conclusion || 'بر اساس روش تحلیل انتخاب‌شده و رویدادهای ثبت‌شده، خلاصه نتایج فوق ارائه می‌گردد و مستندات پیوست شالوده استنادی این لایحه را تشکیل می‌دهند.')}</p>

    <div class="footer">این گزارش به‌صورت خودکار توسط ClaimManager تهیه شده است — جنبه مشورتی دارد.</div>
  `;
  return { title: `لایحه تاخیرات — ${p.projectName || 'پروژه'}`, body };
}

export async function generateDelayPdf(data: DelayReportData): Promise<void> {
  const { title, body } = delayReportHtml(data);
  openPrintWindow(title, body);
}

// ---------- DOCX (editable) ----------

function rtlPar(text: string, opts: { bold?: boolean; size?: number; heading?: typeof HeadingLevel[keyof typeof HeadingLevel] } = {}): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    heading: opts.heading,
    children: [new TextRun({ text, bold: opts.bold, size: opts.size, rightToLeft: true, font: 'Vazirmatn' })],
  });
}

function thinCell(text: string, opts: { bold?: boolean; shade?: string; width?: number } = {}): TableCell {
  const border = { style: BorderStyle.SINGLE, size: 4, color: '94a3b8' };
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade, color: 'auto' } : undefined,
    borders: { top: border, bottom: border, left: border, right: border },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT, bidirectional: true,
      children: [new TextRun({ text, bold: opts.bold, rightToLeft: true, font: 'Vazirmatn', size: 20 })],
    })],
  });
}

export async function generateDelayDocx(data: DelayReportData): Promise<void> {
  const date = shamsiDate();
  const p = data.project || {};
  const s = data.summary;

  const summaryRows: Array<[string, string]> = [
    ['تاخیرات مجاز', fa(s.excusable)],
    ['تاخیرات غیرمجاز', fa(s.nonExcusable)],
    ['همزمان', fa(s.concurrent)],
    ['مجاز قابل جبران', fa(s.excusableCompensable)],
    ['مجاز غیرقابل جبران', fa(s.excusableNonCompensable)],
    ['بحرانی', fa(s.critical)],
    ['غیربحرانی', fa(s.nonCritical)],
  ];

  const summaryTable = new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [4500, 4500],
    rows: summaryRows.map(([label, value]) => new TableRow({
      children: [
        thinCell(label, { shade: 'eef2ff', bold: true, width: 4500 }),
        thinCell(value, { width: 4500 }),
      ],
    })),
  });

  const metaTable = new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [3000, 6000],
    rows: [
      ['نام پروژه', p.projectName || '—'],
      ['شماره قرارداد', p.contractNumber || '—'],
      ['پیمانکار', p.contractor || '—'],
      ['کارفرما', p.employer || '—'],
      ['دامنه لایحه', p.briefScope || 'هر دو نوع تاخیر'],
      ['روش تحلیل', data.methodLabel],
    ].map(([k, v]) => new TableRow({
      children: [
        thinCell(k, { shade: 'eef2ff', bold: true, width: 3000 }),
        thinCell(v, { width: 6000 }),
      ],
    })),
  });

  const eventsHead = new TableRow({
    children: [
      thinCell('#', { shade: 'eef2ff', bold: true }),
      thinCell('عنوان', { shade: 'eef2ff', bold: true }),
      thinCell('دسته', { shade: 'eef2ff', bold: true }),
      thinCell('تاریخ شروع', { shade: 'eef2ff', bold: true }),
      thinCell('تاریخ پایان', { shade: 'eef2ff', bold: true }),
      thinCell('مدت (روز)', { shade: 'eef2ff', bold: true }),
      thinCell('نوع', { shade: 'eef2ff', bold: true }),
    ],
  });
  const eventsBody = (data.events.length === 0
    ? [new TableRow({ children: [thinCell('رویدادی ثبت نشده است.')] })]
    : data.events.map((e, i) => new TableRow({
        children: [
          thinCell(fa(i + 1)),
          thinCell(e.title),
          thinCell(e.category),
          thinCell(e.startDate),
          thinCell(e.endDate),
          thinCell(fa(e.finalDurationDays)),
          thinCell(e.delayType === 'excusable' ? 'مجاز' : 'غیرمجاز', { shade: e.delayType === 'excusable' ? 'dcfce7' : 'fee2e2' }),
        ],
      })));

  const eventsTable = new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [eventsHead, ...eventsBody],
  });

  const doc = new Document({
    creator: 'ClaimManager', title: 'لایحه تاخیرات', description: 'گزارش تحلیل تاخیرات',
    styles: { default: { document: { run: { font: 'Vazirmatn' } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, right: 960, bottom: 1080, left: 960 } } },
      children: [
        rtlPar('لایحه تحلیل تأخیرات پروژه', { heading: HeadingLevel.HEADING_1, bold: true, size: 36 }),
        rtlPar(`تاریخ تهیه: ${date}`, { size: 22 }),
        rtlPar('اطلاعات پروژه', { heading: HeadingLevel.HEADING_2, bold: true, size: 28 }),
        metaTable,
        rtlPar('خلاصه نتایج', { heading: HeadingLevel.HEADING_2, bold: true, size: 28 }),
        summaryTable,
        rtlPar('جدول رویدادهای تاخیر', { heading: HeadingLevel.HEADING_2, bold: true, size: 28 }),
        eventsTable,
        rtlPar('نتیجه‌گیری', { heading: HeadingLevel.HEADING_2, bold: true, size: 28 }),
        rtlPar(data.conclusion || 'بر اساس روش تحلیل انتخاب‌شده و رویدادهای ثبت‌شده، خلاصه نتایج فوق ارائه می‌گردد و مستندات پیوست شالوده استنادی این لایحه را تشکیل می‌دهند.', { size: 22 }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `لایحه_تاخیرات_${sanitizeForFilename(p.projectName || 'پروژه')}_${date.replace(/\//g, '-')}.docx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Damage Report ----------

export interface DamageReportData {
  project: ProjectMeta;
  source: 'analysis' | 'manual';
  days: { excusable: number; nonExcusable: number; excusableCompensable: number; excusableNonCompensable: number };
  formulas: Array<{ label: string; value: string | number; status: 'ok' | 'incomplete'; missing?: string[] }>;
  totalLoss?: number | string;
}

export async function generateDamagePdf(data: DamageReportData): Promise<void> {
  const date = shamsiDate();
  const p = data.project || {};
  const d = data.days;

  const formulaRows = data.formulas.length === 0
    ? `<tr><td colspan="3" style="text-align:center;color:#64748b">فرمولی محاسبه نشده است.</td></tr>`
    : data.formulas.map((f, i) => `
      <tr>
        <td>${fa(i + 1)}</td>
        <td>${escapeHtml(f.label)}</td>
        <td>${f.status === 'ok' ? `<b>${escapeHtml(String(f.value))}</b>` : `<span style="color:#b45309">ناقص — ${escapeHtml((f.missing || []).join('، '))}</span>`}</td>
      </tr>`).join('');

  const body = `
    <div class="header-bar dmg">
      <h1>لایحه ضرر و زیان</h1>
      <div class="sub">تاریخ تهیه: ${date} — منبع داده: ${data.source === 'manual' ? 'ورود دستی' : 'تحلیل تاخیرات'}</div>
    </div>

    <h2>اطلاعات پروژه</h2>
    <div class="meta-grid">
      <div class="row"><span class="k">نام پروژه:</span>${escapeHtml(p.projectName || '—')}</div>
      <div class="row"><span class="k">شماره قرارداد:</span>${escapeHtml(p.contractNumber || '—')}</div>
      <div class="row"><span class="k">پیمانکار:</span>${escapeHtml(p.contractor || '—')}</div>
      <div class="row"><span class="k">کارفرما:</span>${escapeHtml(p.employer || '—')}</div>
    </div>

    <h2>مبنای محاسبه (روزهای تاخیر)</h2>
    <div class="summary-grid" style="grid-template-columns:repeat(2,1fr)">
      <div class="cell"><div class="label">تاخیرات مجاز</div><div class="val">${fa(d.excusable)}</div></div>
      <div class="cell"><div class="label">تاخیرات غیرمجاز</div><div class="val">${fa(d.nonExcusable)}</div></div>
      <div class="cell"><div class="label">مجاز قابل جبران</div><div class="val">${fa(d.excusableCompensable)}</div></div>
      <div class="cell"><div class="label">مجاز غیرقابل جبران</div><div class="val">${fa(d.excusableNonCompensable)}</div></div>
    </div>

    <h2>فرمول‌های ضرر و زیان</h2>
    <table>
      <thead><tr><th style="width:36px">#</th><th>سرفصل</th><th>نتیجه</th></tr></thead>
      <tbody>${formulaRows}</tbody>
    </table>

    ${data.totalLoss != null ? `<h2>جمع کل قابل مطالبه</h2><p><b style="color:#be123c;font-size:13pt">${escapeHtml(String(data.totalLoss))}</b></p>` : ''}

    <div class="footer">این گزارش به‌صورت خودکار توسط ClaimManager تهیه شده است — جنبه مشورتی دارد.</div>
  `;
  openPrintWindow(`لایحه ضرر و زیان — ${p.projectName || 'پروژه'}`, body);
}
