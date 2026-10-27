import { z } from 'zod';
export const generatedQuestionSchema = z.object({
  prompt: z.string().min(1).max(3000),
  expression: z.string().min(1).max(4000),
  answer: z.string().min(1).max(4000),
  hint: z.string().min(1).max(2000),
  explanation: z.string().min(1).max(4000),
  recovery: z.string().min(1).max(2000),
  recoveryAnswer: z.string().min(1).max(2000),
});
export const tutorFeedbackSchema = z.object({
  status: z.enum(['correct', 'mistake', 'partial', 'continue']),
  feedback: z.string().min(1).max(3000),
  prerequisite: z.string().max(2000).optional(),
});
export const tutorRequestSchema = z
  .object({
    action: z.enum(['story', 'question', 'check', 'coach', 'recover']),
    lang: z.enum(['he', 'en']),
    subject: z.enum(['math', 'cs', 'ai']),
    grade: z.number().int().min(1).max(12),
    hobby: z.enum([
      'football',
      'basketball',
      'fortnite',
      'gaming',
      'music',
      'space',
    ]),
    topic: z.string().trim().min(1).max(160),
    level: z.number().int().min(1).max(3),
    variant: z.number().int().min(0).max(1000),
    interests: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    customHobby: z.string().trim().max(60).default(''),
    questionId: z.string().uuid().optional(),
    studentAnswer: z.string().max(8000).optional(),
    final: z.boolean().optional(),
  })
  .strict();
export type TutorInput = z.infer<typeof tutorRequestSchema>;

export const publicQuestionSchema = generatedQuestionSchema.pick({
  prompt: true,
  expression: true,
  hint: true,
  recovery: true,
});
export const storyResponseSchema = z.object({
  text: z.string().min(1),
  sources: z.array(z.string()),
  cached: z.boolean(),
});
export const questionResponseSchema = z.object({
  questionId: z.string().uuid(),
  question: publicQuestionSchema,
  sources: z.array(z.string()),
  cached: z.boolean(),
});
export const transcriptionResponseSchema = z.object({
  text: z.string().max(8000),
});
export type TutorFeedback = z.infer<typeof tutorFeedbackSchema>;
export type StoryResponse = z.infer<typeof storyResponseSchema>;
export type QuestionResponse = z.infer<typeof questionResponseSchema>;
export const MAX_PDF_BYTES = 3 * 1024 * 1024;
export function isValidPdf(bytes: Uint8Array) {
  return (
    bytes.length > 5 &&
    bytes.length <= MAX_PDF_BYTES &&
    new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-'
  );
}
