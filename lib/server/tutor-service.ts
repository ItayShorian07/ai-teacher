import 'server-only';
import { z } from 'zod';
import { checkPracticeAnswer, checkRecoveryAnswer } from '../answer-checker';
import { createDemoQuestion } from '../demo-lessons';
import { createTutorContext, type TutorContext } from '../tutor-context';
import {
  generatedQuestionSchema,
  publicQuestionSchema,
  type TutorInput,
} from '../tutor-contract';
import {
  createEmbedding,
  generateQuestion,
  generateStory,
  getGeminiModel,
  reviewStudentAnswer,
} from './gemini';
import {
  consumeLearningQuota,
  LearningError,
  requireLearningAccess,
} from './learning-access';

type LearningAccess = Awaited<ReturnType<typeof requireLearningAccess>>;
type DatabaseClient = LearningAccess['database'];
const storyCacheSchema = z.object({
  text: z.string().min(1),
  sources: z.array(z.string()),
});
const questionCacheSchema = z.object({
  question: generatedQuestionSchema,
  sources: z.array(z.string()),
  reference: z.array(z.string()),
});
const contentCacheSchema = z.union([storyCacheSchema, questionCacheSchema]);
const materialSchema = z
  .object({
    title: z.string(),
    content: z.string(),
    source_page: z.number().nullish(),
  })
  .passthrough();
const exampleSchema = z.object({ title: z.string() }).passthrough();

export async function handleTutorRequest(input: TutorInput) {
  const access = await requireLearningAccess(input.action === 'coach');
  await consumeLearningQuota(access.account.user.id);
  if (input.action === 'story' || input.action === 'question') {
    return createLearningContent(input, access);
  }
  return reviewAnswer(input, access);
}

async function reviewAnswer(
  input: TutorInput,
  { account, database }: LearningAccess,
) {
  if (!input.studentAnswer?.trim())
    throw new LearningError('answer_required', 400);
  if (!input.questionId) {
    const question = createDemoQuestion(
      input,
      input.level,
      input.variant,
      input.customHobby,
    );
    const feedback =
      input.action === 'recover'
        ? checkRecoveryAnswer(question, input.studentAnswer)
        : checkPracticeAnswer(
            question,
            input.studentAnswer,
            input.action !== 'coach',
          );
    return { status: feedback.status, feedback: feedback.message[input.lang] };
  }

  const { data: storedQuestion, error } = await database
    .from('learning_questions')
    .select('payload,context')
    .eq('id', input.questionId)
    .eq('user_id', account.user.id)
    .maybeSingle();
  if (error) throw new LearningError('storage_unavailable', 503);
  if (!storedQuestion) throw new LearningError('question_not_found', 404);
  const question = generatedQuestionSchema.parse(storedQuestion.payload);
  const isRecovery = input.action === 'recover';
  return reviewStudentAnswer({
    question: isRecovery ? question.recovery : question.prompt,
    expression: isRecovery ? '' : question.expression,
    correctAnswer: isRecovery ? question.recoveryAnswer : question.answer,
    studentAnswer: input.studentAnswer,
    lang: input.lang,
    context: storedQuestion.context,
    mode: input.action,
    final: input.action !== 'coach',
  });
}

async function retrieveReferences(
  database: DatabaseClient,
  context: TutorContext,
  action: TutorInput['action'],
  level: number,
) {
  const embedding = await createEmbedding(
    `${context.subject} ${context.topic} ${context.stage} ${context.lang} ${context.hobbies.join(', ')}`,
  );
  const filters = {
    p_embedding: embedding,
    p_language: context.lang,
    p_subject: context.subject,
    p_grade: context.grade,
    p_topic: context.topic,
  };
  const { data: materialRows, error: materialError } = await database.rpc(
    'retrieve_learning_material',
    filters,
  );
  if (materialError) throw new LearningError('retrieval_unavailable', 503);
  const { data: exampleRows, error: exampleError } =
    action === 'question'
      ? await database.rpc('retrieve_learning_questions', {
          ...filters,
          p_level: level,
        })
      : { data: [], error: null };
  if (exampleError) throw new LearningError('retrieval_unavailable', 503);
  const materials = z.array(materialSchema).parse(materialRows || []);
  const examples = z.array(exampleSchema).parse(exampleRows || []);
  return {
    embedding,
    sources: [
      ...materials.map(
        (material) =>
          `${material.title}${material.source_page ? ` · ${material.source_page}` : ''}`,
      ),
      ...examples.map((example) => example.title),
    ],
    reference: [
      ...materials.map((material) => material.content.slice(0, 8000)),
      ...examples.map((example) => JSON.stringify(example).slice(0, 8000)),
    ],
  };
}

async function createLearningContent(
  input: TutorInput,
  { account, database }: LearningAccess,
) {
  const { context, cacheKey, isPrivate } = createTutorContext(
    input,
    account.user.id,
    getGeminiModel(),
  );
  const { data: cached, error: cacheError } = await database
    .from('learning_cache')
    .select('payload')
    .eq('cache_key', cacheKey)
    .maybeSingle();
  if (cacheError) throw new LearningError('storage_unavailable', 503);
  let payload: z.infer<typeof contentCacheSchema>;
  if (cached?.payload) {
    payload = contentCacheSchema.parse(cached.payload);
  } else {
    const { embedding, sources, reference } = await retrieveReferences(
      database,
      context,
      input.action,
      input.level,
    );
    payload =
      input.action === 'story'
        ? { text: await generateStory({ ...context, reference }), sources }
        : {
            question: await generateQuestion({ ...context, reference }),
            sources,
            reference,
          };
    const { error: saveError } = await database.from('learning_cache').upsert(
      {
        cache_key: cacheKey,
        owner_id: isPrivate ? account.user.id : null,
        kind: input.action,
        payload,
        embedding,
      },
      { onConflict: 'cache_key', ignoreDuplicates: true },
    );
    if (saveError) throw new LearningError('storage_unavailable', 503);
  }
  if (input.action === 'story')
    return { ...storyCacheSchema.parse(payload), cached: Boolean(cached) };

  const { question, sources, reference } = questionCacheSchema.parse(payload);
  const { data: questionSession, error } = await database
    .from('learning_questions')
    .insert({
      user_id: account.user.id,
      payload: question,
      context: { ...context, reference },
    })
    .select('id')
    .single();
  if (error) throw new LearningError('storage_unavailable', 503);
  return {
    questionId: questionSession.id,
    question: publicQuestionSchema.parse(question),
    sources,
    cached: Boolean(cached),
  };
}
