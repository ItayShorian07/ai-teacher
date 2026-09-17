'use client';
import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowRight, Check, ChevronRight, BookOpen, Sparkles, Code2, Calculator, GraduationCap, Settings2, Globe2, X, Lightbulb, Target, CircleHelp, Send, LockKeyhole, CheckCircle2, Trophy, Brain, Volleyball, Gamepad2, Music2, Rocket, PanelLeftClose } from 'lucide-react';
import { Lang, Subject, Stage, Hobby, Bi, bi, subjects, stages, hobbies, makeQuestion, story, topic, Question } from '@/lib/learning';
import Link from 'next/link';
import ThemeToggle from '@/components/theme-toggle';
import { InterestPicker } from '@/components/auth/interests';
import AccountLink from '@/components/auth/account-link';
import { registerLearningState } from '@/lib/webmcp';
import { checkRecovery, checkAnswer, Check as AnswerCheck } from '@/lib/checker';
import type { AccountProfile } from '@/lib/auth-validation';

const hobbyIcons = { football: Volleyball, gaming: Gamepad2, music: Music2, space: Rocket };
type View = 'story' | 'practice' | 'summary';
type Entry = { question: string; correct: boolean; helped: boolean; topic: string };

// Map profile hobbies to the closest built-in Hobby key for story generation
function resolveHobby(profile: AccountProfile): Hobby {
  const all = [...(profile.hobbies || []), profile.custom_hobby || ''];
  for (const h of all) {
    const lower = h.toLowerCase();
    if (lower.includes('foot') || lower.includes('כדורגל')) return 'football';
    if (lower.includes('gam') || lower.includes('גיי') || lower.includes('משח')) return 'gaming';
    if (lower.includes('music') || lower.includes('מוז')) return 'music';
    if (lower.includes('space') || lower.includes('חלל')) return 'space';
  }
  return 'football';
}

