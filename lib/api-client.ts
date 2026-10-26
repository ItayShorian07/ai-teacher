import type { z } from 'zod';

export async function postJson<ResponseBody>(
  url: string,
  body: unknown,
  schema: z.ZodType<ResponseBody>,
): Promise<ResponseBody> {
  return parseResponse(
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    schema,
  );
}

export async function parseResponse<ResponseBody>(
  response: Response,
  schema: z.ZodType<ResponseBody>,
): Promise<ResponseBody> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const errorCode =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : 'unavailable';
    throw new Error(errorCode);
  }
  return schema.parse(body);
}
