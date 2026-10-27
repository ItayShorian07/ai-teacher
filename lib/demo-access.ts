export const DEMO_QUESTION_LIMIT = 3;
export const DEMO_PROGRESS_KEY = 'limud.demo.completed-questions.v1';

export function parseDemoCompletions(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return Math.min(parsed, DEMO_QUESTION_LIMIT);
}