export default function Classroom({ profile, demo=false, pro=false }: { profile: AccountProfile; demo?:boolean; pro?:boolean }) {
  const defaultHobby = resolveHobby(profile);
  const [p, setP] = useState<{ lang: Lang; subject: Subject; stage: Stage; hobby: Hobby }>({
    lang: (profile.locale as Lang) || 'he',
    subject: 'math',
    stage: 'middle',
    hobby: defaultHobby,
  });
  const [view, setView] = useState<View>('story'); const [settings, setSettings] = useState(false); const [mobileMenu, setMobileMenu] = useState(false);
  const [level, setLevel] = useState(1); const [variant, setVariant] = useState(0); const [draft, setDraft] = useState(''); const [coachMode, setCoachMode] = useState(demo||pro);
  const [result, setResult] = useState<AnswerCheck | null>(null); const [paused, setPaused] = useState(false); const [recovery, setRecovery] = useState(''); const [recoveryError, setRecoveryError] = useState(false); const [recoveryFeedback, setRecoveryFeedback] = useState<Bi>(bi('', '')); const [helped, setHelped] = useState(false); const [showHint, setShowHint] = useState(false); const [records, setRecords] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [liveStory, setLiveStory] = useState<{ text: string; sources: string[] } | null>(null); const [liveQ, setLiveQ] = useState<Question | null>(null); const [showSource, setShowSource] = useState(false);
  const [interests,setInterests]=useState<string[]>(profile.hobbies||[]);const [customHobby,setCustomHobby]=useState(profile.custom_hobby||'');const [questionId,setQuestionId]=useState<string>();
  const epoch = useRef(0); const inputRef = useRef<HTMLTextAreaElement>(null); const closeRef = useRef<HTMLButtonElement>(null);
  const l = p.lang; const t = (en: string, he: string) => l === 'he' ? he : en; const b = (value: Bi) => value[l];
  const q = liveQ || makeQuestion(p, level, variant); const lesson = story(p); const solved = result?.status === 'correct';
  useEffect(()=>{document.documentElement.lang=l;document.documentElement.dir=l==='he'?'rtl':'ltr';},[l]);
  useEffect(() => { if (settings) closeRef.current?.focus(); }, [settings]);
  function resetQuestion() { epoch.current++; setDraft(''); setResult(null); setPaused(false); setRecovery(''); setRecoveryError(false); setHelped(false); setShowHint(false); setLiveQ(null); setQuestionId(undefined); setBusy(false); setNotice(''); }
  function changeProfile(update: Partial<typeof p>) { setP({ ...p, ...update }); resetQuestion(); setLevel(1); setVariant(0); setRecords([]); setCoachMode(demo||pro); setLiveStory(null); setView('story'); }

  async function callTutor(action: string, extra: Record<string, unknown> = {}) {
    if(demo)throw new Error('demo');
    const response = await fetch('/api/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, subject: p.subject, topic: b(topic(p)), level, variant, stage:p.stage,hobby:p.hobby,interests,customHobby,lang: l, ...extra }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Request failed'); return data;
  }

  async function check(final = false) {
    if (busy || paused || solved || !draft.trim()) return;
    const token = ++epoch.current; setBusy(true); setNotice('');
    let r: AnswerCheck | undefined;
    try {
      if(!liveQ){throw new Error('local');}
      const data = await callTutor(final?'check':'coach', {questionId, studentAnswer: draft, final });
      if (token !== epoch.current) return;
      r = { status: data.status === 'correct' ? 'correct' : data.status === 'continue'||data.status==='partial'?'continue':'mistake', message: bi(data.feedback, data.feedback) };
      if(data.prerequisite)setLiveQ(old=>old?{...old,explanation:bi(data.prerequisite,data.prerequisite)}:old);
    } catch {
      if (token === epoch.current) {
        if(liveQ){setNotice(t('Checking is temporarily unavailable. Your answer is saved here.','הבדיקה אינה זמינה כרגע. התשובה נשארה כאן.'));return;}
        r = checkAnswer(q, draft, final);
      }
    } finally { if(token===epoch.current)setBusy(false); }
    if(!r||token!==epoch.current)return;
    setResult(r);
    if(r.status==='mistake'){
      setHelped(true);
      if(coachMode){setPaused(true);setRecovery('');setRecoveryError(false);}
    }
    if(r.status==='correct')setRecords(old=>[...old,{question:q.expression,correct:true,helped,topic:b(topic(p))}]);
  }

  async function generateLesson() {
    const token = ++epoch.current; setBusy(true); setNotice('');
    try {
      const data = await callTutor('story');
      if (token === epoch.current) setLiveStory({ text: data.text, sources: data.sources });
    } catch (e) {
      if (token === epoch.current) setNotice(t('AI learning is temporarily unavailable. You can keep practicing with the sample lessons.', 'למידה עם AI אינה זמינה כרגע. אפשר להמשיך לתרגל בשיעורי הדוגמה.'));
    } finally { if(token===epoch.current)setBusy(false); }
  }

  async function nextQuestion() {
    const nextLevel = records.length >= 2 && records.slice(-2).every(r => !r.helped) && records.length % 2 === 0 ? Math.min(level + 1, 3) : level;
    const nextVariant = variant + 1;
    resetQuestion(); setLevel(nextLevel); setVariant(nextVariant);
    const token = ++epoch.current; setBusy(true);
    try {
      const data = await callTutor('question', { level: nextLevel, variant: nextVariant });
      if (token === epoch.current && data.question) {setQuestionId(data.questionId);setLiveQ({ ...makeQuestion(p, nextLevel, nextVariant), prompt: bi(data.question.prompt, data.question.prompt), expression: data.question.expression, answer: 0, hint: bi(data.question.hint, data.question.hint), explanation: bi('Let’s review the prerequisite.','בואו נבדוק את נושא הבסיס.'),recovery:data.question.recovery });}
    } catch {if(!demo)setNotice(t('AI question unavailable. Showing a sample question.','שאלת AI אינה זמינה. מוצגת שאלת דוגמה.'));}
    finally { if (token === epoch.current) setBusy(false); }
  }

  async function recover() {
    const token=++epoch.current;let checked:AnswerCheck;
    if(liveQ){if(busy)return;setBusy(true);try{const data=await callTutor('recover',{questionId,studentAnswer:recovery});checked={status:data.status==='correct'?'correct':'mistake',message:bi(data.feedback,data.feedback)};}catch{setNotice(t('Please try again shortly.','נסו שוב בעוד רגע.'));return;}finally{setBusy(false);}}
    else checked=checkRecovery(q,recovery);
    if(token!==epoch.current)return;
    if(checked.status==='correct'){setPaused(false);setRecoveryError(false);setResult({status:'continue',message:bi('You’ve got the idea. Edit your answer and continue.','הבנתם את הרעיון. תקנו את התשובה והמשיכו.')});inputRef.current?.focus();}else{setRecoveryError(true);setRecoveryFeedback(checked.message);}
  }
  // Do not re-check the same draft when busy/result changes; cancel stale timers.
  const lastCoached=useRef('');
  useEffect(()=>{
    if(!pro||!coachMode||!questionId||paused||solved||busy||!draft.trim())return;
    const key=questionId+'|'+draft;if(lastCoached.current===key)return;
    const timer=setTimeout(()=>{lastCoached.current=key;void check(false);},2000);
    return()=>clearTimeout(timer);
  },[draft,coachMode,questionId,paused,solved,busy,pro]);
  const sessionSnapshot = useRef({ language: l, subject: p.subject, stage: p.stage, view, level, question: q.expression, paused, solved: records.length });
  useEffect(() => { sessionSnapshot.current = { language: l, subject: p.subject, stage: p.stage, view, level, question: q.expression, paused, solved: records.length }; }, [l, p.subject, p.stage, view, level, q.expression, paused, records.length]);
  useEffect(() => registerLearningState(() => sessionSnapshot.current), []);
  const currentStep = view === 'story' ? 0 : view === 'practice' ? 1 : 2;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'mobile-open' : ''}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setView('story'); }} aria-label="Limud home"><span className="brand-mark">l<span>•</span></span>limud<span className="brand-dot">.</span></a>
      <div className="workspace-label">{t('YOUR LEARNING SPACE', 'מרחב הלמידה שלכם')}</div>
      <nav>
        <button className={view === 'story' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('story'); setMobileMenu(false); }}><BookOpen size={20} />{t('My classroom', 'הכיתה שלי')}</button>
        <button className={view === 'practice' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('practice'); setMobileMenu(false); }}><Target size={20} />{t('Practice studio', 'מרחב התרגול')}</button>
        <button className={view === 'summary' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('summary'); setMobileMenu(false); }}><Trophy size={20} />{t('My progress', 'ההתקדמות שלי')}</button>
      </nav>
      <div className="sidebar-rule" /><div className="workspace-label">{t('A SKILL FOR LIFE', 'מיומנות לחיים')}</div>
      <button className="nav-item" onClick={() => { changeProfile({ subject: 'ai' }); setMobileMenu(false); }}><Sparkles size={20} />{t('Learning with AI', 'ללמוד עם AI')}<span className="tiny-new">{t('NEW', 'חדש')}</span></button>
      <div className="sidebar-bottom">
        <div className="mindset-card"><Lightbulb size={23} /><p>{t('Understanding starts with a good question.', 'הבנה מתחילה בשאלה טובה.')}</p><span>{t('Take your time. Make it yours.', 'בקצב שלכם. בדרך שלכם.')}</span></div>
        <button className="profile-button" onClick={() => setSettings(true)}><span className="avatar">{profile.first_name?.[0]?.toUpperCase() || (l === 'he' ? 'ל' : 'L')}</span><span><strong>{profile.first_name} {profile.last_name}</strong><small>{b(stages[p.stage]).split(' · ')[0]}</small></span><Settings2 size={17} /></button>
      </div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="mobile-toggle icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label={t('Toggle navigation', 'פתיחת ניווט')}><PanelLeftClose size={20} /></button>{t('My classroom', 'הכיתה שלי')}<ChevronRight size={14} /><strong>{b(subjects[p.subject])}</strong></div><div className="top-actions"><ThemeToggle lang={l}/><AccountLink lang={l} /><button className="language-button" onClick={() => changeProfile({ lang: l === 'en' ? 'he' : 'en' })}><Globe2 size={17} />{l === 'en' ? 'עברית' : 'English'}</button></div></header>
      <main id="main-content">
        {demo&&<div className="demo-banner">{t('You’re exploring the demo. AI generation and PDF reading require an account.','אתם בדמו. יצירת תוכן עם AI וקריאת PDF דורשות חשבון.')} <Link href="/register">{t('Create an account','יצירת חשבון')}</Link></div>}
        <div className="page-intro"><div><div className="eyebrow">{t('A LITTLE CURIOSITY. A LOT OF POSSIBILITY.', 'קצת סקרנות. הרבה אפשרויות.')}</div><h1>{view === 'summary' ? t("Look how far you’ve come.", 'תראו כמה התקדמתם.') : t("Let’s make it click.", 'בואו נבין את זה יחד.')}</h1><p>{t('Your interests. Your pace. A way of learning that feels like you.', 'התחביבים שלכם. הקצב שלכם. דרך ללמוד שמתאימה לכם.')}</p></div><button className="stage-button" onClick={() => setSettings(true)}><GraduationCap size={19} />{b(stages[p.stage])}<Settings2 size={15} /></button></div>
        <div className="subject-tabs" aria-label={t('Subject', 'מקצוע')}>{(Object.keys(subjects) as Subject[]).map(s => { const Icon = s === 'math' ? Calculator : s === 'cs' ? Code2 : Sparkles; return <button key={s} className={p.subject === s ? 'selected' : ''} onClick={() => changeProfile({ subject: s })}><Icon size={19} />{b(subjects[s])}{p.subject === s && <span className="tab-dot" />}</button>; })}</div>
        <div className="learning-grid">
          <div className="lesson-column">
            <div className="lesson-topline"><span><span className="lesson-label">{t('YOUR NEXT DISCOVERY', 'התגלית הבאה שלכם')}</span><h2>{b(topic(p))}</h2></span><span className="lesson-number">01<span>/</span>03</span></div>
            <div className="journey" aria-label={t('Lesson steps', 'שלבי השיעור')}>{(['story', 'practice', 'summary'] as View[]).map((v, i) => <button key={v} className={view === v ? 'current' : currentStep > i ? 'done' : ''} onClick={() => setView(v)}><span>{currentStep > i ? <Check size={13} /> : i + 1}</span>{i === 0 ? t('The story', 'הסיפור') : i === 1 ? t('Try it yourself', 'מנסים בעצמנו') : t('Reflect & grow', 'מסכמים ומתקדמים')}</button>)}</div>
            {notice && <div className="notice" role="alert">{notice}</div>}
            {view === 'story' && <>
              <section className="story-card">
                <div className="card-kicker"><span><Sparkles size={16} />{t('A LESSON THAT GETS YOU', 'שיעור שמבין אתכם')}</span><span>{t('4 min read', '4 דקות קריאה')}</span></div>
                <div className="story-title"><h3>{liveStory ? t('Your personalized lesson', 'השיעור האישי שלכם') : b(lesson.title)}</h3></div>
                <div className="hobby-row"><span>{t('Make it about', 'נלמד דרך')}</span>{(Object.keys(hobbies) as Hobby[]).map(h => { const Icon = hobbyIcons[h]; return <button key={h} className={p.hobby === h ? 'chosen' : ''} onClick={() => { setInterests([h]);setCustomHobby('');changeProfile({ hobby: h }); }}><Icon size={14} />{b(hobbies[h])}</button>; })}</div>
                {!demo&&<div className="story-interests"><details><summary>{t('More interests & your own ideas','עוד תחביבים ודברים שאתם אוהבים')}</summary><InterestPicker lang={l} values={interests} onChange={v=>{epoch.current++;setBusy(false);setInterests(v);setLiveStory(null);}} custom={customHobby} onCustom={v=>{epoch.current++;setBusy(false);setCustomHobby(v);setLiveStory(null);}}/></details></div>}<div className="story-text">{liveStory ? liveStory.text.split('\n').filter(Boolean).map((line, i) => <p key={i}>{line}</p>) : lesson.paragraphs.map((line, i) => <p key={i}>{b(line)}</p>)}</div>
                <button className="source-toggle" onClick={() => setShowSource(!showSource)}><BookOpen size={14} />{t('Learning source', 'מקור הלימוד')}<ChevronRight size={13} className={showSource ? 'rotate' : ''} /></button>{showSource && <p className="source-text">{liveStory ? liveStory.sources.length?liveStory.sources.join(' · '):t('Original AI explanation · not a reviewed curriculum source','הסבר מקורי של AI · אינו מקור לימודי מאושר') : b(lesson.source)}</p>}
              </section>
              <div className="lesson-footer"><span><CheckCircle2 size={16} />{t('A small idea. A strong foundation.', 'רעיון קטן. בסיס חזק.')}</span><button className="primary-button" onClick={() => setView('practice')}>{t('Let\'s practice', 'בואו נתרגל')}<ArrowRight size={17} /></button></div>
              <button className="text-button" onClick={generateLesson} disabled={busy||demo}><Sparkles size={16} />{busy ? t('Creating your lesson…', 'יוצרים את השיעור…') : t('Create a personalized story with AI', 'יצירת סיפור אישי עם AI')}</button>
            </>}
            {view === 'practice' && <section className="practice-card">
              <div className="practice-heading"><span className="level-pill">{t('LEVEL', 'רמה')} {level} · {level === 1 ? t('Building confidence', 'בונים ביטחון') : level === 2 ? t('Going deeper', 'מעמיקים') : t('Ready for a challenge', 'מוכנים לאתגר')}</span><span className="question-index">{t('Question', 'שאלה')} {variant + 1}</span></div>
              <h3>{b(q.prompt)}</h3><pre className={p.subject === 'cs' ? 'code-block' : 'question-equation'} dir="ltr">{q.expression}</pre>
              <div className="answer-heading"><label htmlFor="answer">{t('Your thinking space', 'המקום שלכם לחשוב')}</label><label className="switch-label"><input type="checkbox" checked={coachMode} disabled={paused||(!demo&&!pro)} onChange={e => setCoachMode(e.target.checked)} /><span className="switch" />{t('Coach as I solve', 'ליווי בזמן הפתרון')}{!demo&&' · Pro'}</label></div>
              <textarea id="answer" ref={inputRef} value={draft} dir="ltr" disabled={paused || solved || busy} onChange={e => { epoch.current++; setDraft(e.target.value); setResult(null); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && coachMode) { e.preventDefault(); check(false); } }} placeholder={t('Write your working or final answer here…', 'כתבו כאן את הדרך או את התשובה…')} rows={5} />
              <div className="input-help">{coachMode ? t('Enter checks a completed step · Shift + Enter adds a line', 'Enter בודק שלב שהושלם · Shift + Enter מוסיף שורה') : t('Take your time. Feedback comes when you submit.', 'קחו את הזמן. המשוב יגיע כשתשלחו את התשובה.')}</div>
              {result && <div role="status" className={`answer-result ${result.status}`}><span>{result.status === 'correct' ? <CheckCircle2 size={20} /> : <Lightbulb size={20} />}</span><p>{b(result.message)}</p></div>}
              {showHint && <div className="hint-box"><Lightbulb size={18} /><p>{b(q.hint)}</p></div>}
              <div className="practice-actions"><button className="text-button" onClick={() => { setShowHint(!showHint); setHelped(true); }} disabled={solved}><Lightbulb size={17} />{t('A little hint', 'רמז קטן')}</button>{solved ? <button className="primary-button" onClick={nextQuestion} disabled={busy}>{t('Next challenge', 'האתגר הבא')}<ArrowRight size={17} /></button> : <button className="primary-button" onClick={() => check(!coachMode)} disabled={!draft.trim() || paused || busy}>{busy ? t('Checking…', 'בודקים…') : coachMode ? t('Check my step', 'בדיקת השלב שלי') : t('Submit answer', 'שליחת תשובה')}<Send size={16} /></button>}</div>
              {!demo&&<><div className="pdf-answer"><label>{t('Handwritten answer? Attach a PDF (up to 3 MB)','פתרתם בכתב יד? צרפו PDF (עד 3MB)')}<input type="file" accept="application/pdf,.pdf" disabled={busy||paused||solved} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>3*1024*1024){setNotice(t('Maximum PDF size: 3 MB.','גודל PDF מרבי: 3MB.'));return;}setBusy(true);setNotice('');try{const body=new FormData();body.set('file',file);body.set('lang',l);const r=await fetch('/api/answers/pdf',{method:'POST',body});const data=await r.json();if(!r.ok)throw new Error();setCoachMode(false);setDraft(data.text);setResult(null);setNotice(t('Review and correct the transcription, then submit.','בדקו ותקנו את הטקסט שזוהה לפני שליחתו לבדיקה.'));}catch{setNotice(t('Could not read the PDF. Please try typing your answer.','לא ניתן לקרוא את ה־PDF כרגע. אפשר להקליד את התשובה.'));}finally{setBusy(false);}}}/></label><p className="auth-field-note">{t('The file is sent to AI for transcription and is not saved on this site.','הקובץ נשלח ל־AI לזיהוי הטקסט ואינו נשמר באתר.')}</p></div><button className="text-button" disabled={busy||paused} onClick={nextQuestion}>{t('Create a new AI question','יצירת שאלה חדשה עם AI')}</button></>}<div className="practice-source"><BookOpen size={13} />{liveQ?t('Original AI question','שאלה מקורית של AI'):b(q.source)}</div>
            </section>}
            {view === 'summary' && <section className="summary-card"><div className="summary-icon"><Trophy size={28} /></div><h3>{records.length ? t('Every step counts. Including the tricky ones.', 'כל צעד חשוב. גם אלה שהיו מאתגרים.') : t('Your progress starts with one try.', 'ההתקדמות מתחילה בניסיון אחד.')}</h3><p>{records.length ? t('Here\'s what you practiced in this session.', 'הנה מה שתרגלתם במפגש הזה.') : t('Solve a question to see your learning take shape here.', 'פתרו שאלה כדי לראות כאן את הלמידה שלכם מתקדמת.')}</p><div className="stats-grid"><div><strong>{records.length}</strong><span>{t('Questions solved', 'שאלות שנפתרו')}</span></div><div><strong>{records.filter(r => r.helped).length}</strong><span>{t('Solved with support', 'נפתרו עם תמיכה')}</span></div><div><strong>{level}/3</strong><span>{t('Practice level', 'רמת התרגול')}</span></div></div>{records.map((r, i) => <div className="record" key={i}><CheckCircle2 size={18} /><span><strong>{r.topic}</strong><code dir="ltr">{r.question}</code></span><small>{r.helped ? t('With a little help', 'עם קצת עזרה') : t('Independently', 'באופן עצמאי')}</small></div>)}<div className="reflection"><Brain size={22} /><div><strong>{t('One thought before you go', 'מחשבה אחת לפני שמסיימים')}</strong><p>{records.length ? t('Could you explain the idea to a friend without looking at your answer?', 'האם תוכלו להסביר את הרעיון לחבר בלי להסתכל בתשובה?') : t('Your first question is ready.', 'השאלה הראשונה שלכם מוכנה.')}</p></div></div><button className="primary-button" onClick={() => setView('practice')}>{t('Back to practice', 'בחזרה לתרגול')}<ArrowRight size={17} /></button></section>}
            <div className="bottom-note"><Link href="/contact">{t('Contact & help','יצירת קשר ועזרה')}</Link> · <LockKeyhole size={13} />{t('A space to explore. No grades, no pressure.', 'מרחב לחקור. בלי ציונים, בלי לחץ.')}</div>
          </div>
          <aside className={`coach-panel ${paused ? 'needs-attention' : ''}`} aria-label={t('Learning coach', 'מורה מלווה')}>
            <div className="coach-header"><span className="coach-avatar"><Sparkles size={24} /></span><div><h3>{t('Your learning companion', 'השותף שלכם ללמידה')}</h3><span>{t('Here for the aha moments', 'כאן לרגעי ההבנה')}</span></div><span className="online-dot" /></div>
            {paused ? <div className="coach-content" aria-live="polite"><div className="pause-label"><Lightbulb size={16} />{t('LET\'S CLEAR THIS UP', 'בואו נבין את זה')}</div><h4>{t('A quick detour. Then we\'re back.', 'עצירה קצרה. וממשיכים.')}</h4><p>{b(q.explanation)}</p><div className="recovery-box"><strong>{t('Try this little check', 'בדיקת הבנה קצרה')}</strong><code dir="ltr">{q.recovery}</code><label htmlFor="recovery">{t('Your answer', 'התשובה שלכם')}</label><input id="recovery" autoFocus value={recovery} onChange={e => setRecovery(e.target.value)} onKeyDown={e => e.key === 'Enter' && recover()} dir="ltr" placeholder="…" />{recoveryError && <p className="recovery-error" role="alert">{b(recoveryFeedback)}</p>}<button className="primary-button" onClick={recover}>{t('Check & return', 'בודקים וחוזרים')}<ArrowRight size={16} /></button></div></div> : <>
              <div className="coach-content"><div className="coach-greeting">{t('Hey, curious mind.', 'היי, טוב שאתם כאן.')} <span>✦</span></div><p>{solved ? t('You did it! Take a moment to notice what made the answer click.', 'הצלחתם! עצרו רגע וחשבו מה עזר לכם להבין.') : view === 'practice' ? t('Show me your thinking, one step at a time.', 'הראו לי את דרך החשיבה שלכם, צעד אחר צעד.') : t('Big ideas feel smaller when they start with something you love.', 'רעיונות גדולים נעשים פשוטים יותר כשהם מתחילים במשהו שאוהבים.')}</p><div className="coach-prompt"><span>"</span>{t('You don\'t have to know it yet. That\'s why we\'re here.', 'אתם לא חייבים לדעת עדיין. בשביל זה אנחנו כאן.')}</div><button className="coach-question" onClick={() => { setView('practice'); setShowHint(true); setHelped(true); }}><CircleHelp size={16} />{t('Help me take the first step', 'עזרו לי בצעד הראשון')}<ArrowUpRight size={15} /></button></div>
              <div className="session-plan"><div className="section-label">{t('OUR PLAN FOR TODAY', 'התוכנית שלנו להיום')}</div>{[bi('Connect it to your world', 'מחברים לעולם שלכם'), bi('Build understanding, step by step', 'בונים הבנה, צעד אחר צעד'), bi('Leave with an "I get it"', 'מסיימים עם ״הבנתי״')].map((item, i) => <div className={`plan-step ${i === currentStep ? 'active' : ''}`} key={i}><span>{i < currentStep ? <Check size={14} /> : i + 1}</span>{b(item)}</div>)}</div>
              <div className="coach-footer"><span className="leaf-icon"><Brain size={18} /></span><p>{t('Built around understanding, not memorizing answers.', 'לומדים כדי להבין, לא כדי לשנן תשובות.')}</p></div>
            </>}
          </aside>
        </div>
      </main>
    </div>
    {settings && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSettings(false); }}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onKeyDown={e => { if (e.key === 'Escape') setSettings(false); }}><div className="modal-heading"><h2 id="settings-title">{t('Make this space yours', 'המרחב הזה שלכם')}</h2><button ref={closeRef} className="icon-button" onClick={() => setSettings(false)} aria-label={t('Close settings', 'סגירת הגדרות')}><X size={21} /></button></div><p>{t('Choose a starting point. You can change it anytime.', 'בחרו נקודת התחלה. אפשר לשנות בכל רגע.')}</p><label>{t('School stage', 'שלב לימודים')}<select value={p.stage} onChange={e => changeProfile({ stage: e.target.value as Stage })}>{(Object.keys(stages) as Stage[]).map(s => <option value={s} key={s}>{b(stages[s])}</option>)}</select></label><label>{t('Language', 'שפה')}<select value={l} onChange={e => changeProfile({ lang: e.target.value as Lang })}><option value="en">English</option><option value="he">עברית</option></select></label><label>{t('Something you love', 'משהו שאתם אוהבים')}<select value={p.hobby} onChange={e => changeProfile({ hobby: e.target.value as Hobby })}>{(Object.keys(hobbies) as Hobby[]).map(h => <option value={h} key={h}>{b(hobbies[h])}</option>)}</select></label><div className="settings-divider" /><button className="primary-button full-width" onClick={() => setSettings(false)}>{t('Back to learning', 'בחזרה ללמידה')}<ArrowRight size={17} /></button></section></div>}
  </div>;
}

