// RID-12: SMS OTP infrastructure stub
// TODO [RID-12]: Integrate with SMS provider (e.g. KaveNegar, Faraz SMS)
//               when OTP login is activated.

export async function sendOTP(phoneNumber: string): Promise<boolean> {
  // Stub: logs only. Replace with real API call when SMS provider is configured.
  console.log(`[OTP STUB] Code would be sent to: ${phoneNumber}`);
  return true;
}

export function generateOTP(length = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

export const IRAN_PHONE_REGEX = /^(09)[0-9]{9}$/;

export function validatePhone(value: string): string | null {
  const cleaned = value.replace(/\s|-/g, '');
  if (!cleaned) return 'شماره تماس الزامی است';
  if (!IRAN_PHONE_REGEX.test(cleaned)) {
    return 'شماره تماس باید با ۰۹ شروع شده و دقیقاً ۱۱ رقم باشد (مثال: ۰۹۱۲۱۲۳۴۵۶۷)';
  }
  return null;
}
