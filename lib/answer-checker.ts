import { parsePolynomial } from './polynomial';
import { LocalizedText, bilingualText } from '@/lib/i18n';
import { PracticeQuestion } from './demo-lessons';
export function evaluateArithmetic(input: string): number | null {
  const polynomial = parsePolynomial(input);
  return polynomial && polynomial[1] === 0 && polynomial[2] === 0 ? polynomial[0] : null;
}
export type AnswerFeedback = {
  status: 'correct' | 'continue' | 'mistake' | 'clarify';
  message: LocalizedText;
};
const response = (
  status: AnswerFeedback['status'],
  en: string,
  he: string,
): AnswerFeedback => ({
  status,
  message: bilingualText(en, he),
});
const clarify = () =>
  response(
    'clarify',
    'I couldn’t verify that notation. Try a number, fraction, or a complete equation. Written explanations need the live tutor.',
    'לא הצלחתי לבדוק את הכתיבה הזו. נסו מספר, שבר או משוואה מלאה. הסברים במילים דורשים חיבור למורה חי.',
  );
const mistake = () =>
  response(
    'mistake',
    'Let’s pause and check this step together.',
    'נעצור רגע ונבדוק את השלב הזה יחד.',
  );
const correct = () =>
  response(
    'correct',
    'That’s it! Your answer is correct.',
    'זהו זה! התשובה שלכם נכונה.',
  );
const continuing = () =>
  response(
    'continue',
    'This step checks out. Keep going to the final answer.',
    'השלב הזה נכון. המשיכו עד לתשובה הסופית.',
  );
export function checkPracticeAnswer(
  question: PracticeQuestion,
  studentAnswer: string,
  final = false,
): AnswerFeedback {
  const lines = studentAnswer
    .trim()
    .split(/\n|→/)
    .map((normalizedLine) => normalizedLine.trim())
    .filter(Boolean);
  if (!lines.length) return clarify();
  let feedback: AnswerFeedback = clarify();
  for (const line of lines) {
    const s = line.replace(/\s/g, '');
    const parts = s.split('=');
    if (parts.length > 2) return clarify();
    if (parts.length === 1) {
      const value = evaluateArithmetic(s);
      feedback =
        value === null
          ? clarify()
          : Math.abs(value - question.answer) < 1e-8
            ? correct()
            : mistake();
    } else if (
      question.variable &&
      parts[0] === question.variable &&
      !/[a-z]/.test(parts[1])
    ) {
      const value = evaluateArithmetic(parts[1]);
      feedback =
        value === null
          ? clarify()
          : Math.abs(value - question.answer) < 1e-8
            ? correct()
            : mistake();
    } else if (/[a-z]/.test(s)) {
      if (!question.variable) return clarify();
      const left = parsePolynomial(parts[0], question.variable),
        right = parsePolynomial(parts[1], question.variable);
      if (!left || !right) return clarify();
      const [constant, linear, quadratic] = left.map((n, i) => n - right[i]);
      if (Math.abs(quadratic) < 1e-10 && Math.abs(linear) < 1e-10)
        return Math.abs(constant) < 1e-10
          ? response(
              'clarify',
              'This identity doesn’t help find the unknown. Try a step that isolates it.',
              'השוויון הזה אינו עוזר למצוא את הנעלם. נסו שלב שמבודד אותו.',
            )
          : mistake();
      if (question.kind === 'linear' && Math.abs(quadratic) > 1e-10) return clarify();
      let roots: number[] = [];
      if (Math.abs(quadratic) < 1e-10) roots = [-constant / linear];
      else {
        const discriminant = linear * linear - 4 * quadratic * constant;
        if (discriminant >= 0)
          roots = [
            (-linear + Math.sqrt(discriminant)) / (2 * quadratic),
            (-linear - Math.sqrt(discriminant)) / (2 * quadratic),
          ];
      }
      if (question.kind === 'quadratic') roots = roots.filter((n) => n > 0);
      feedback =
        roots.length > 0 && roots.every((n) => Math.abs(n - question.answer) < 1e-8)
          ? continuing()
          : mistake();
    } else {
      const left = evaluateArithmetic(parts[0]),
        right = evaluateArithmetic(parts[1]);
      feedback =
        left === null || right === null
          ? clarify()
          : Math.abs(left - right) > 1e-8
            ? mistake()
            : Math.abs(right - question.answer) < 1e-8
              ? correct()
              : continuing();
    }
    if (feedback.status === 'mistake' || feedback.status === 'clarify')
      return feedback;
  }
  return final && feedback.status === 'continue'
    ? response(
        'clarify',
        'Your working is on track. Add the final value to finish.',
        'הדרך שלכם נכונה. הוסיפו את הערך הסופי כדי לסיים.',
      )
    : feedback;
}
export function checkRecoveryAnswer(
  question: PracticeQuestion,
  studentAnswer: string,
): AnswerFeedback {
  const variable = /\by\b/.test(question.recovery) ? 'y' : undefined;
  return checkPracticeAnswer(
    { ...question, kind: 'numeric', answer: question.recoveryAnswer, variable },
    studentAnswer.trim(),
    true,
  );
}
