function toE164(phone: string): string {
  const s = phone.replace(/[^\d+]/g, '');
  if (s.startsWith('+')) return s;
  if (s.startsWith('0')) return '+82' + s.slice(1);
  return '+82' + s;
}

export async function POST(request: Request): Promise<Response> {
  const { phone } = await request.json();

  const ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID ?? '';
  const AUTH_TOKEN  = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN  ?? '';
  const VERIFY_SID  = process.env.EXPO_PUBLIC_TWILIO_VERIFY_SID  ?? '';

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: toE164(phone), Channel: 'sms' }).toString(),
    }
  );

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return Response.json(
      { ok: false, error: (json as any)?.message ?? '인증번호 발송 실패' },
      { status: res.status }
    );
  }
  return Response.json({ ok: true });
}
