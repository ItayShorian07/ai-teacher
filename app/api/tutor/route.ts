import {
  isValidOrigin,
  privateJsonResponse,
  readJsonBody,
} from '@/lib/server/http';
import { LearningError } from '@/lib/server/learning-access';
import { handleTutorRequest } from '@/lib/server/tutor-service';
import { tutorRequestSchema } from '@/lib/tutor-contract';

export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isValidOrigin(request))
    return privateJsonResponse({ error: 'invalid_origin' }, 403);
  try {
    const input = tutorRequestSchema.safeParse(
      await readJsonBody(request, 20000),
    );
    if (!input.success)
      return privateJsonResponse({ error: 'invalid_input' }, 400);
    return privateJsonResponse(await handleTutorRequest(input.data));
  } catch (error) {
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE')
      return privateJsonResponse({ error: 'body_too_large' }, 413);
    if (error instanceof SyntaxError)
      return privateJsonResponse({ error: 'invalid_json' }, 400);
    return privateJsonResponse(
      {
        error:
          error instanceof LearningError
            ? error.message
            : 'learning_unavailable',
      },
      error instanceof LearningError ? error.status : 503,
    );
  }
}
