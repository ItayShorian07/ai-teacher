import 'server-only';
import { readRequestBody } from '../request-body';
import { validRequestOrigin } from '../request-origin';

export function privateJsonResponse(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export function isValidOrigin(request: Request) {
  return validRequestOrigin(request, process.env);
}

export async function readJsonBody(
  request: Request,
  limit = 8192,
): Promise<unknown> {
  return JSON.parse((await readRequestBody(request, limit)).toString('utf8'));
}
