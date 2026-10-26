import { humanVerificationSchema } from '@/lib/auth-validation';
import { createHumanVerificationToken } from '@/lib/human-verification-token';
import { getCurrentAccount } from '@/lib/server/account';
import {
  isValidOrigin,
  privateJsonResponse,
  readJsonBody,
} from '@/lib/server/http';
import { isCaptchaConfigured } from '@/lib/server/learning-access';
import { cookies } from 'next/headers';
export async function POST(request: Request) {
  if (!isValidOrigin(request))
    return privateJsonResponse({ error: 'invalid_origin' }, 403);
  if (!isCaptchaConfigured())
    return privateJsonResponse({ error: 'unavailable' }, 503);
  try {
    const account = await getCurrentAccount();
    if (!account) return privateJsonResponse({ error: 'unauthorized' }, 401);
    const input = humanVerificationSchema.safeParse(
      await readJsonBody(request),
    );
    if (!input.success) return privateJsonResponse({ error: 'captcha' }, 400);
    const { token } = input.data;
    const secret = process.env.TURNSTILE_SECRET_KEY!;
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token }),
        signal: AbortSignal.timeout(8000),
      },
    );
    const result = await response.json();
    if (
      !response.ok ||
      !result.success ||
      result.action !== 'learning' ||
      result.hostname !== new URL(request.headers.get('origin')!).hostname
    )
      return privateJsonResponse({ error: 'captcha' }, 400);
    (await cookies()).set(
      'limud-human',
      createHumanVerificationToken(account.user.id, secret),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 1800,
      },
    );
    return privateJsonResponse({ verified: true });
  } catch {
    return privateJsonResponse({ error: 'captcha' }, 503);
  }
}
