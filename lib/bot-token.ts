import { createHmac, timingSafeEqual } from 'node:crypto';
export function signBotPass(userId: string, secret: string, now = Date.now()) {
  const value = Buffer.from(
    JSON.stringify({ sub: userId, exp: now + 30 * 60 * 1000 }),
  ).toString('base64url');
  return `${value}.${createHmac('sha256', secret).update(value).digest('base64url')}`;
}
export function verifyBotPass(
  token: string | undefined,
  userId: string,
  secret: string,
  now = Date.now(),
) {
  if (!token || !secret) return false;
  try {
    const [value, signature, ...extra] = token.split('.');
    if (extra.length || !signature) return false;
    const expected = createHmac('sha256', secret).update(value).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return false;
    const data = JSON.parse(Buffer.from(value, 'base64url').toString());
    return (
      data.sub === userId &&
      Number.isFinite(data.exp) &&
      data.exp > now &&
      data.exp <= now + 30 * 60 * 1000
    );
  } catch {
    return false;
  }
}
