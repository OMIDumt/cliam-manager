import { AnalysisType } from '../types';

interface ReportMetadata {
  contractNumber?: string;
  contractDate?: string;
  contractTitle?: string;
  contractorName?: string;
  employerName?: string;
  projectTitle?: string;
  reportDate: string;
}

export const formatReportForPDF = (
  content: string,
  type: AnalysisType,
  metadata?: ReportMetadata
): string => {
  const date = metadata?.reportDate || new Date().toLocaleDateString('fa-IR');
  
  // Determine report title based on type
  let reportTitle = '';
  let reportSubtitle = '';
  
  switch (type) {
    case 'DELAY':
      reportTitle = 'دفترچه شماره 1: عوامل بروز خسارات مالی و تأخیرات';
      reportSubtitle = 'تحلیل جامع تاخیرات پروژه';
      break;
    case 'DAMAGE':
      reportTitle = 'دفترچه شماره 2: تحلیل ضرر و زیان';
      reportSubtitle = 'تحلیل جامع خسارات مالی و هزینه‌ها';
      break;
    case 'TENDER':
      reportTitle = 'گزارش تحلیل مناقصه';
      reportSubtitle = 'بررسی شرایط و ریسک‌های قرارداد';
      break;
    case 'FULL':
    default:
      reportTitle = 'گزارش جامع تحلیل ادعا و تاخیرات';
      reportSubtitle = 'تحلیل جامع تاخیرات، ضرر و زیان و بررسی اسناد مناقصه';
      break;
  }

  // Format content with proper structure
  const formattedContent = formatContentStructure(content, type);

  return generateCompleteReport(formattedContent, reportTitle, reportSubtitle, date, metadata);
};

const formatContentStructure = (content: string, type: AnalysisType): string => {
  // Parse markdown-like structure and convert to PDF format
  let formatted = content;

  // Ensure proper section numbering for DELAY reports
  if (type === 'DELAY') {
    formatted = ensureDelayReportStructure(formatted);
  }

  // Ensure proper section numbering for DAMAGE reports
  if (type === 'DAMAGE') {
    formatted = ensureDamageReportStructure(formatted);
  }

  return formatted;
};

const ensureDelayReportStructure = (content: string): string => {
  // Structure matching PDF format:
  // مقدمة
  // بخش اول: مروری بر وضعیت پروژه
  //   1-1 مشخصات پروژه
  //   2-1 نمودار خط زمانی پروژه
  //   3-1 روش بررسی تأخیرات فنی و قراردادی
  //   4-1 خط زمانی رویدادهای مهم پروژه
  // بخش دوم: عوامل بروز تأخیر و تجزیه و تحلیل اثر آنها
  //   1-2 تأخیر در تحویل کارگاه...
  //   2-2 عدم انجام تعهدات مالی...
  //   4-2 جمع‌بندی مدت تأخیرات
  
  let structured = content;

  // Add مقدمة if not present
  if (!structured.includes('مقدمه') && !structured.includes('مقدمة')) {
    structured = `# مقدمة\n\n${structured}`;
  }

  // Ensure proper section structure
  if (!structured.includes('بخش اول')) {
    structured = structured.replace(
      /#\s*تحلیل.*تاخیرات/i,
      '# بخش اول: مروری بر وضعیت پروژه\n\n## 1-1 مشخصات پروژه\n\n## 2-1 نمودار خط زمانی پروژه\n\n## 3-1 روش بررسی تأخیرات فنی و قراردادی\n\n## 4-1 خط زمانی رویدادهای مهم پروژه\n\n# بخش دوم: عوامل بروز تأخیر و تجزیه و تحلیل اثر آنها\n\n'
    );
  }

  // Ensure جمع‌بندی section exists
  if (!structured.includes('جمع‌بندی') && !structured.includes('جمع بندی')) {
    structured += '\n\n# 4-2 جمع‌بندی مدت تأخیرات\n\nدر این بخش جمع‌بندی نهایی آنالیز تأخیرات انجام می‌شود.';
  }

  return structured;
};

const ensureDamageReportStructure = (content: string): string => {
  // Structure matching PDF format for damage reports
  let structured = content;

  // Add مقدمة if not present
  if (!structured.includes('مقدمه') && !structured.includes('مقدمة')) {
    structured = `# مقدمة\n\n${structured}`;
  }

  // Ensure financial analysis sections
  if (!structured.includes('تحلیل ضرر و زیان')) {
    structured = structured.replace(
      /#\s*تحلیل.*ضرر.*زیان/i,
      '# بخش اول: تحلیل ضرر و زیان و هزینه‌ها\n\n'
    );
  }

  return structured;
};

const generateCompleteReport = (
  content: string,
  title: string,
  subtitle: string,
  date: string,
  metadata?: ReportMetadata
): string => {
  const contractInfo = metadata?.contractNumber 
    ? `قرارداد شماره ${metadata.contractNumber}`
    : 'قرارداد شماره ----------------';

  return `# ${title}

${subtitle}

${metadata?.contractTitle || 'عنوان کامل قرارداد با پروژه به همراه شماره قرارداد و تاریخ قرارداد'}

${contractInfo}
${metadata?.contractDate ? `تاریخ قرارداد: ${metadata.contractDate}` : ''}

تاریخ تهیه لایحه: ${date}

---

${content}

---

# پیوست‌ها

در این بخش اسناد مورد استفاده در این لایحه درج می‌شود.
`;
};

