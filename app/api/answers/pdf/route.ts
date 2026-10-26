import { privateJson, validOrigin } from '@/lib/account-server';
import {
  LearningError,
  learningAccess,
  consumeQuota,
} from '@/lib/learning-access';
import { MAX_PDF_BYTES, validPdf } from '@/lib/tutor-validation';
import { boundedBody } from '@/lib/request-body';
import { readPdf } from '@/lib/gemini';
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!validOrigin(request))
    return privateJson({ error: 'invalid_origin' }, 403);
  try {
    const { account } = await learningAccess();
    const body = await boundedBody(request, MAX_PDF_BYTES + 16384);
    const data = await new Response(body, {
      headers: { 'Content-Type': request.headers.get('content-type') || '' },
    }).formData();
    const file = data.get('file');
    if (
      !(file instanceof File) ||
      file.type !== 'application/pdf' ||
      file.size > MAX_PDF_BYTES
    )
      return privateJson({ error: 'invalid_pdf' }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validPdf(bytes)) return privateJson({ error: 'invalid_pdf' }, 400);
    await consumeQuota(account.user.id);
    const text = await readPdf(
      Buffer.from(bytes).toString('base64'),
      data.get('lang') === 'en' ? 'en' : 'he',
    );
    return privateJson({ text: text.slice(0, 8000) });
  } catch (e) {
    if (e instanceof Error && e.message === 'BODY_TOO_LARGE')
      return privateJson({ error: 'pdf_too_large' }, 413);
    if (e instanceof Error && e.message === 'EMPTY_BODY')
      return privateJson({ error: 'invalid_pdf' }, 400);
    return privateJson(
      { error: e instanceof LearningError ? e.message : 'pdf_unavailable' },
      e instanceof LearningError ? e.status : 503,
    );
  }
}
