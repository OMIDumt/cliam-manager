import { ProcessedFile, AnalysisSettings, AnalysisType } from "../types";

// Demo fallback reports have been removed. All analyses go through the AI gateway.

// Enhanced system instruction with higher accuracy requirements
const generateSystemInstruction = (settings: AnalysisSettings, type: AnalysisType, fileNames: string[] = []) => {
  const filesBlock = fileNames.length
    ? `\n**فهرست دقیق اسناد آپلودشده (همین نام‌ها باید در ارجاعات استفاده شوند):**\n${fileNames.map((n, i) => `${i + 1}. «${n}»`).join('\n')}\n`
    : '';
  const baseInstruction = `
شما «ClaimManager — دستیار هوشمند مدیریت ادعاهای ساخت» هستید؛ یک دستیار تخصصی فنی-حقوقی برای تحلیل اسناد پروژه‌های ساخت.

**قواعد بنیادی (نقض‌ناپذیر):**
1) **هرگز فرض نکنید کاربر پیمانکار است.** نقش کاربر (پیمانکار/کارفرما/مشاور/سایر) و دامنه تحلیل از بخش «تنظیمات کاربر» مشخص می‌شود و باید لحن، عنوان و نتیجه‌گیری گزارش دقیقاً بر اساس همان نقش و دامنه تنظیم شود.
2) **عنوان گزارش باید خنثی باشد**، مثلاً: «لایحه تحلیلی جامع تأخیرات و خسارات در پروژه …» — هرگز عبارت «ادعاهای پیمانکار» را در عنوان یا متن پیش‌فرض ننویسید مگر آنکه نقش کاربر «پیمانکار» باشد.
3) **سطر «به:» باید با نام تهیه‌کننده (که در تنظیمات کاربر آمده) پر شود**، نه با نام طرف قرارداد یا شرکت. مثال صحیح: «به: جناب آقای/سرکار خانم {نام تهیه‌کننده}».
4) **سطر «از:» همیشه دقیقاً این‌گونه است:** «از: ClaimManager — دستیار هوشمند مدیریت ادعاهای ساخت». از عبارت «دستیار هوشمند حقوقی» استفاده نکنید.
5) **همه‌ی** اسناد آپلودشده باید بررسی شوند — اگر گزارش ماهانه‌ای از ماه‌های متعدد آپلود شده، آخرین داده باید از آخرین ماه آپلودشده استخراج شود نه از یک ماه میانی.
6) **ارجاع به مستندات همیشه با نام واقعی فایل** انجام شود، نه با عبارت «فایل ۱۰» یا «فایل ۴۲». از فهرست فایل‌های زیر استفاده کنید و دقیقاً همان نام فایل را داخل گیومه بیاورید: «نام-فایل.pdf — ص …».
7) برای هر تأخیر شناسایی‌شده، **رکورد کامل اجباری** است: «شرح | مسبب (کارفرما/پیمانکار/خارجی) | نوع (مجاز/غیرمجاز/همزمان) | تاریخ شروع + مستند مرجع | تاریخ پایان + مستند مرجع | مدت به روز | اثر بر مسیر بحرانی». رکوردهای ناقص قابل قبول نیستند — اگر داده‌ای در اسناد نیست، در همان ستون بنویسید «در اسناد یافت نشد».
8) **اولویت اول استناد، متن قرارداد و مکاتبات رسمی است.** اگر قرارداد یا مکاتبه‌ای آپلود شده، باید به بندهای مرتبط ارجاع داده شود.
9) اگر فایل برنامه زمان‌بندی به فرمت Microsoft Project (.mpp) یا Primavera (.xer/.xml) یا اکسل آپلود شده اما به‌صورت متن استخراج‌نشده در اختیار شما نیست، **صریحاً در گزارش بنویسید**: «فایل برنامه زمان‌بندی «{نام فایل}» آپلود شده است اما در فرمت {نوع} است و تحلیل مسیر بحرانی روی آن در این مرحله مقدور نبوده؛ تحلیل حاضر بر مبنای داده‌های توصیفی استخراج‌شده از گزارش‌های ماهانه و مکاتبات انجام شده است.» هرگز ادعا نکنید برنامه زمان‌بندی «ارائه نشده» در حالی که فایلش در فهرست هست.
10) از تخمین، گرد کردن، یا عبارت‌های «به نظر می‌رسد/احتمالاً/معمولاً» استفاده نکنید.
${filesBlock}
**دقت و کیفیت گزارش:**
- تمام اطلاعات باید مستند و قابل ردیابی باشند (با نام دقیق فایل)
- ارجاع دقیق به شماره صفحه، بند قرارداد، و تاریخ
- استفاده از جداول برای نمایش داده‌های عددی
- تفکیک واضح بین واقعیات و تحلیل‌ها
`;

  let outputStructure = "";

  switch (type) {
    case 'DELAY':
      outputStructure = `
**تمرکز تحلیل: لایحه تحلیل تاخیرات پروژه**

**ساختار الزامی گزارش:**

# عنوان پروژه و مشخصات کلی

## ۱. مقدمه و خلاصه اجرایی
- شرح مختصر پروژه (با ذکر نام، مکان، و محدوده کار)
- هدف از تهیه لایحه
- دوره زمانی مورد بررسی

## ۲. مستندات پایه پیمان
- شماره و تاریخ قرارداد (ارجاع به سند)
- طرفین قرارداد (کارفرما/پیمانکار)
- مبلغ اولیه و نهایی پیمان
- مدت اولیه و تمدیدهای قراردادی

## ۳. تحلیل زمان‌بندی پروژه
### ۳.۱. برنامه زمان‌بندی مصوب
- تاریخ شروع و پایان برنامه‌ریزی شده (جدول)
- نقاط عطف کلیدی (Milestones)

### ۳.۲. عملکرد واقعی پروژه
- تاریخ شروع و پایان واقعی (جدول)
- میزان انحراف از برنامه (محاسبه دقیق)

## ۴. شناسایی و طبقه‌بندی تأخیرات (جدول رکورد کامل برای هر مورد)
هر ردیف باید این ستون‌ها را داشته باشد و **هیچ ستونی خالی نماند** (در صورت نبود اطلاعات، صریحاً «در اسناد یافت نشد» نوشته شود):
| # | شرح تأخیر | مسبب | نوع (مجاز/غیرمجاز/همزمان) | تاریخ شروع | مستند شروع (نام دقیق فایل + ص) | تاریخ پایان | مستند پایان (نام دقیق فایل + ص) | مدت (روز) | اثر بر مسیر بحرانی |

### ۴.۱. تأخیرات منتسب به کارفرما
### ۴.۲. تأخیرات منتسب به پیمانکار

### ۴.۳. تاخیرات ناشی از عوامل خارجی (فورس ماژور)
- شرایط آب و هوایی (با ارجاع به گزارش هواشناسی)
- تغییرات قانونی و مقررات
- سایر عوامل خارج از کنترل

## ۵. تحلیل علل ریشه‌ای تاخیرات
- دلایل اصلی هر تاخیر (تحلیل عمیق)
- اثرات زنجیره‌ای و تبعی

## ۶. مستندات و ارجاعات قراردادی
- بندهای مربوط به تمدید مدت (شماره ماده)
- مکاتبات و قراردادها/الحاقیه‌ها/متمم‌ها/صورتجلسات/دستورکارها مرتبط (فهرست)
- تاییدیه‌های کارفرما

## ۷. محاسبه تمدید مدت پیمان
- روش محاسبه استفاده شده (CPM, PERT, یا روش دیگر)
- جدول محاسباتی تفصیلی
- جمع‌بندی درخواست تمدید

## ۸. جمع‌بندی و پیشنهادات
- خلاصه یافته‌ها (با اعداد و ارقام دقیق)
- پیشنهادات برای حل و فصل

**نکات مهم:**
- استفاده از جداول برای تمام داده‌های عددی
- ارجاع دقیق به مستندات (شماره، تاریخ، صفحه)
- محاسبات باید قابل بررسی باشند
- در صورت عدم وجود اطلاعات، صریحا ذکر شود: "موردی در اسناد یافت نشد"
`;
      break;
    
    case 'DAMAGE':
      outputStructure = `
**تمرکز تحلیل: لایحه تحلیل ضرر و زیان**

**ساختار الزامی گزارش:**

# عنوان پروژه و مشخصات کلی

## ۱. مقدمه و خلاصه اجرایی
- شرح مختصر ادعا
- مبلغ کل خسارت مورد مطالبه (عدد دقیق)
- مبنای حقوقی ادعا (ارجاع به مواد قانونی)

## ۲. مشخصات قراردادی
- شماره و تاریخ قرارداد
- مبلغ اولیه پیمان
- الحاقیه‌ها و متمم‌ها (جدول)
- شرایط پرداخت

## ۳. شرح وقایع و رویدادها
- خط سیر زمانی رویدادها (جدول با تاریخ دقیق)
- اقدامات انجام شده توسط طرفین
- نقاط بحرانی پروژه

## ۴. طبقه‌بندی خسارات
### ۴.۱. هزینه‌های مستقیم
- هزینه نیروی انسانی اضافی (جدول تفصیلی)
- هزینه تجهیزات و ماشین‌آلات (جدول)
- هزینه مواد و مصالح

### ۴.۲. هزینه‌های بالاسری (Overhead)
- هزینه‌های بالاسری کارگاه
- هزینه‌های بالاسری دفتر مرکزی
- محاسبه بر اساس فرمول آیزنر/هادسون (با نمایش فرمول)

### ۴.۳. خسارت تاخیر در پرداخت
- صورت‌وضعیت‌های پرداخت نشده (جدول)
- محاسبه جریمه تاخیر (با فرمول)

### ۴.۴. عدم‌النفع و فرصت‌های از دست رفته
- پروژه‌های از دست رفته
- هزینه فرصت سرمایه (محاسبه)

## ۵. مستندات و مدارک پشتیبان
- فهرست صورت‌وضعیت‌ها
- فاکتورها و اسناد مالی (تعداد)
- مکاتبات و ابلاغیه‌ها (تعداد)

## ۶. مبانی حقوقی ادعا
- ارجاع به بندهای قرارداد (شماره ماده)
- قوانین و مقررات مرتبط
- رویه‌های قضایی مشابه

## ۷. محاسبات مالی تفصیلی
- جداول محاسباتی کامل
- نرخ‌ها و شاخص‌های استفاده شده
- جمع‌بندی مبالغ (جدول نهایی)

## ۸. جمع‌بندی و نتیجه‌گیری
- خلاصه ادعاها
- مبلغ نهایی مطالبه (عدد دقیق)
- درخواست‌های اجرایی

**نکات مهم:**
- تمام محاسبات باید با فرمول و قابل بررسی باشند
- استفاده از جداول برای تمام مبالغ
- ارجاع به مستندات مالی (شماره فاکتور، تاریخ)
- مبالغ به ریال و با فرمت عددی صحیح
`;
      break;

    case 'TENDER':
      outputStructure = `
**تمرکز تحلیل: تحلیل اسناد مناقصه**

**ساختار الزامی:**
- مشخصات کلی مناقصه (جدول)
- شرایط شرکت در مناقصه
- تضامین و سپرده‌ها (جدول)
- معیارهای ارزیابی
- ریسک‌های کلیدی
- نتیجه‌گیری و پیشنهادات
`;
      break;

    case 'FULL':
    default:
      outputStructure = `
**تمرکز تحلیل: گزارش جامع**

**ساختار الزامی:**
- خلاصه مدیریتی
- مشخصات پروژه
- تحلیل تاخیرات (خلاصه)
- تحلیل ضرر و زیان (خلاصه)
- مستندات و ارجاعات
- نتیجه‌گیری و پیشنهادات
`;
      break;
  }

  const verbosityLabel =
    settings.verbosity === 'concise' ? 'خلاصه (فقط نکات کلیدی، بدون توضیحات اضافه)'
    : settings.verbosity === 'detailed' ? 'جامع و مفصل (با تشریح کامل استدلال‌ها، سوابق و مستندات)'
    : 'استاندارد (متعادل بین خلاصه و جزئیات)';
  const strategyLabel =
    settings.strategy === 'precision' ? 'دقیق‌ترین (اولویت کیفیت و عمق تحلیل)'
    : settings.strategy === 'fast' ? 'سریع‌تر (مناسب حجم بالا، اولویت سرعت)'
    : 'متعادل';
  const minConf = typeof settings.minConfidence === 'number' ? settings.minConfidence : 70;
  const citationsLine = settings.requireCitations === false
    ? 'استناد مستقیم: غیرضروری'
    : 'استناد مستقیم: الزامی — برای هر عدد/تاریخ/فیلد استخراج‌شده باید عین جمله/عبارت منبع داخل گیومه «...» همراه با نام فایل و شماره صفحه ذکر شود.';

  return `${baseInstruction}

${outputStructure}

---
**تنظیمات کاربر:**
- کلمات کلیدی برای تمرکز: ${settings.focusKeywords || "همه موارد"}
- بخش‌های مورد نظر: ${settings.specificSections || "تمام سند"}
- بخش‌های نادیده گرفته: ${settings.excludeSections || "هیچ"}
- حالت سخت‌گیرانه: ${settings.strictMode ? "بله - فقط اطلاعات صریح و مستند" : "خیر - تحلیل منطقی مجاز"}
- استراتژی تحلیل: ${strategyLabel}
- سطح جزئیات خروجی: ${verbosityLabel}
- حداقل درصد اطمینان قابل قبول: ${minConf}٪ — یافته‌هایی با اطمینان کمتر از این مقدار باید با برچسب «⚠ نیازمند بررسی» و توضیح عدم قطعیت درج شوند (نه حذف).
- ${citationsLine}

**دستورالعمل‌های نهایی:**
1. زبان خروجی: کاملا فارسی با املای صحیح
2. لحن: رسمی، حقوقی و مدیرانه
3. ساختار: دقیقا طبق فرمت بالا
4. مستندسازی: ارجاع به شماره صفحه/بند/تاریخ
5. جداول: استفاده از جداول برای داده‌های عددی
6. دقت: تمام اعداد و ارقام باید دقیق و قابل بررسی باشند
7. شفافیت: در صورت عدم وجود اطلاعات، صریحا ذکر شود
8. کیفیت: گزارش باید آماده ارسال به مراجع قضایی باشد
`;
};

