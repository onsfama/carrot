import { Platform } from 'react-native';

/**
 * Converts a Korean phone number (any format) to E.164.
 * 010-1234-5678  →  +821012345678
 */
export function toE164(phone: string): string {
  const stripped = phone.replace(/[^\d+]/g, '');
  if (stripped.startsWith('+')) return stripped;
  if (stripped.startsWith('0')) return '+82' + stripped.slice(1);
  return '+82' + stripped;
}

// EXPO_PUBLIC_ prefix makes these available in the RN bundle via process.env
const ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID ?? '';
const AUTH_TOKEN  = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN  ?? '';
const VERIFY_SID  = process.env.EXPO_PUBLIC_TWILIO_VERIFY_SID  ?? '';

const BASE = `https://verify.twilio.com/v2/Services/${VERIFY_SID}`;

// btoa and URLSearchParams are available globally in React Native 0.73+
function basicAuthHeader() {
  return 'Basic ' + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);
}

/** Sends a 6-digit SMS code to the phone number via Twilio Verify. */
export async function sendVerificationCode(phone: string): Promise<void> {
  // 웹 브라우저: CORS 문제로 직접 호출 불가 → API Route를 통해 서버에서 호출
  if (Platform.OS === 'web') {
    const res = await fetch('/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as any)?.error ?? `인증번호 발송 실패 (${res.status})`);
    }
    return;
  }

  // 네이티브(Android/iOS): Twilio 직접 호출
  if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SID) {
    throw new Error('[설정 오류] .env 파일의 Twilio 값이 비어 있습니다. npx expo start --clear 로 재시작하세요.');
  }
  console.log('[Twilio] Sending to:', toE164(phone));
  const res = await fetch(`${BASE}/Verifications`, {
    method: 'POST',
    headers: {
      Authorization:  basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toE164(phone), Channel: 'sms' }).toString(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    console.error('[Twilio] Send FAILED:', json);
    throw new Error((json as any)?.message ?? `인증번호 발송 실패 (${res.status})`);
  }
  console.log('[Twilio] Send OK');
}

/**
 * Verifies the code the user typed.
 * Returns true if approved, false if wrong code.
 * Throws on network/server errors.
 */
export async function checkVerificationCode(
  phone: string,
  code: string,
): Promise<boolean> {
  // 웹 브라우저: API Route를 통해 서버에서 호출
  if (Platform.OS === 'web') {
    const res = await fetch('/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((json as any)?.error ?? `인증 확인 실패 (${res.status})`);
    }
    return (json as any)?.ok === true;
  }

  // 네이티브: Twilio 직접 호출
  if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SID) {
    throw new Error('[설정 오류] .env 파일의 Twilio 값이 비어 있습니다. npx expo start --clear 로 재시작하세요.');
  }
  console.log('[Twilio] Checking code for:', toE164(phone));
  const res = await fetch(`${BASE}/VerificationChecks`, {
    method: 'POST',
    headers: {
      Authorization:  basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toE164(phone), Code: code }).toString(),
  });
  // Twilio returns 404 when the verification was cancelled (5 failed attempts)
  if (res.status === 404) return false;
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    console.error('[Twilio] Check FAILED:', json);
    throw new Error((json as any)?.message ?? `인증 확인 실패 (${res.status})`);
  }
  const json = await res.json();
  console.log('[Twilio] Check result status:', (json as any)?.status);
  return (json as any)?.status === 'approved';
}
