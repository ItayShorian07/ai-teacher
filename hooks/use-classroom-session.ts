'use client';

import {
  checkPracticeAnswer,
  checkRecoveryAnswer,
  type AnswerFeedback,
} from '@/lib/answer-checker';
import { parseResponse, postJson } from '@/lib/api-client';
import type { AccountProfile } from '@/lib/auth-validation';
import {
  getDefaultHobby,
  getNextPracticeLevel,
  toAnswerFeedback,
  type ClassroomView,
  type PracticeRecord,
} from '@/lib/classroom-session';
import {
  createDemoQuestion,
  getDemoLesson,
  getLessonTopic,
  type Hobby,
  type LearningPreferences,
  type PracticeQuestion,
} from '@/lib/demo-lessons';
import {
  bilingualText,
  createTranslator,
  type LocalizedText,
} from '@/lib/i18n';
import {
  MAX_PDF_BYTES,
  questionResponseSchema,
  storyResponseSchema,
  transcriptionResponseSchema,
  tutorFeedbackSchema,
  type StoryResponse,
  type TutorInput,
} from '@/lib/tutor-contract';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { z } from 'zod';
import { useDocumentLanguage } from './use-language';
import { useLearningTools } from './use-learning-tools';

type DisplayQuestion = Pick<
  PracticeQuestion,
  'prompt' | 'expression' | 'hint' | 'explanation' | 'recovery' | 'source'
>;
interface SessionOptions {
  isDemo: boolean;
  hasProAccess: boolean;
}