const isSupportedMimeType = (mimeType: string) => {
  return [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
    'text/plain',
  ].includes(mimeType);
};

const CLIENT_TOTAL_TEXT_BUDGET = 240_000;
const CLIENT_TOTAL_IMAGE_BUDGET = 1_500_000;
const CLIENT_BATCH_TEXT_BUDGET = 150_000;
const CLIENT_BATCH_IMAGE_BUDGET = 900_000;

const trimForTransport = (value: string, limit: number): string => {
  if (value.length <= limit) return value;
  const head = Math.floor(limit * 0.72);
  const tail = limit - head;
  return `${value.slice(0, head)}\n\n[بخش میانی سند برای جلوگیری از خطای اتصال خلاصه/حذف شد؛ ادامه انتهای سند:]\n\n${value.slice(-tail)}`;
};

type PayloadFile = {
  name: string;
  mimeType: string;
  category: string;
  textContent?: string;
  base64Data?: string;
};

const chunkPayloadFiles = (files: PayloadFile[]): PayloadFile[][] => {
  const batches: PayloadFile[][] = [];
  let current: PayloadFile[] = [];
  let textSize = 0;
  let imageSize = 0;

  const flush = () => {
    if (current.length > 0) batches.push(current);
    current = [];
    textSize = 0;
    imageSize = 0;
  };

  files.forEach((file) => {
    const nextText = file.textContent?.length ?? 0;
    const nextImage = file.base64Data?.length ?? 0;
    const wouldOverflow =
      current.length > 0 &&
      (textSize + nextText > CLIENT_BATCH_TEXT_BUDGET ||
        imageSize + nextImage > CLIENT_BATCH_IMAGE_BUDGET ||
        current.length >= 6);
    if (wouldOverflow) flush();
    current.push(file);
    textSize += nextText;
    imageSize += nextImage;
  });
  flush();
  return batches;
};

