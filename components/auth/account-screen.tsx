'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight,CheckCircle2,LogOut,Settings2 } from 'lucide-react';
import { AccountProfile } from '@/lib/auth-validation';
import { browserSupabase } from '@/lib/supabase/client';
import { AuthFrame,useAuthLanguage,authErrorText } from './shared';
export default function AccountScreen({profile,email,phone}:{profile:AccountProfile;email:string;phone:string}){
 const {lang,setLang,t}=useAuthLanguage(profile.locale);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function signOut(){if(busy)return;setBusy(true);try{const {error:err}=await browserSupabase().auth.signOut({scope:'local'});if(err)throw err;window.location.assign(`/login?lang=${lang}`);}catch{setError('unavailable');setBusy(false);}}
 return <AuthFrame lang={lang} onLanguage={()=>setLang(lang==='he'?'en':'he')} step={3}><div className="account-success-icon"><CheckCircle2 size={34}/></div><div className="auth-card-label">{t('YOU’RE ALL SET','הכול מוכן')}</div><h1>{t(`Welcome, ${profile.first_name}`,`ברוכים הבאים, ${profile.first_name}`)}</h1><p className="auth-subtitle">{t('Your email and phone are verified. Your account is ready.','המייל והטלפון אומתו. החשבון שלכם מוכן.')}</p>{error&&<div className="auth-error" role="alert">{authErrorText(error,lang)}</div>}<dl className="account-details"><div><dt>{t('Full name','שם מלא')}</dt><dd>{profile.first_name} {profile.last_name}</dd></div><div><dt>{t('City / town','עיר / יישוב')}</dt><dd>{profile.city}</dd></div><div><dt>{t('Age','גיל')}</dt><dd>{profile.age}</dd></div><div><dt>{t('Email','מייל')} <CheckCircle2 size={14}/></dt><dd dir="ltr">{email}</dd></div><div><dt>{t('Phone','טלפון')} <CheckCircle2 size={14}/></dt><dd dir="ltr">{phone}</dd></div></dl><Link className="primary-button auth-submit" href="/">{t('Go to my classroom','לכיתה שלי')}<ArrowRight size={17}/></Link><div className="account-actions"><Link href="/account/complete?edit=1"><Settings2 size={16}/>{t('Edit details','עריכת פרטים')}</Link><button onClick={signOut} disabled={busy}><LogOut size={16}/>{t('Sign out','התנתקות')}</button></div><p className="auth-field-note">{t('Your account details are saved. Learning progress in the demo is still limited to the current session.','פרטי החשבון נשמרים. ההתקדמות הלימודית בדמו עדיין מוגבלת למפגש הנוכחי.')}</p></AuthFrame>;
}