export function useClassroomSession(
  profile: AccountProfile,
  { isDemo, hasProAccess }: SessionOptions,
) {
  const [preferences, setPreferences] = useState<LearningPreferences>({
    lang: profile.locale,
    subject: 'math',
    stage: 'middle',
    hobby: getDefaultHobby(profile),
  });
  const [view, setView] = useState<ClassroomView>('story');
  const [level, setLevel] = useState(1);
  const [variant, setVariant] = useState(0);
  const [answerDraft, setAnswerDraft] = useState('');
  const [isCoachingEnabled, setIsCoachingEnabled] = useState(
    isDemo || hasProAccess,
  );
  const [answerFeedback, setAnswerFeedback] = useState<AnswerFeedback | null>(
    null,
  );
  const [isPaused, setIsPaused] = useState(false);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [hasRecoveryError, setHasRecoveryError] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<LocalizedText>(
    bilingualText('', ''),
  );
  const [neededHelp, setNeededHelp] = useState(false);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState<PracticeRecord[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [generatedLesson, setGeneratedLesson] = useState<StoryResponse | null>(
    null,
  );
  const [generatedQuestion, setGeneratedQuestion] =
    useState<DisplayQuestion | null>(null);
  const [interests, setInterests] = useState(profile.hobbies || []);
  const [customHobby, setCustomHobby] = useState(profile.custom_hobby || '');
  const [questionId, setQuestionId] = useState<string>();
  const requestVersion = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastCoachedAnswer = useRef('');
  const language = preferences.lang;
  const translate = createTranslator(language);
  const localize = (text: LocalizedText) => text[language];
  const demoQuestion = createDemoQuestion(preferences, level, variant);
  const question = generatedQuestion || demoQuestion;
  const lesson = getDemoLesson(preferences);
  const isSolved = answerFeedback?.status === 'correct';
  const currentStep = view === 'story' ? 0 : view === 'practice' ? 1 : 2;
  useDocumentLanguage(language);
  useLearningTools({
    language,
    subject: preferences.subject,
    stage: preferences.stage,
    view,
    level,
    question: question.expression,
    paused: isPaused,
    solved: practiceHistory.length,
  });
  useEffect(
    () => () => {
      requestVersion.current++;
    },
    [],
  );

  function resetQuestion() {
    requestVersion.current++;
    setAnswerDraft('');
    setAnswerFeedback(null);
    setIsPaused(false);
    setRecoveryAnswer('');
    setHasRecoveryError(false);
    setNeededHelp(false);
    setIsHintVisible(false);
    setGeneratedQuestion(null);
    setQuestionId(undefined);
    setIsBusy(false);
    setNotice('');
  }

  function updatePreferences(update: Partial<LearningPreferences>) {
    setPreferences((current) => ({ ...current, ...update }));
    resetQuestion();
    setLevel(1);
    setVariant(0);
    setPracticeHistory([]);
    setIsCoachingEnabled(isDemo || hasProAccess);
    setGeneratedLesson(null);
    setView('story');
  }

  function requestTutor<ResponseBody>(
    action: TutorInput['action'],
    schema: z.ZodType<ResponseBody>,
    extra: Partial<TutorInput> = {},
  ) {
    return postJson(
      '/api/tutor',
      {
        ...preferences,
        action,
        topic: localize(getLessonTopic(preferences)),
        level,
        variant,
        interests,
        customHobby,
        ...extra,
      },
      schema,
    );
  }

  function showFeedback(feedback: AnswerFeedback) {
    setAnswerFeedback(feedback);
    if (feedback.status === 'mistake') {
      setNeededHelp(true);
      if (isCoachingEnabled) {
        setIsPaused(true);
        setRecoveryAnswer('');
        setHasRecoveryError(false);
      }
    }
    if (feedback.status === 'correct') {
      setPracticeHistory((history) => [
        ...history,
        {
          question: question.expression,
          neededHelp,
          topic: localize(getLessonTopic(preferences)),
        },
      ]);
    }
  }

  async function submitAnswer(final = false) {
    if (isBusy || isPaused || isSolved || !answerDraft.trim()) return;
    if (!generatedQuestion) {
      showFeedback(checkPracticeAnswer(demoQuestion, answerDraft, final));
      return;
    }
    const version = ++requestVersion.current;
    setIsBusy(true);
    setNotice('');
    try {
      const feedback = await requestTutor(
        final ? 'check' : 'coach',
        tutorFeedbackSchema,
        { questionId, studentAnswer: answerDraft, final },
      );
      if (version !== requestVersion.current) return;
      if (feedback.prerequisite) {
        const explanation = bilingualText(
          feedback.prerequisite,
          feedback.prerequisite,
        );
        setGeneratedQuestion((current) =>
          current ? { ...current, explanation } : current,
        );
      }
      showFeedback(toAnswerFeedback(feedback));
    } catch {
      if (version === requestVersion.current)
        setNotice(
          translate(
            'Checking is temporarily unavailable. Your answer is saved here.',
            'הבדיקה אינה זמינה כרגע. התשובה נשארה כאן.',
          ),
        );
    } finally {
      if (version === requestVersion.current) setIsBusy(false);
    }
  }

  async function generateLesson() {
    if (isDemo || isBusy) return;
    const version = ++requestVersion.current;
    setIsBusy(true);
    setNotice('');
    try {
      const response = await requestTutor('story', storyResponseSchema);
      if (version === requestVersion.current) setGeneratedLesson(response);
    } catch {
      if (version === requestVersion.current)
        setNotice(
          translate(
            'AI learning is temporarily unavailable. You can keep practicing with the sample lessons.',
            'למידה עם AI אינה זמינה כרגע. אפשר להמשיך לתרגל בשיעורי הדוגמה.',
          ),
        );
    } finally {
      if (version === requestVersion.current) setIsBusy(false);
    }
  }

  async function nextQuestion() {
    if (isBusy) return;
    const nextLevel = getNextPracticeLevel(practiceHistory, level);
    const nextVariant = variant + 1;
    resetQuestion();
    setLevel(nextLevel);
    setVariant(nextVariant);
    if (isDemo) return;
    const version = ++requestVersion.current;
    setIsBusy(true);
    try {
      const response = await requestTutor('question', questionResponseSchema, {
        level: nextLevel,
        variant: nextVariant,
      });
      if (version !== requestVersion.current) return;
      setQuestionId(response.questionId);
      const { prompt, expression, hint, recovery } = response.question;
      setGeneratedQuestion({
        prompt: bilingualText(prompt, prompt),
        expression,
        hint: bilingualText(hint, hint),
        recovery,
        explanation: bilingualText(
          'Let’s review the prerequisite.',
          'בואו נבדוק את נושא הבסיס.',
        ),
        source: bilingualText('Original AI question', 'שאלה מקורית של AI'),
      });
    } catch {
      if (version === requestVersion.current)
        setNotice(
          translate(
            'AI question unavailable. Showing a sample question.',
            'שאלת AI אינה זמינה. מוצגת שאלת דוגמה.',
          ),
        );
    } finally {
      if (version === requestVersion.current) setIsBusy(false);
    }
  }

  async function submitRecoveryAnswer() {
    if (isBusy) return;
    const version = ++requestVersion.current;
    let feedback: AnswerFeedback;
    if (generatedQuestion) {
      setIsBusy(true);
      try {
        const response = await requestTutor('recover', tutorFeedbackSchema, {
          questionId,
          studentAnswer: recoveryAnswer,
        });
        feedback = {
          ...toAnswerFeedback(response),
          status: response.status === 'correct' ? 'correct' : 'mistake',
        };
      } catch {
        if (version === requestVersion.current)
          setNotice(
            translate('Please try again shortly.', 'נסו שוב בעוד רגע.'),
          );
        return;
      } finally {
        if (version === requestVersion.current) setIsBusy(false);
      }
    } else {
      feedback = checkRecoveryAnswer(demoQuestion, recoveryAnswer);
    }
    if (version !== requestVersion.current) return;
    if (feedback.status === 'correct') {
      setIsPaused(false);
      setHasRecoveryError(false);
      setAnswerFeedback({
        status: 'continue',
        message: bilingualText(
          'You’ve got the idea. Edit your answer and continue.',
          'הבנתם את הרעיון. תקנו את התשובה והמשיכו.',
        ),
      });
      inputRef.current?.focus();
    } else {
      setHasRecoveryError(true);
      setRecoveryFeedback(feedback.message);
    }
  }

  async function uploadAnswerPdf(file: File) {
    if (isBusy || isPaused || isSolved || isDemo) return;
    if (file.size > MAX_PDF_BYTES) {
      setNotice(translate('Maximum PDF size: 3 MB.', 'גודל PDF מרבי: 3MB.'));
      return;
    }
    const version = ++requestVersion.current;
    setIsBusy(true);
    setNotice('');
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('lang', language);
      const response = await parseResponse(
        await fetch('/api/answers/pdf', { method: 'POST', body }),
        transcriptionResponseSchema,
      );
      if (version !== requestVersion.current) return;
      setIsCoachingEnabled(false);
      setAnswerDraft(response.text);
      setAnswerFeedback(null);
      setNotice(
        translate(
          'Review and correct the transcription, then submit.',
          'בדקו ותקנו את הטקסט שזוהה לפני שליחתו לבדיקה.',
        ),
      );
    } catch {
      if (version === requestVersion.current)
        setNotice(
          translate(
            'Could not read the PDF. Please try typing your answer.',
            'לא ניתן לקרוא את ה־PDF כרגע. אפשר להקליד את התשובה.',
          ),
        );
    } finally {
      if (version === requestVersion.current) setIsBusy(false);
    }
  }

  function updateAnswerDraft(value: string) {
    requestVersion.current++;
    setAnswerDraft(value);
    setAnswerFeedback(null);
  }

  function updateInterests(value: string[]) {
    requestVersion.current++;
    setIsBusy(false);
    setInterests(value);
    setGeneratedLesson(null);
  }

  function updateCustomHobby(value: string) {
    requestVersion.current++;
    setIsBusy(false);
    setCustomHobby(value);
    setGeneratedLesson(null);
  }

  function selectHobby(hobby: Hobby) {
    setInterests([hobby]);
    setCustomHobby('');
    updatePreferences({ hobby });
  }

  function toggleHint() {
    setIsHintVisible((visible) => !visible);
    setNeededHelp(true);
  }

  function showFirstHint() {
    setView('practice');
    setIsHintVisible(true);
    setNeededHelp(true);
  }

  const coachAfterPause = useEffectEvent(() => {
    void submitAnswer(false);
  });
  useEffect(() => {
    if (
      !hasProAccess ||
      !isCoachingEnabled ||
      !questionId ||
      isPaused ||
      isSolved ||
      isBusy ||
      !answerDraft.trim()
    )
      return;
    const answerKey = `${questionId}|${answerDraft}`;
    if (lastCoachedAnswer.current === answerKey) return;
    const timer = setTimeout(() => {
      lastCoachedAnswer.current = answerKey;
      coachAfterPause();
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    answerDraft,
    isCoachingEnabled,
    questionId,
    isPaused,
    isSolved,
    isBusy,
    hasProAccess,
  ]);

  return {
    preferences,
    view,
    setView,
    level,
    variant,
    answerDraft,
    updateAnswerDraft,
    isCoachingEnabled,
    setIsCoachingEnabled,
    answerFeedback,
    isPaused,
    recoveryAnswer,
    setRecoveryAnswer,
    hasRecoveryError,
    setHasRecoveryError,
    recoveryFeedback,
    isHintVisible,
    toggleHint,
    showFirstHint,
    practiceHistory,
    isBusy,
    notice,
    generatedLesson,
    generatedQuestion,
    interests,
    customHobby,
    updateInterests,
    updateCustomHobby,
    inputRef,
    language,
    translate,
    localize,
    question,
    lesson,
    isSolved,
    updatePreferences,
    submitAnswer,
    generateLesson,
    nextQuestion,
    submitRecoveryAnswer,
    currentStep,
    isDemo,
    hasProAccess,
    selectHobby,
    uploadAnswerPdf,
  };
}

export type ClassroomSession = ReturnType<typeof useClassroomSession>;