export const generateHTMLReport = (
  content: string,
  type: AnalysisType,
  metadata?: ReportMetadata
): string => {
  const formattedReport = formatReportForPDF(content, type, metadata);
  const date = metadata?.reportDate || new Date().toLocaleDateString('fa-IR');
  
  let reportTitle = '';
  let reportSubtitle = '';
  
  switch (type) {
    case 'DELAY':
      reportTitle = 'دفترچه شماره 1: عوامل بروز خسارات مالی و تأخیرات';
      reportSubtitle = 'تحلیل جامع تاخیرات پروژه';
      break;
    case 'DAMAGE':
      reportTitle = 'دفترچه شماره 2: تحلیل ضرر و زیان';
      reportSubtitle = 'تحلیل جامع خسارات مالی و هزینه‌ها';
      break;
    case 'TENDER':
      reportTitle = 'گزارش تحلیل مناقصه';
      reportSubtitle = 'بررسی شرایط و ریسک‌های قرارداد';
      break;
    case 'FULL':
    default:
      reportTitle = 'گزارش جامع تحلیل ادعا و تاخیرات';
      reportSubtitle = 'تحلیل جامع تاخیرات، ضرر و زیان و بررسی اسناد مناقصه';
      break;
  }

  // Convert markdown to HTML
  let htmlContent = formattedReport
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br />');

  // Wrap list items
  htmlContent = htmlContent.replace(/(<li>.*?<\/li>)/gim, '<ul>$1</ul>');
  htmlContent = htmlContent.replace(/<\/ul>\s*<br \/>\s*<ul>/gim, '');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${reportTitle} - ClaimManager</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
  
  @page {
    size: A4;
    margin: 2cm;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.8;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 20px;
  }

  .report-container {
    max-width: 210mm;
    margin: 0 auto;
    background: #fff;
  }

  /* Professional Header Table Layout - Matching PDF Structure */
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
    border: 2px solid #000;
  }
  
  .header-table td {
    border: 1px solid #000;
    padding: 10px;
    vertical-align: middle;
    text-align: center;
  }

  .logo-box {
    width: 80px;
    height: 80px;
    background: #f3f4f6;
    border: 1px dashed #999;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    font-size: 10px;
    color: #666;
    font-weight: bold;
    text-align: center;
  }

  .report-title-box {
    padding: 15px;
  }
  
  .report-title-box h1 {
    margin: 0;
    font-size: 16pt;
    font-weight: 900;
    color: #000;
  }
  
  .report-subtitle {
    font-size: 10pt;
    margin-top: 5px;
    color: #333;
    font-weight: 600;
  }

  /* Content Styling */
  .content {
    text-align: justify;
    padding: 20px 0;
  }

  h1 { 
    font-size: 14pt; 
    font-weight: bold; 
    margin-top: 25px; 
    margin-bottom: 15px; 
    color: #000; 
    border-bottom: 2px solid #eee; 
    padding-bottom: 5px;
  }
  
  h2 { 
    font-size: 12pt; 
    font-weight: bold; 
    margin-top: 20px; 
    margin-bottom: 10px; 
    color: #333;
  }
  
  h3 { 
    font-size: 11pt; 
    font-weight: bold; 
    margin-top: 15px; 
    margin-bottom: 5px;
    color: #444;
  }
  
  ul { 
    margin: 5px 20px 15px 0; 
    padding-right: 20px;
    list-style-type: disc;
  }
  
  li { 
    margin-bottom: 8px;
    line-height: 1.8;
  }
  
  strong { 
    font-weight: 900;
    color: #000;
  }

  p {
    margin-bottom: 10px;
    text-align: justify;
  }

  /* Footer */
  .footer {
    margin-top: 50px;
    padding-top: 10px;
    border-top: 1px solid #000;
    font-size: 8pt;
    display: flex;
    justify-content: space-between;
    color: #444;
  }

  /* Table styling for reports */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    font-size: 10pt;
  }

  table th,
  table td {
    border: 1px solid #000;
    padding: 8px;
    text-align: center;
  }

  table th {
    background-color: #f3f4f6;
    font-weight: bold;
  }

  @media print {
    body { 
      padding: 0; 
      background: #fff;
    }
    .no-print { 
      display: none; 
    }
    button { 
      display: none; 
    }
    .report-container {
      margin: 0;
      max-width: 100%;
    }
  }
</style>
</head>
<body>
  <div class="report-container">
    
    <!-- Formal Header Matching PDF Structure -->
    <table class="header-table">
      <tr>
        <td width="20%">
          <div class="logo-box">${metadata?.employerName || 'لوگو شرکت کارفرما'}</div>
        </td>
        <td width="60%" class="report-title-box">
          <h1>${reportTitle}</h1>
          <div class="report-subtitle">${reportSubtitle}</div>
          ${metadata?.contractNumber ? `<div class="report-subtitle" style="margin-top: 5px;">${metadata.contractNumber}</div>` : ''}
        </td>
        <td width="20%">
          <div class="logo-box">${metadata?.contractorName || 'لوگو شرکت پیمانکار'}</div>
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <div style="display: flex; justify-content: space-between; padding: 0 10px; font-size: 10pt;">
            <span><strong>تاریخ:</strong> ${date}</span>
            <span><strong>پروژه:</strong> ${metadata?.contractNumber || 'قرارداد شماره ----------------'}</span>
            <span><strong>پیوست:</strong> دارد</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="content">
      <p>${htmlContent}</p>
    </div>

    <div class="footer">
      <div>تهیه شده توسط سامانه هوشمند مدیریت ادعا (ClaimManager)</div>
      <div>این گزارش جنبه مشورتی دارد</div>
    </div>
  </div>
</body>
</html>`;
};

