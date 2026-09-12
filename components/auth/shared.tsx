'use client';
import { useEffect,useState,ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight,BookOpen,Check,Globe2,ShieldCheck,Sparkles } from 'lucide-react';
export type AuthLang='he'|'en';
export function useAuthLanguage(initial:AuthLang){
 const [lang,setLang]=useState<AuthLang>(initial);
 useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';},[lang]);
 return {lang,setLang,t:(en:string,he:string)=>lang==='he'?he:en};
}
export function AuthFrame({lang,onLanguage,children,step=0}:{lang:AuthLang;onLanguage:()=>void;children:ReactNode;step?:number}){
 const t=(en:string,he:string)=>lang==='he'?he:en;
 return <div className="auth-page" dir={lang==='he'?'rtl':'ltr'}>
  <header className="auth-top"><Link href="/" className="brand auth-brand" aria-label="Limud"><span className="brand-mark">l<span>•</span></span>limud<span className="brand-dot">.</span></Link><div><Link className="auth-demo-link" href="/">{t('Explore the demo','להתנסות בדמו')}<ArrowRight size={16}/></Link><button onClick={onLanguage} className="language-button"><Globe2 size={17}/>{lang==='he'?'English':'עברית'}</button></div></header>
  <main className="auth-layout">
   <aside className="auth-welcome"><span className="auth-welcome-icon"><Sparkles size={27}/></span><div className="auth-eyebrow">{t('A SPACE THAT GROWS WITH YOU','מרחב שגדל איתכם')}</div><h2>{t('A little curiosity.\nA world of understanding.','קצת סקרנות.\nעולם של הבנה.')}</h2><p>{t('A personal place for your questions, your interests, and those “now I get it” moments.','מקום אישי לשאלות שלכם, לתחביבים שלכם ולרגעים שבהם הכול פתאום ברור.')}</p><div className="auth-steps">{[t('Choose how to join','בוחרים איך להצטרף'),t('Make this space yours','משלימים את הפרטים שלכם'),t('Verify and get ready to learn','מאמתים ומוכנים ללמוד')].map((text,i)=><div className={step===i?'active':''} key={i}><span>{step>i?<Check size={16}/>:i+1}</span><p>{text}</p></div>)}</div><div className="auth-welcome-foot"><BookOpen size={20}/><span>{t('Mathematics · Computer science · Learning with AI','מתמטיקה · מדעי המחשב · למידה עם AI')}</span></div></aside>
   <section className="auth-card">{children}</section>
  </main>
  <footer className="auth-bottom"><ShieldCheck size={16}/>{t('Verification codes are personal. Never share them with anyone.','קודי האימות אישיים. לא משתפים אותם עם אחרים.')}</footer>
 </div>;
}
export function SetupNotice({lang}:{lang:AuthLang}){return <div className="auth-setup" role="status"><Sparkles size={19}/><p>{lang==='he'?'ההרשמה עדיין לא פתוחה. בינתיים אפשר להתנסות בדמו ללא חשבון.':'Registration isn’t open yet. You can explore the demo without an account.'}</p></div>;}
export function GoogleIcon(){return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.5c0-1.5-.1-2.9-.4-4.3H24v8.1h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.8 6-15.2z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4.1 1.9-6.8 1.9-5.3 0-9.8-3.6-11.4-8.4H5.7v5.4A20.4 20.4 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.6 27.4a12.3 12.3 0 0 1 0-7.8v-5.4H5.7A20.4 20.4 0 0 0 3.5 24c0 3.3.8 6.4 2.2 9.2l6.9-5.8z"/><path fill="#EA4335" d="M24 12.2c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4C16 4 9.1 8.6 5.7 15.2l6.9 5.4C14.2 15.8 18.7 12.2 24 12.2z"/></svg>;}
export const authErrorText=(code:string,lang:AuthLang)=>{
 const messages:Record<string,[string,string]>={
  invalid_profile:['Check the names, city, age and phone number.','בדקו את השם, היישוב, הגיל ומספר הטלפון.'],
  invalid_email:['Enter a valid email address.','הזינו כתובת מייל תקינה.'],
  invalid_code:['The code is invalid or expired. Check it or request a new code.','הקוד שגוי או שפג תוקפו. בדקו אותו או בקשו קוד חדש.'],
  rate_limit:['Too many attempts. Wait a little before trying again.','בוצעו יותר מדי ניסיונות. המתינו מעט לפני ניסיון נוסף.'],
  captcha:['Complete the security check and try again.','השלימו את בדיקת האבטחה ונסו שוב.'],
  not_configured:['Registration isn’t open yet. Please use the demo for now.','ההרשמה עדיין לא פתוחה. אפשר להשתמש בדמו בינתיים.'],
  unauthorized:['Your session expired. Please sign in again.','פג תוקף ההתחברות. התחברו שוב.'],
  email_required:['Verify your email before adding your phone.','אמתו את כתובת המייל לפני הוספת הטלפון.'],
  profile_required:['Complete and save your details first.','השלימו ושמרו את הפרטים תחילה.'],
  verification_incomplete:['Verification is not complete yet. Please request a new code.','האימות עדיין לא הושלם. בקשו קוד חדש.'],
  callback:['Google sign-in was cancelled or could not finish. Please try again.','ההתחברות עם Google בוטלה או לא הושלמה. נסו שוב.']
 };
 return (messages[code]||['We couldn’t complete the request. Try again later.','לא הצלחנו להשלים את הבקשה. נסו שוב מאוחר יותר.'])[lang==='he'?1:0];
};
export function useCooldown(){const [remaining,setRemaining]=useState(0);useEffect(()=>{if(!remaining)return;const timer=setTimeout(()=>setRemaining(n=>Math.max(0,n-1)),1000);return()=>clearTimeout(timer);},[remaining]);return {remaining,start:()=>setRemaining(60)};}
