// Wrap any AI call. Always returns Persian-friendly message on failure.
export const AI_ERROR_MESSAGE = 'خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.';

export interface AiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function runAi<T>(fn: () => Promise<T>): Promise<AiResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    // never surface the raw English error to users
    // eslint-disable-next-line no-console
    console.error('[AI]', err);
    const message = err instanceof Error ? err.message : String(err ?? '');
    const hasPersian = /[آ-ی]/.test(message);
    const looksLikeTransportError = /failed to fetch|network|load failed|connection|timeout/i.test(message);
    return {
      ok: false,
      error: hasPersian && !looksLikeTransportError
        ? message
        : `${AI_ERROR_MESSAGE} اگر تعداد/حجم فایل‌ها زیاد است، تحلیل مرحله‌ای کم‌حجم‌تر به‌صورت خودکار استفاده می‌شود؛ لطفاً دوباره تلاش کنید.`,
    };
  }
}
