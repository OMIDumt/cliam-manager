import { createServerFn } from "@tanstack/react-start";
import { generateText, type ModelMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const FileSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  category: z.string(),
  textContent: z.string().max(90_000).optional(),
  base64Data: z.string().max(1_400_000).optional(),
});

const ModelPrefSchema = z.enum(["auto", "pro", "gpt5", "flash"]).default("auto");

const InputSchema = z.object({
  type: z.enum(["FULL", "DELAY", "DAMAGE", "TENDER"]).default("FULL"),
  modelPreference: ModelPrefSchema.optional().default("auto"),
  settings: z
    .object({
      focusKeywords: z.string().optional().default(""),
      specificSections: z.string().optional().default(""),
      excludeSections: z.string().optional().default(""),
      strictMode: z.boolean().optional().default(false),
    })
    .default({
      focusKeywords: "",
      specificSections: "",
      excludeSections: "",
      strictMode: false,
    }),
  systemInstruction: z.string().min(10),
  files: z.array(FileSchema).min(1).max(100),
});

const TOTAL_TEXT_BUDGET = 240_000;
const TOTAL_INLINE_IMAGE_BUDGET = 1_500_000;

const SUPPORTED_INLINE = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// Highest-accuracy models first. The handler walks this list and falls
// back to the next model on transient errors (timeouts, 5xx, payload).
// 429 (rate limit) and 402 (no credits) are NOT retried with another
// model because they apply to the whole workspace.
const MODEL_CHAINS: Record<"auto" | "pro" | "gpt5" | "flash", string[]> = {
  auto: ["google/gemini-2.5-pro", "openai/gpt-5", "google/gemini-2.5-flash"],
  pro: ["google/gemini-2.5-pro", "openai/gpt-5"],
  gpt5: ["openai/gpt-5", "google/gemini-2.5-pro"],
  flash: ["google/gemini-2.5-flash", "google/gemini-2.5-pro"],
};

const MODEL_LABELS: Record<string, string> = {
  "google/gemini-2.5-pro": "Google Gemini 2.5 Pro",
  "openai/gpt-5": "OpenAI GPT-5",
  "google/gemini-2.5-flash": "Google Gemini 2.5 Flash",
};

function isHardError(msg: string): boolean {
  // Do not switch models on these — they are workspace-wide.
  return /\b(402|429)\b/.test(msg);
}

function trimMiddle(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const head = Math.floor(limit * 0.7);
  const tail = limit - head;
  return `${value.slice(0, head)}\n\n[برای پایداری اتصال، بخش میانی متن خلاصه/حذف شد؛ ادامه انتهای سند:]\n\n${value.slice(-tail)}`;
}

function friendlyAiError(message: string): string {
  if (message.includes("429")) return "محدودیت تعداد درخواست — لطفاً چند لحظه بعد دوباره تلاش کنید.";
  if (message.includes("402")) return "اعتبار سرویس هوش مصنوعی به پایان رسیده است. لطفاً اعتبار Lovable AI را شارژ کنید.";
  if (/payload|body|too large|request entity|content length|413/i.test(message)) {
    return "حجم داده ارسالی برای تحلیل زیاد است. تحلیل مرحله‌ای کوچک‌تر فعال شد؛ اگر خطا ادامه داشت تعداد فایل‌ها را در چند نوبت کمتر تحلیل کنید.";
  }
  if (/timeout|network|fetch|connection|aborted/i.test(message)) {
    return "ارتباط با سرویس تحلیل پایدار نماند. فایل‌ها به بسته‌های کوچک‌تر تقسیم شده‌اند؛ لطفاً دوباره تلاش کنید.";
  }
  return message || "تحلیل با خطای نامشخص روبه‌رو شد.";
}

export const analyzeDocuments = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "سرویس هوش مصنوعی پیکربندی نشده است.", attempts: [] };
    }

    const messages: ModelMessage[] = [];

    let remainingTextBudget = TOTAL_TEXT_BUDGET;
    let remainingImageBudget = TOTAL_INLINE_IMAGE_BUDGET;

    data.files.forEach((f, i) => {
      const header = `\n\n[فایل ${i + 1}/${data.files.length}: ${f.name} | دسته‌بندی: ${f.category}]\n`;
      if (f.textContent) {
        const perFileBudget = Math.max(6_000, Math.floor(remainingTextBudget / Math.max(1, data.files.length - i)));
        const text = trimMiddle(f.textContent, perFileBudget);
        remainingTextBudget = Math.max(0, remainingTextBudget - text.length);
        messages.push({ role: "user", content: `${header}${text}` });
      } else if (f.base64Data && SUPPORTED_INLINE.has(f.mimeType)) {
        if (f.base64Data.length <= remainingImageBudget) {
          remainingImageBudget -= f.base64Data.length;
          messages.push({
            role: "user",
            content: [
              { type: "text", text: header },
              { type: "image", image: f.base64Data, mediaType: f.mimeType },
            ],
          });
        } else {
          messages.push({ role: "user", content: `${header}[تصویر به دلیل حجم زیاد برای جلوگیری از قطع اتصال به‌صورت مستقیم ارسال نشد؛ نام و دسته‌بندی فایل در تحلیل لحاظ شود.]` });
        }
      } else {
        messages.push({ role: "user", content: `${header}[فایل قابل پردازش مستقیم نیست؛ لطفاً به PDF/متن تبدیل کنید.]` });
      }
    });

    messages.push({
      role: "user",
      content: `لطفاً با دقت بسیار بالا و رعایت استانداردهای حقوقی، ${data.files.length} فایل پیوست را تحلیل کن و یک گزارش جامع، حرفه‌ای و کاملاً فارسی تهیه نما. تمام داده‌های عددی در جدول ارائه شوند و به مستندات با شماره/تاریخ ارجاع داده شود.`,
    });

    const chain = MODEL_CHAINS[data.modelPreference ?? "auto"];
    const attempts: { model: string; error: string }[] = [];

    const gateway = createLovableAiGatewayProvider(apiKey);

    for (const modelId of chain) {
      try {
        const result = await generateText({
          model: gateway(modelId),
          system: data.systemInstruction,
          messages,
          temperature: data.settings.strictMode ? 0.1 : 0.2,
          maxRetries: 1,
        });
        const out = result.text;
        if (!out || out.trim().length < 50) {
          throw new Error("پاسخ بسیار کوتاه/خالی از مدل دریافت شد.");
        }
        return {
          ok: true as const,
          markdown: out,
          modelUsed: modelId,
          modelLabel: MODEL_LABELS[modelId] ?? modelId,
          attempts,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[analyzeDocuments] model ${modelId} failed:`, message);
        attempts.push({ model: modelId, error: message.slice(0, 300) });
        if (isHardError(message)) {
          return { ok: false as const, error: friendlyAiError(message), attempts };
        }
        // otherwise try next model
      }
    }

    // All models failed — produce a Persian, actionable error summarizing the chain.
    const summary = attempts.map((a) => `• ${MODEL_LABELS[a.model] ?? a.model}: ${a.error}`).join("\n");
    return { ok: false as const, error: `تحلیل با همه مدل‌های انتخاب‌شده با خطا روبه‌رو شد. جزئیات تلاش‌ها:\n${summary}`, attempts };
  });
