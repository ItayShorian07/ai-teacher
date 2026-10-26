import { cookies } from 'next/headers';
import {
  currentAccount,
  privateJson,
  validOrigin,
  boundedJson,
} from '@/lib/account-server';
import { botConfigured } from '@/lib/learning-access';
import { signBotPass } from '@/lib/bot-token';
export async function POST(request: Request) {
  if (!validOrigin(request))
    return privateJson({ error: 'invalid_origin' }, 403);
  if (!botConfigured()) return privateJson({ error: 'unavailable' }, 503);
  try {
    const account = await currentAccount();
    if (!account) return privateJson({ error: 'unauthorized' }, 401);
    const { token } = await boundedJson(request);
    if (typeof token !== 'string' || !token || token.length > 2048)
      return privateJson({ error: 'captcha' }, 400);
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
      return privateJson({ error: 'captcha' }, 400);
    (await cookies()).set('limud-human', signBotPass(account.user.id, secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1800,
    });
    return privateJson({ verified: true });
  } catch {
    return privateJson({ error: 'captcha' }, 503);
  }
}