import { analyzeDocuments } from '../../lib/ai/analyze.functions';

const CONFIDENCE_BLOCK = `

**شفافیت و قابلیت بازبینی محاسبات (الزامی):**
در پایان هر بخش مهم گزارش (شامل: هر تأخیر شناسایی‌شده، هر آیتم خسارت محاسبه‌شده، و هر نتیجه‌گیری قراردادی)، یک کادر «شفافیت تحلیل» با ساختار زیر اضافه کن:

> **شفافیت تحلیل**
> - **درصد اطمینان:** عدد دقیق بین ۰ تا ۱۰۰٪ + یک سطر توجیه کوتاه (مثلاً «۸۵٪ — مستند به نامه شماره … و گزارش پیشرفت ماه …»).
> - **فیلدهای استخراج‌شده مبنای محاسبه:** فهرست بولت‌دار از تک‌تک داده‌های عددی/تاریخی مورد استفاده، به این فرمت دقیق:
>   • «نام فیلد = مقدار» — **استناد مستقیم:** «عینِ جمله یا عبارت کوتاه نقل‌شده از متن منبع داخل گیومه» (منبع: نام دقیق فایل — ص …، بند/پاراگراف …)
>   اگر فیلدی از اسناد در نیامده و فرض شده، با برچسب «[فرض]» مشخص کن و دلیل فرض را بنویس.
> - **فرمول/منطق:** خط به خط نشان بده چگونه از این فیلدها به نتیجه نهایی رسیده‌ای (مثلاً: مدت = تاریخ پایان − تاریخ شروع − تعطیلات).
> - **عدم قطعیت‌ها:** مواردی که داده ناقص است یا چند تفسیر دارد را صریحاً فهرست کن.

قاعدهٔ ضروری: هیچ عدد، تاریخ، مبلغ یا نام مستندی در گزارش نباید بدون «استناد مستقیم» (نقل قول کوتاه از متن منبع) درج شود. اگر نقل قول مستقیم در دسترس نیست، صریحاً بنویس «[فاقد نقل قول مستقیم — استنتاج]» و درصد اطمینان را پایین‌تر گزارش کن.

این کادر برای هر آیتم جداگانه و بلافاصله پس از همان آیتم قرار می‌گیرد — نه به‌صورت تجمیعی در انتهای گزارش.
`;

