'use client';
import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowRight, Check, ChevronRight, BookOpen, Sparkles, Code2, Calculator, GraduationCap, Settings2, Globe2, X, Lightbulb, Target, CircleHelp, Send, RotateCcw, Flag, LockKeyhole, CheckCircle2, Circle, Play, Trophy, Brain, Volleyball, Gamepad2, Music2, Rocket, PanelLeftClose } from 'lucide-react';
import { Profile, Lang, Subject, Stage, Hobby, Bi, bi, subjects, stages, hobbies, makeQuestion, story, topic, Question } from '@/lib/learning';
import AccountLink from '@/components/auth/account-link';
import { registerLearningState } from '@/lib/webmcp';
import { checkRecovery, checkAnswer, Check as AnswerCheck } from '@/lib/checker';
const hobbyIcons={football:Volleyball,gaming:Gamepad2,music:Music2,space:Rocket};
type View='story'|'practice'|'summary';
type Entry={question:string; correct:boolean; helped:boolean; topic:string};
export default function Classroom(){
 const [p,setP]=useState<Profile>({lang:'en',subject:'math',stage:'middle',hobby:'football'});
 const [view,setView]=useState<View>('story'); const [settings,setSettings]=useState(false); const [mobileMenu,setMobileMenu]=useState(false);
 const [level,setLevel]=useState(1); const [variant,setVariant]=useState(0); const [draft,setDraft]=useState(''); const [coachMode,setCoachMode]=useState(true);
 const [result,setResult]=useState<AnswerCheck|null>(null); const [paused,setPaused]=useState(false); const [recovery,setRecovery]=useState(''); const [recoveryError,setRecoveryError]=useState(false); const [recoveryFeedback,setRecoveryFeedback]=useState<Bi>(bi('','')); const [helped,setHelped]=useState(false); const [showHint,setShowHint]=useState(false); const [records,setRecords]=useState<Entry[]>([]);
 const [live,setLive]=useState(false); const [accessCode,setAccessCode]=useState(''); const [busy,setBusy]=useState(false); const [notice,setNotice]=useState(''); const [liveStory,setLiveStory]=useState<{text:string;sources:string[]}|null>(null); const [liveQ,setLiveQ]=useState<Question|null>(null); const [showSource,setShowSource]=useState(false);
 const epoch=useRef(0); const inputRef=useRef<HTMLTextAreaElement>(null); const closeRef=useRef<HTMLButtonElement>(null);
 const l=p.lang; const t=(en:string,he:string)=>l==='he'?he:en; const b=(value:Bi)=>value[l];
 const q=liveQ || makeQuestion(p,level,variant); const lesson=story(p); const solved=result?.status==='correct';
 useEffect(()=>{try{const value=localStorage.getItem('limud-preferences');if(value){const saved=JSON.parse(value);if(['en','he'].includes(saved.lang)&&Object.keys(subjects).includes(saved.subject)&&Object.keys(stages).includes(saved.stage)&&Object.keys(hobbies).includes(saved.hobby))setP(saved);}}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=l;document.documentElement.dir=l==='he'?'rtl':'ltr';try{localStorage.setItem('limud-preferences',JSON.stringify(p));}catch{}},[p,l]);
 useEffect(()=>{if(settings)closeRef.current?.focus();},[settings]);
 function resetQuestion(){epoch.current++;setDraft('');setResult(null);setPaused(false);setRecovery('');setRecoveryError(false);setHelped(false);setShowHint(false);setLiveQ(null);setBusy(false);setNotice('');}
 function changeProfile(update:Partial<Profile>){setP({...p,...update});resetQuestion();setLevel(1);setVariant(0);setRecords([]);setCoachMode(true);setLiveStory(null);setView('story');}
 async function callTutor(action:string,extra:Record<string,unknown>={}){
  const response=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json',...(accessCode?{'Authorization':`Bearer ${accessCode}`}:{})},body:JSON.stringify({action,profile:p,level,variant,...extra})});
  const data=await response.json(); if(!response.ok)throw new Error(data.error || 'Request failed'); return data;
 }
 async function check(final=false){
  if(busy||paused||solved||!draft.trim())return;
  const token=++epoch.current;setBusy(true);setNotice('');
  let r:AnswerCheck;
  try{if(live){const data=await callTutor('check',{answer:draft,final,question:q});r={status:data.status,message:bi(data.feedback,data.feedback)};}else r=checkAnswer(q,draft,final);
   if(token!==epoch.current)return;
   setResult(r);
   if(r.status==='mistake')setHelped(true);
   if(r.status==='mistake'&&coachMode){setPaused(true);setHelped(true);setRecovery('');setRecoveryError(false);}
   if(r.status==='correct')setRecords(old=>[...old,{question:q.expression,correct:true,helped,topic:b(topic(p))}]);
  }catch{if(token===epoch.current)setNotice(t('The live tutor could not respond. Check the connection settings, or switch back to demo.', 'המורה החי לא הצליח לענות. בדקו את הגדרות החיבור או חזרו להדגמה.'));}
  finally{if(token===epoch.current)setBusy(false);}
 }
 async function generateLesson(){
  const token=++epoch.current;setBusy(true);setNotice('');
  try{const data=await callTutor('story');if(token===epoch.current)setLiveStory({text:data.text,sources:data.sources});}catch{if(token===epoch.current)setNotice(t('Connect the live tutor in settings to generate a lesson from your materials.', 'חברו את המורה החי בהגדרות כדי ליצור שיעור מחומרי הלימוד שלכם.'));}finally{if(token===epoch.current)setBusy(false);}
 }
 async function nextQuestion(){
  const nextLevel=records.length>=2 && records.slice(-2).every(r=>!r.helped) && records.length%2===0?Math.min(level+1,3):level; const nextVariant=variant+1;
  resetQuestion();setLevel(nextLevel);setVariant(nextVariant);
  if(live){const token=++epoch.current;setBusy(true);try{const data=await callTutor('question',{level:nextLevel,variant:nextVariant});if(token===epoch.current)setLiveQ(data.question);}catch{if(token===epoch.current)setNotice(t('Question generation failed. An original demo exercise is shown.', 'יצירת השאלה נכשלה. מוצג תרגיל מקורי להדגמה.'));}finally{if(token===epoch.current)setBusy(false);}}
 }
 function recover(){const checked=checkRecovery(q,recovery);if(checked.status==='correct'){setPaused(false);setRecoveryError(false);setResult({status:'continue',message:bi('You’ve got the idea. Your original work is saved—edit the mistaken step and try again.', 'הבנתם את הרעיון. הדרך המקורית נשמרה—תקנו את השלב ונסו שוב.')});setTimeout(()=>inputRef.current?.focus(),30);}else{setRecoveryError(true);setRecoveryFeedback(checked.message);}}
 const sessionSnapshot=useRef({language:l,subject:p.subject,stage:p.stage,view,level,question:q.expression,paused,solved:records.length});
 useEffect(()=>{sessionSnapshot.current={language:l,subject:p.subject,stage:p.stage,view,level,question:q.expression,paused,solved:records.length};},[l,p.subject,p.stage,view,level,q.expression,paused,records.length]);
 useEffect(()=>registerLearningState(()=>sessionSnapshot.current),[]);
 const currentStep=view==='story'?0:view==='practice'?1:2;
 return <div className="app-shell">
  <aside className={`sidebar ${mobileMenu?'mobile-open':''}`}>
   <a className="brand" href="#" onClick={e=>{e.preventDefault();setView('story');}} aria-label="Limud home"><span className="brand-mark">l<span>•</span></span>limud<span className="brand-dot">.</span></a>
   <div className="workspace-label">{t('YOUR LEARNING SPACE','מרחב הלמידה שלכם')}</div>
   <nav>
    <button className={view==='story'?'nav-item active':'nav-item'} onClick={()=>{setView('story');setMobileMenu(false);}}><BookOpen size={20}/>{t('My classroom','הכיתה שלי')}</button>
    <button className={view==='practice'?'nav-item active':'nav-item'} onClick={()=>{setView('practice');setMobileMenu(false);}}><Target size={20}/>{t('Practice studio','מרחב התרגול')}</button>
    <button className={view==='summary'?'nav-item active':'nav-item'} onClick={()=>{setView('summary');setMobileMenu(false);}}><Trophy size={20}/>{t('My progress','ההתקדמות שלי')}</button>
   </nav>
   <div className="sidebar-rule"/><div className="workspace-label">{t('A SKILL FOR LIFE','מיומנות לחיים')}</div>
   <button className="nav-item" onClick={()=>{changeProfile({subject:'ai'});setMobileMenu(false);}}><Sparkles size={20}/>{t('Learning with AI','ללמוד עם AI')}<span className="tiny-new">{t('NEW','חדש')}</span></button>
   <div className="sidebar-bottom">
    <div className="mindset-card"><Lightbulb size={23}/><p>{t('Understanding starts with a good question.','הבנה מתחילה בשאלה טובה.')}</p><span>{t('Take your time. Make it yours.','בקצב שלכם. בדרך שלכם.')}</span></div>
    <button className="profile-button" onClick={()=>setSettings(true)}><span className="avatar">{l==='he'?'ל':'L'}</span><span><strong>{t('My learning profile','פרופיל הלמידה שלי')}</strong><small>{b(stages[p.stage]).split(' · ')[0]}</small></span><Settings2 size={17}/></button>
   </div>
  </aside>
  <div className="main-shell">
   <header className="topbar"><div className="breadcrumb"><button className="mobile-toggle icon-button" onClick={()=>setMobileMenu(!mobileMenu)} aria-label={t('Toggle navigation','פתיחת ניווט')}><PanelLeftClose size={20}/></button>{t('My classroom','הכיתה שלי')}<ChevronRight size={14}/><strong>{b(subjects[p.subject])}</strong></div><div className="top-actions"><AccountLink lang={l}/><span className="demo-pill">{live?t('Live connection','חיבור חי'):t('Interactive demo','הדגמה אינטראקטיבית')}</span><button className="language-button" onClick={()=>changeProfile({lang:l==='en'?'he':'en'})}><Globe2 size={17}/>{l==='en'?'עברית':'English'}</button></div></header>
   <main>
    <div className="page-intro"><div><div className="eyebrow">{t('A LITTLE CURIOSITY. A LOT OF POSSIBILITY.','קצת סקרנות. הרבה אפשרויות.')}</div><h1>{view==='summary'?t('Look how far you’ve come.','תראו כמה התקדמתם.'):t('Let’s make it click.','בואו נבין את זה יחד.')}</h1><p>{t('Your interests. Your pace. A way of learning that feels like you.','התחביבים שלכם. הקצב שלכם. דרך ללמוד שמתאימה לכם.')}</p></div><button className="stage-button" onClick={()=>setSettings(true)}><GraduationCap size={19}/>{b(stages[p.stage])}<Settings2 size={15}/></button></div>
    <div className="subject-tabs" aria-label={t('Subject','מקצוע')}>{(Object.keys(subjects) as Subject[]).map(s=>{const Icon=s==='math'?Calculator:s==='cs'?Code2:Sparkles;return <button key={s} className={p.subject===s?'selected':''} onClick={()=>changeProfile({subject:s})}><Icon size={19}/>{b(subjects[s])}{p.subject===s&&<span className="tab-dot"/>}</button>;})}</div>
    <div className="learning-grid">
     <div className="lesson-column">
      <div className="lesson-topline"><span><span className="lesson-label">{t('YOUR NEXT DISCOVERY','התגלית הבאה שלכם')}</span><h2>{b(topic(p))}</h2></span><span className="lesson-number">01<span>/</span>03</span></div>
      <div className="journey" aria-label={t('Lesson steps','שלבי השיעור')}>{(['story','practice','summary'] as View[]).map((v,i)=><button key={v} className={view===v?'current':currentStep>i?'done':''} onClick={()=>setView(v)}><span>{currentStep>i?<Check size={13}/>:i+1}</span>{i===0?t('The story','הסיפור'):i===1?t('Try it yourself','מנסים בעצמנו'):t('Reflect & grow','מסכמים ומתקדמים')}</button>)}</div>
      {notice&&<div className="notice" role="alert">{notice}</div>}
      {view==='story'&&<>
       <section className="story-card">
        <div className="card-kicker"><span><Sparkles size={16}/>{t('A LESSON THAT GETS YOU','שיעור שמבין אתכם')}</span><span>{t('4 min read','4 דקות קריאה')}</span></div>
        <div className="story-title"><h3>{liveStory?t('Your personalized lesson','השיעור האישי שלכם'):b(lesson.title)}</h3></div>
        <div className="hobby-row"><span>{t('Make it about','נלמד דרך')}</span>{(Object.keys(hobbies) as Hobby[]).map(h=>{const Icon=hobbyIcons[h];return <button key={h} className={p.hobby===h?'chosen':''} onClick={()=>{changeProfile({hobby:h});}}><Icon size={14}/>{b(hobbies[h])}</button>;})}</div>
        <div className="story-text">{liveStory?liveStory.text.split('\n').filter(Boolean).map((line,i)=><p key={i}>{line}</p>):lesson.paragraphs.map((line,i)=><p key={i}>{b(line).split(/(3x \+ 6 = 21|4 \+ 4 \+ 4 \+ 4|4 × 4 = 16|16 − 3 = 13|x² = 16|count\(n\)|count\(0\) = 0)/g).map((part,k)=>/[=×]/.test(part)&&/^[0-9a-z]/.test(part)?<bdi dir="ltr" key={k}>{part}</bdi>:part)}</p>)}</div>
        {!liveStory&&p.subject==='math'&&p.stage==='middle'&&<div className="equation-visual" dir="ltr"><div><span>3x + 6 = 21</span><small>{t('The mystery','התעלומה')}</small></div><ArrowRight size={19}/><div><span>3x = 15</span><small>{t('Find the balance','שומרים על איזון')}</small></div><ArrowRight size={19}/><div className="equation-answer"><span>x = 5</span><small>{t('The discovery','התגלית')}</small></div></div>}
        <div className="takeaway"><Lightbulb size={21}/><div><strong>{t('The idea to take with you','הרעיון שכדאי לקחת איתכם')}</strong><p>{b(lesson.takeaway)}</p></div></div>
        <button className="source-toggle" onClick={()=>setShowSource(!showSource)}><BookOpen size={14}/>{t('Learning source','מקור הלימוד')}<ChevronRight size={13} className={showSource?'rotate':''}/></button>{showSource&&<p className="source-text">{liveStory?liveStory.sources.join(' · '):b(lesson.source)}</p>}
       </section>
       <div className="lesson-footer"><span><CheckCircle2 size={16}/>{t('A small idea. A strong foundation.','רעיון קטן. בסיס חזק.')}</span><button className="primary-button" onClick={()=>setView('practice')}>{t('Let’s practice','בואו נתרגל')}<ArrowRight size={17}/></button></div>
       {live&&<button className="text-button" onClick={generateLesson} disabled={busy}><Sparkles size={16}/>{busy?t('Creating your lesson…','יוצרים את השיעור…'):t('Create a story from connected materials','יצירת סיפור מחומרי הלימוד המחוברים')}</button>}
      </>}
      {view==='practice'&&<section className="practice-card">
       <div className="practice-heading"><span className="level-pill">{t('LEVEL','רמה')} {level} · {level===1?t('Building confidence','בונים ביטחון'):level===2?t('Going deeper','מעמיקים'):t('Ready for a challenge','מוכנים לאתגר')}</span><span className="question-index">{t('Question','שאלה')} {variant+1}</span></div>
       <h3>{b(q.prompt)}</h3><pre className={p.subject==='cs'?'code-block':'question-equation'} dir="ltr">{q.expression}</pre>
       <div className="answer-heading"><label htmlFor="answer">{t('Your thinking space','המקום שלכם לחשוב')}</label><label className="switch-label"><input type="checkbox" checked={coachMode} disabled={paused} onChange={e=>setCoachMode(e.target.checked)}/><span className="switch"/>{t('Coach as I solve','ליווי בזמן הפתרון')}</label></div>
       <textarea id="answer" ref={inputRef} value={draft} dir="ltr" disabled={paused||solved||busy} onChange={e=>{epoch.current++;setDraft(e.target.value);setResult(null);}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&coachMode){e.preventDefault();check(false);}}} placeholder={p.subject==='math'&&p.stage==='middle'?'3x + 6 = 21\n…':t('Write your working or final answer here…','כתבו כאן את הדרך או את התשובה…')} rows={5}/>
       <div className="input-help">{coachMode?t('Enter checks a completed step · Shift + Enter adds a line','Enter בודק שלב שהושלם · Shift + Enter מוסיף שורה'):t('Take your time. Feedback comes when you submit.','קחו את הזמן. המשוב יגיע כשתשלחו את התשובה.')}</div>
       {result&&<div role="status" className={`answer-result ${result.status}`}><span>{result.status==='correct'?<CheckCircle2 size={20}/>:<Lightbulb size={20}/>}</span><p>{b(result.message)}</p></div>}
       {result?.status==='mistake'&&!coachMode&&<div className="hint-box"><BookOpen size={18}/><div><strong>{t('Feedback on your answer','משוב על התשובה שלכם')}</strong><p>{b(q.explanation)}</p><p>{b(q.hint)}</p></div></div>}
       {showHint&&<div className="hint-box"><Lightbulb size={18}/><p>{b(q.hint)}</p></div>}
       <div className="practice-actions"><button className="text-button" onClick={()=>{setShowHint(!showHint);setHelped(true);}} disabled={solved}><Lightbulb size={17}/>{t('A little hint','רמז קטן')}</button>{solved?<button className="primary-button" onClick={nextQuestion} disabled={busy}>{t('Next challenge','האתגר הבא')}<ArrowRight size={17}/></button>:<button className="primary-button" onClick={()=>check(!coachMode)} disabled={!draft.trim()||paused||busy}>{busy?t('Checking…','בודקים…'):coachMode?t('Check my step','בדיקת השלב שלי'):t('Submit answer','שליחת תשובה')}<Send size={16}/></button>}</div>
       <div className="practice-source"><BookOpen size={13}/>{b(q.source)}</div>
       {level===3&&p.stage==='high'&&<div className="exam-note"><GraduationCap size={20}/><span>{t('Ready to explore Bagrut practice. Verified exam questions appear when an approved question bank is connected.','מוכנים להתנסות בתרגול לבגרות. שאלות בחינה מאומתות יופיעו לאחר חיבור מאגר שאלות מאושר.')}</span></div>}
      </section>}
      {view==='summary'&&<section className="summary-card"><div className="summary-icon"><Trophy size={28}/></div><h3>{records.length?t('Every step counts. Including the tricky ones.','כל צעד חשוב. גם אלה שהיו מאתגרים.'):t('Your progress starts with one try.','ההתקדמות מתחילה בניסיון אחד.')}</h3><p>{records.length?t('Here’s what you practiced in this session.','הנה מה שתרגלתם במפגש הזה.'):t('Solve a question to see your learning take shape here.','פתרו שאלה כדי לראות כאן את הלמידה שלכם מתקדמת.')}</p><div className="stats-grid"><div><strong>{records.length}</strong><span>{t('Questions solved','שאלות שנפתרו')}</span></div><div><strong>{records.filter(r=>r.helped).length}</strong><span>{t('Solved with support','נפתרו עם תמיכה')}</span></div><div><strong>{level}/3</strong><span>{t('Practice level','רמת התרגול')}</span></div></div>{records.map((r,i)=><div className="record" key={i}><CheckCircle2 size={18}/><span><strong>{r.topic}</strong><code dir="ltr">{r.question}</code></span><small>{r.helped?t('With a little help','עם קצת עזרה'):t('Independently','באופן עצמאי')}</small></div>)}<div className="reflection"><Brain size={22}/><div><strong>{t('One thought before you go','מחשבה אחת לפני שמסיימים')}</strong><p>{records.length?t('Could you explain the idea to a friend without looking at your answer? Try it in your own words.','האם תוכלו להסביר את הרעיון לחבר בלי להסתכל בתשובה? נסו במילים שלכם.'):t('Mistakes help us find what to learn next. Your first question is ready.','טעויות עוזרות לנו למצוא מה ללמוד בהמשך. השאלה הראשונה שלכם מוכנה.')}</p></div></div><button className="primary-button" onClick={()=>setView('practice')}>{t('Back to practice','בחזרה לתרגול')}<ArrowRight size={17}/></button><p className="session-note">{t('Progress is for this session. Learning preferences are saved on this device.','ההתקדמות מתייחסת למפגש הנוכחי. העדפות הלמידה נשמרות במכשיר הזה.')}</p></section>}
      <div className="bottom-note"><LockKeyhole size={13}/>{t('A space to explore. No grades, no pressure.','מרחב לחקור. בלי ציונים, בלי לחץ.')}</div>
     </div>
     <aside className={`coach-panel ${paused?'needs-attention':''}`} aria-label={t('Learning coach','מורה מלווה')}>
      <div className="coach-header"><span className="coach-avatar"><Sparkles size={24}/></span><div><h3>{t('Your learning companion','השותף שלכם ללמידה')}</h3><span>{t('Here for the aha moments','כאן לרגעי ההבנה')}</span></div><span className="online-dot"/></div>
      {paused?<div className="coach-content" aria-live="polite"><div className="pause-label"><Lightbulb size={16}/>{t('LET’S CLEAR THIS UP','בואו נבין את זה')}</div><h4>{t('A quick detour. Then we’re back.','עצירה קצרה. וממשיכים.')}</h4><p>{b(q.explanation)}</p><div className="recovery-box"><strong>{t('Try this little check','בדיקת הבנה קצרה')}</strong><code dir="ltr">{q.recovery}</code><label htmlFor="recovery">{t('Your answer','התשובה שלכם')}</label><input id="recovery" autoFocus value={recovery} onChange={e=>setRecovery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&recover()} dir="ltr" placeholder="…"/>{recoveryError&&<p className="recovery-error" role="alert">{b(recoveryFeedback)}</p>}<button className="primary-button" onClick={recover}>{t('Check & return','בודקים וחוזרים')}<ArrowRight size={16}/></button></div><p className="saved-note"><LockKeyhole size={14}/>{t('Your original work is right where you left it.','הפתרון המקורי נשמר בדיוק כפי שהשארתם אותו.')}</p></div>:<>
       <div className="coach-content"><div className="coach-greeting">{t('Hey, curious mind.','היי, טוב שאתם כאן.')} <span>✦</span></div><p>{solved?t('You did it! Take a moment to notice what made the answer click. When you’re ready, we’ll try the next challenge.','הצלחתם! עצרו רגע וחשבו מה עזר לכם להבין. כשתהיו מוכנים, ננסה את האתגר הבא.'):view==='practice'?t('Show me your thinking, one step at a time. If something gets tangled, we’ll untangle it together.','הראו לי את דרך החשיבה שלכם, צעד אחר צעד. אם משהו מסתבך, נבין אותו יחד.'):t('Big ideas feel smaller when they start with something you love. Let’s find the connection.','רעיונות גדולים נעשים פשוטים יותר כשהם מתחילים במשהו שאוהבים. בואו נמצא את החיבור.')}</p><div className="coach-prompt"><span>“</span>{t('You don’t have to know it yet. That’s why we’re here.','אתם לא חייבים לדעת עדיין. בשביל זה אנחנו כאן.')}</div><button className="coach-question" onClick={()=>{setView('practice');setShowHint(true);setHelped(true);}}><CircleHelp size={16}/>{t('Help me take the first step','עזרו לי בצעד הראשון')}<ArrowUpRight size={15}/></button></div>
       <div className="session-plan"><div className="section-label">{t('OUR PLAN FOR TODAY','התוכנית שלנו להיום')}</div>{[bi('Connect it to your world','מחברים לעולם שלכם'),bi('Build understanding, step by step','בונים הבנה, צעד אחר צעד'),bi('Leave with an “I get it”','מסיימים עם ״הבנתי״')].map((item,i)=><div className={`plan-step ${i===currentStep?'active':''}`} key={i}><span>{i<currentStep?<Check size={14}/>:i+1}</span>{b(item)}</div>)}</div>
       <div className="coach-footer"><span className="leaf-icon"><Brain size={18}/></span><p>{t('Built around understanding, not memorizing answers.','לומדים כדי להבין, לא כדי לשנן תשובות.')}</p></div>
      </>}
     </aside>
    </div>
   </main>
  </div>
  {settings&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSettings(false);}}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onKeyDown={e=>{if(e.key==='Escape')setSettings(false);if(e.key==='Tab'){const items=e.currentTarget.querySelectorAll<HTMLElement>('button,input,select');const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}><div className="modal-heading"><h2 id="settings-title">{t('Make this space yours','המרחב הזה שלכם')}</h2><button ref={closeRef} className="icon-button" onClick={()=>setSettings(false)} aria-label={t('Close settings','סגירת הגדרות')}><X size={21}/></button></div><p>{t('Choose a starting point. You can change it anytime.','בחרו נקודת התחלה. אפשר לשנות בכל רגע.')}</p><label>{t('School stage','שלב לימודים')}<select value={p.stage} onChange={e=>changeProfile({stage:e.target.value as Stage})}>{(Object.keys(stages) as Stage[]).map(s=><option value={s} key={s}>{b(stages[s])}</option>)}</select></label><label>{t('Language','שפה')}<select value={l} onChange={e=>changeProfile({lang:e.target.value as Lang})}><option value="en">English</option><option value="he">עברית</option></select></label><label>{t('Something you love','משהו שאתם אוהבים')}<select value={p.hobby} onChange={e=>changeProfile({hobby:e.target.value as Hobby})}>{(Object.keys(hobbies) as Hobby[]).map(h=><option value={h} key={h}>{b(hobbies[h])}</option>)}</select></label><div className="settings-divider"/><label>{t('Tutor mode','מצב המורה')}<select value={live?'live':'demo'} onChange={e=>{resetQuestion();setLive(e.target.value==='live');setLiveStory(null);}}><option value="demo">{t('Demo · no API key needed','הדגמה · ללא מפתח API')}</option><option value="live" disabled>{t('Live AI · next phase','AI חי · בשלב הבא')}</option></select></label>{live&&<label>{t('Pilot access code','קוד גישה לפיילוט')}<input type="password" value={accessCode} onChange={e=>setAccessCode(e.target.value)} autoComplete="off"/><small>{t('Provided by your teacher. Never enter an API key here.','ניתן על ידי המורה שלכם. אין להזין כאן מפתח API.')}</small></label>}<p className="settings-note">{t('Demo includes original sample lessons and exercises. Live AI and verified exam retrieval require connected services. Changing your profile starts a new session.','ההדגמה כוללת שיעורים ותרגילים מקוריים לדוגמה. AI חי ואחזור מבחינות מאומתות דורשים שירותים מחוברים. שינוי הפרופיל מתחיל מפגש חדש.')}</p><button className="primary-button full-width" onClick={()=>setSettings(false)}>{t('Back to learning','בחזרה ללמידה')}<ArrowRight size={17}/></button></section></div>}
 </div>;
}
