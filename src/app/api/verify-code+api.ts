function toE164(phone: string): string {
  const s = phone.replace(/[^\d+]/g, '');
  if (s.startsWith('+')) return s;
  if (s.startsWith('0')) return '+82' + s.slice(1);
  return '+82' + s;
}

export async function POST(request: Request): Promise<Response> {
  const { phone, code } = await request.json();

  const ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID ?? '';
  const AUTH_TOKEN  = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN  ?? '';
  const VERIFY_SID  = process.env.EXPO_PUBLIC_TWILIO_VERIFY_SID  ?? '';

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationChecks`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: toE164(phone), Code: code }).toString(),
    }
  );

  if (res.status === 404) return Response.json({ ok: false, error: '인증 시도 횟수 초과 또는 만료됨' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[verify-code API] Twilio error:', res.status, json);
    return Response.json(
      { ok: false, error: (json as any)?.message ?? `인증 확인 실패 (${res.status})` },
      { status: res.status }
    );
  }
  console.log('[verify-code API] Twilio status:', (json as any)?.status);
  return Response.json({ ok: (json as any)?.status === 'approved' });
}
