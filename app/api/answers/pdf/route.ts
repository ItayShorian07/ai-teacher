import { readRequestBody } from '@/lib/request-body';
import { transcribePdf } from '@/lib/server/gemini';
import { isValidOrigin, privateJsonResponse } from '@/lib/server/http';
import {
  LearningError,
  consumeLearningQuota,
  requireLearningAccess,
} from '@/lib/server/learning-access';
import { MAX_PDF_BYTES, isValidPdf } from '@/lib/tutor-contract';
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!isValidOrigin(request))
    return privateJsonResponse({ error: 'invalid_origin' }, 403);
  try {
    const { account } = await requireLearningAccess();
    const body = await readRequestBody(request, MAX_PDF_BYTES + 16384);
    const data = await new Response(body, {
      headers: { 'Content-Type': request.headers.get('content-type') || '' },
    }).formData();
    const file = data.get('file');
    if (
      !(file instanceof File) ||
      file.type !== 'application/pdf' ||
      file.size > MAX_PDF_BYTES
    )
      return privateJsonResponse({ error: 'invalid_pdf' }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isValidPdf(bytes))
      return privateJsonResponse({ error: 'invalid_pdf' }, 400);
    await consumeLearningQuota(account.user.id);
    const text = await transcribePdf(
      Buffer.from(bytes).toString('base64'),
      data.get('lang') === 'en' ? 'en' : 'he',
    );
    return privateJsonResponse({ text: text.slice(0, 8000) });
  } catch (error) {
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE')
      return privateJsonResponse({ error: 'pdf_too_large' }, 413);
    if (error instanceof Error && error.message === 'EMPTY_BODY')
      return privateJsonResponse({ error: 'invalid_pdf' }, 400);
    return privateJsonResponse(
      {
        error:
          error instanceof LearningError ? error.message : 'pdf_unavailable',
      },
      error instanceof LearningError ? error.status : 503,
    );
  }
}
