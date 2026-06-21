import { createServerFn } from "@tanstack/react-start";
import { generateText, type ModelMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(20000),
});

const InputSchema = z.object({
  reportContent: z.string().min(1).max(200_000),
  analysisType: z.string().max(50),
  history: z.array(MessageSchema).max(40),
  question: z.string().min(1).max(2000),
});

// Same multi-model fallback ladder as the analysis pipeline so the chatbot
// stays answer-able even when the top model is degraded.
const CHAT_MODELS: { id: string; label: string }[] = [
  { id: "google/gemini-2.5-pro", label: "Google Gemini 2.5 Pro" },
  { id: "openai/gpt-5",          label: "OpenAI GPT-5" },
  { id: "google/gemini-2.5-flash", label: "Google Gemini 2.5 Flash" },
];

export const askReportChatbot = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("سرویس هوش مصنوعی پیکربندی نشده است.");
    }

    const typeLabel =
      data.analysisType === "DELAY"
        ? "تحلیل تاخیرات"
        : data.analysisType === "DAMAGE"
          ? "تحلیل ضرر و زیان"
          : data.analysisType === "TENDER"
            ? "بررسی اسناد مناقصه"
            : "گزارش جامع حقوقی-فنی";

    const system = `شما «دستیار هوشمند گزارش» هستید و فقط بر اساس «متن گزارش نهایی تحلیل» زیر پاسخ می‌دهید.

============ متن کامل گزارش نهایی (مرجع پاسخ‌ها) ============
${data.reportContent}
============ پایان گزارش ============

نوع تحلیل: ${typeLabel}

**قواعد پاسخ‌گویی (اجباری و نقض‌ناپذیر):**
1) فقط و فقط از محتوای گزارش بالا استفاده کن. از دانش بیرونی، حدس، یا پر‌کردن خلأ استفاده نکن.
2) قبل از پاسخ، در ذهن خود گزارش را مرور و مرتبط‌ترین بندها را شناسایی کن، سپس عیناً نقل قول کن.
3) ساختار پاسخ دقیقاً به این شکل باشد:
   - بخش «پاسخ:» — حداکثر ۴ تا ۶ خط، فارسی رسمی، در صورت نیاز با بولت.
   - بخش «استناد:» در پایان، شامل ۱ تا ۳ مورد به این فرمت:
     • «نقل قول مستقیم از گزارش» — عنوان بخش/شماره بند مرتبط در گزارش
   - بخش «درجه اطمینان:» در پایان، یک عدد بین ۰ تا ۱۰۰٪ همراه یک خط توجیه (مثلاً «۹۰٪ — مستقیماً در بخش ۴.۲ گزارش آمده»).
4) اگر اطلاعات در گزارش نیست، فقط بنویس: «در گزارش به این مورد اشاره‌ای نشده است.» و بخش‌های استناد/اطمینان را حذف کن. هرگز چیزی از خود نساز.
5) اعداد، تاریخ‌ها، مبالغ، و نام فایل‌ها را عیناً مطابق گزارش بازنویسی کن — حتی اگر در گزارش اشتباه به نظر برسد، تغییر نده.
6) از عبارت‌های «به نظر می‌رسد»، «احتمالاً»، «معمولاً»، «شاید» و مشابه استفاده نکن.
7) اگر سؤال مبهم است، قبل از پاسخ یک سؤال شفاف‌سازی کوتاه بپرس.`;

    const messages: ModelMessage[] = [
      ...data.history.map((m) => ({ role: m.role, content: m.content }) as ModelMessage),
      { role: "user", content: data.question },
    ];

    const gateway = createLovableAiGatewayProvider(apiKey);
    const attempts: { model: string; error: string }[] = [];

    for (const m of CHAT_MODELS) {
      try {
        const result = await generateText({
          model: gateway(m.id),
          system,
          messages,
          temperature: 0.15,
          maxRetries: 1,
        });
        const text = (result.text || "").trim();
        if (text.length < 5) throw new Error("پاسخ خالی از مدل دریافت شد.");
        return { text, modelUsed: m.id, modelLabel: m.label };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attempts.push({ model: m.id, error: message.slice(0, 200) });
        // hard failures shared across all models — surface immediately
        if (message.includes("429")) throw new Error("محدودیت تعداد درخواست — لطفاً چند لحظه بعد دوباره تلاش کنید.");
        if (message.includes("402")) throw new Error("اعتبار سرویس هوش مصنوعی به پایان رسیده است.");
        // otherwise try next model
      }
    }

    const summary = attempts.map((a) => `• ${a.model}: ${a.error}`).join("\n");
    throw new Error(`پاسخ‌گویی با همه مدل‌ها ناموفق بود.\n${summary}`);
  });