export const analyzeLegalDocuments = async (
  files: ProcessedFile[],
  settings: AnalysisSettings,
  type: AnalysisType = 'FULL'
): Promise<{ markdown: string; modelLabel: string; modelUsed: string }> => {
  if (files.length === 0) {
    throw new Error('هیچ فایلی برای پردازش انتخاب نشده است.');
  }

  let remainingTextBudget = CLIENT_TOTAL_TEXT_BUDGET;
  let remainingImageBudget = CLIENT_TOTAL_IMAGE_BUDGET;
  const payloadFiles: PayloadFile[] = files.map((f, index) => {
    const remainingFiles = Math.max(1, files.length - index);
    const perFileTextBudget = Math.min(85_000, Math.max(5_000, Math.floor(remainingTextBudget / remainingFiles)));
    const textContent = f.textContent
      ? trimForTransport(f.textContent, perFileTextBudget)
      : undefined;
    if (textContent) remainingTextBudget = Math.max(0, remainingTextBudget - textContent.length);

    const base64Data = !textContent && f.base64Data && isSupportedMimeType(f.mimeType) && f.base64Data.length <= remainingImageBudget
      ? f.base64Data
      : undefined;
    if (base64Data) remainingImageBudget = Math.max(0, remainingImageBudget - base64Data.length);

    return {
      name: f.file.name,
      mimeType: f.mimeType,
      category: f.category,
      textContent: textContent || (!base64Data && f.base64Data ? '[تصویر/اسکن به دلیل حجم زیاد برای جلوگیری از خطای اتصال ارسال نشد؛ لطفاً نسخه PDF متنی یا تصویر کم‌حجم‌تر بارگذاری شود.]' : undefined),
      base64Data,
    };
  });

  const serverSettings = {
    focusKeywords: settings.focusKeywords ?? '',
    specificSections: settings.specificSections ?? '',
    excludeSections: settings.excludeSections ?? '',
    strictMode: !!settings.strictMode,
  };
  const callAnalyzer = async (batchFiles: PayloadFile[], instruction: string) => {
    const res = await analyzeDocuments({
      data: {
        type,
        modelPreference: settings.modelPreference ?? 'auto',
        settings: serverSettings,
        systemInstruction: instruction,
        files: batchFiles,
      },
    });
    if (!res.ok) throw new Error(res.error || 'تحلیل با خطا روبه‌رو شد.');
    return res;
  };

  try {
    const batches = chunkPayloadFiles(payloadFiles);
    const baseInstruction = generateSystemInstruction(settings, type, payloadFiles.map((f) => f.name)) + CONFIDENCE_BLOCK;

    if (batches.length <= 1) {
      const res = await callAnalyzer(payloadFiles, baseInstruction);
      return { markdown: res.markdown, modelLabel: res.modelLabel, modelUsed: res.modelUsed };
    }

    const partials = [] as Array<{ markdown: string; modelLabel: string; modelUsed: string }>;
    for (let i = 0; i < batches.length; i += 1) {
      const batch = batches[i];
      const partialInstruction = `${baseInstruction}\n\n**اجرای مرحله‌ای:** این بسته ${i + 1} از ${batches.length} است. فقط همین فایل‌های بسته را تحلیل کن، همه اعداد/تاریخ‌ها/استنادهای مستقیم را استخراج کن و خروجی را به‌صورت «یافته‌های قابل ادغام» بنویس.`;
      const res = await callAnalyzer(batch, partialInstruction);
      partials.push({ markdown: res.markdown, modelLabel: res.modelLabel, modelUsed: res.modelUsed });
    }

    const summaryFiles: PayloadFile[] = partials.map((p, i) => ({
      name: `خلاصه مرحله ${i + 1}.md`,
      mimeType: 'text/plain',
      category: 'خلاصه تحلیل مرحله‌ای',
      textContent: trimForTransport(p.markdown, 55_000),
    }));
    const finalInstruction = `${baseInstruction}\n\n**ادغام نهایی:** ورودی‌های فعلی خلاصه‌های مستندِ تحلیل مرحله‌ای هستند. آن‌ها را بدون حذف استنادها و بدون ساختن عدد جدید، در یک گزارش نهایی منسجم ادغام کن. اگر بین بسته‌ها تعارض دیدی، تعارض را با درصد اطمینان و منبع هر دو طرف گزارش کن.`;
    const finalRes = await callAnalyzer(summaryFiles, finalInstruction);
    const usedLabels = Array.from(new Set([...partials.map((p) => p.modelLabel), finalRes.modelLabel])).join(' + ');
    const usedModels = Array.from(new Set([...partials.map((p) => p.modelUsed), finalRes.modelUsed])).join(',');
    return { markdown: finalRes.markdown, modelLabel: `${usedLabels} (تحلیل مرحله‌ای)`, modelUsed: usedModels };
  } catch (err: unknown) {
    console.error('AI analysis failed:', err);
    const msg =
      err instanceof Error
        ? err.message
        : 'خطا در ارتباط با سرویس هوش مصنوعی. لطفاً دوباره تلاش کنید.';
    throw new Error(msg);
  }
};

