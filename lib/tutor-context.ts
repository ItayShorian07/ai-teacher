import { createHash } from 'node:crypto';
import { getLessonTopic } from './demo-lessons';
import { interests } from './profile-interests';
import type { TutorInput } from './tutor-contract';

const sharedInterests = new Set(interests.map(([id]) => id));

export function createTutorContext(
  input: TutorInput,
  userId: string,
  model: string,
) {
  const selectedInterests = [
    ...new Set(input.interests.length ? input.interests : [input.hobby]),
  ].sort();
  const isPrivate =
    Boolean(input.customHobby) ||
    selectedInterests.some((interest) => !sharedInterests.has(interest));
  const context = {
    subject: input.subject,
    // Use the curriculum topic rather than the client's free-form topic.
    topic: getLessonTopic(input)[input.lang],
    stage: input.stage,
    lang: input.lang,
    level: input.action === 'question' ? input.level : 0,
    variant: input.action === 'question' ? input.variant : 0,
    hobbies: [
      ...selectedInterests,
      ...(input.customHobby ? [input.customHobby] : []),
    ],
  };
  const cacheKey = createHash('sha256')
    .update(
      JSON.stringify({
        v: 2,
        model,
        action: input.action,
        context,
        owner: isPrivate ? userId : 'shared',
      }),
    )
    .digest('hex');
  return { context, cacheKey, isPrivate };
}

export type TutorContext = ReturnType<typeof createTutorContext>['context'];
