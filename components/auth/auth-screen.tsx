'use client';
import { FormEvent,useState,useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight,Mail,CheckCircle2,ArrowLeft } from 'lucide-react';
import { browserSupabase } from '@/lib/supabase/client';
import { siteOrigin } from '@/lib/supabase/config';
import { profileSchema,emailSchema,otpSchema,authErrorCode } from '@/lib/auth-validation';
import { AuthFrame,AuthLang,useAuthLanguage,SetupNotice,GoogleIcon,authErrorText,useCooldown } from './shared';
import { Captcha } from './captcha';
export default function AuthScreen({mode,configured,initialLang,errorCode=''}:{mode:'login'|'register';configured:boolean;initialLang:AuthLang;errorCode?:string}){
 const {lang,setLang,t}=useAuthLanguage(initialLang);const register=mode==='register';
 const [email,setEmail]=useState('');const [details,setDetails]=useState({first_name:'',last_name:'',city:'',age:'',phone:''});
 const [step,setStep]=useState<'details'|'email'>('details');const [token,setToken]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState(errorCode);
 const {remaining,start}=useCooldown();const [captchaToken,setCaptchaToken]=useState('');const [captchaVersion,setCaptchaVersion]=useState(0);
 const onCaptcha=useCallback((value:string)=>setCaptchaToken(value),[]);
 function resetCaptcha(){setCaptchaToken('');setCaptchaVersion(v=>v+1);}
 async function sendCode(event?:FormEvent){event?.preventDefault();if(busy||remaining)return;setError('');if(!configured){setError('not_configured');return;}
  const validatedEmail=emailSchema.safeParse(email);if(!validatedEmail.success){setError('invalid_email');return;}
  const profile=register?profileSchema.safeParse({...details,locale:lang}):null;if(profile&&!profile.success){setError('invalid_profile');return;}
  if(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&!captchaToken){setError('captcha');return;}
  setBusy(true);
  try{const {error:err}=await browserSupabase().auth.signInWithOtp({email:validatedEmail.data,options:{shouldCreateUser:register,...(profile?.success?{data:profile.data}:{}),...(captchaToken?{captchaToken}:{})}});
   // A sign-in request for an unknown email must not reveal account existence.
   if(err&&err.code!=='otp_disabled'&&err.code!=='user_not_found')throw err;
   setEmail(validatedEmail.data);setStep('email');start();
  }catch(e){setError(authErrorCode(e));}finally{setBusy(false);resetCaptcha();}
 }
 async function verifyEmail(event:FormEvent){event.preventDefault();if(busy)return;const parsed=otpSchema.safeParse(token);if(!parsed.success){setError('invalid_code');return;}setBusy(true);setError('');
  try{const {data,error:err}=await browserSupabase().auth.verifyOtp({email,token:parsed.data,type:'email'});if(err||!data.session){setError(err?authErrorCode(err):'invalid_code');return;}window.location.assign('/account/complete');}
  catch{setError('unavailable');}finally{setBusy(false);}
 }
 async function google(){if(!configured||busy)return;setBusy(true);setError('');try{const {error:err}=await browserSupabase().auth.signInWithOAuth({provider:'google',options:{redirectTo:`${siteOrigin()}/auth/callback`}});if(err)throw err;}catch(e){setError(authErrorCode(e));setBusy(false);}}
 const input=(field:keyof typeof details,label:string,extra:Record<string,unknown>={})=><label className="auth-field">{label}<input name={field} value={details[field]} onChange={e=>setDetails({...details,[field]:e.target.value})} required maxLength={field==='city'?100:60} {...extra}/></label>;
 return <AuthFrame lang={lang} onLanguage={()=>setLang(lang==='he'?'en':'he')} step={step==='email'?2:register?1:0}>
  <div className="auth-card-label">{t('YOUR NEXT CHAPTER','הפרק הבא שלכם')}</div>
  <h1>{step==='email'?t('Check your inbox','בודקים את תיבת המייל'):register?t('Let’s get to know you','נעים להכיר'):t('Welcome back','טוב שחזרתם')}</h1>
  <p className="auth-subtitle">{step==='email'?t('Enter the verification code sent to your email.','הזינו את קוד האימות שנשלח למייל שלכם.'):register?t('Create your personal learning account.','יוצרים את חשבון הלמידה האישי שלכם.'):t('Your next “I get it” moment is waiting.','רגע ההבנה הבא שלכם כבר מחכה.')}</p>
  {!configured&&<SetupNotice lang={lang}/>}
  {error&&<div className="auth-error" role="alert">{authErrorText(error,lang)}</div>}
  {step==='email'?<>
   <div className="auth-recipient"><Mail size={19}/><bdi dir="ltr">{email}</bdi></div>
   <form onSubmit={verifyEmail} className="auth-form"><label className="auth-field">{t('Email verification code','קוד האימות למייל')}<input autoFocus className="otp-input" inputMode="numeric" autoComplete="one-time-code" dir="ltr" value={token} onChange={e=>setToken(e.target.value.replace(/\D/g,''))} maxLength={10} pattern="[0-9]{6,10}" required/></label><button className="primary-button auth-submit" disabled={busy||!configured}>{busy?t('Checking…','בודקים…'):t('Verify email & continue','אימות מייל והמשך')}<ArrowRight size={17}/></button></form>
   {configured&&<Captcha onToken={onCaptcha} resetKey={captchaVersion}/>}
   <div className="auth-resend"><span>{t('No email? Check spam, too.','המייל לא הגיע? בדקו גם בתיקיית הספאם.')}</span><button onClick={()=>sendCode()} disabled={busy||remaining>0}>{remaining?t(`Resend in ${remaining}s`,`שליחה חוזרת בעוד ${remaining} שניות`):t('Send a new code','שליחת קוד חדש')}</button></div>
   <button className="auth-back" onClick={()=>{setStep('details');setToken('');setError('');}}><ArrowLeft size={16}/>{t('Use another email','שימוש במייל אחר')}</button>
  </>:<>
   <button className="google-button" onClick={google} disabled={!configured||busy}><GoogleIcon/>{t('Continue with Google','המשך עם Google')}</button>
   <div className="auth-divider"><span>{t('or with your email','או באמצעות המייל שלכם')}</span></div>
   <form className="auth-form" onSubmit={sendCode}>
    {register&&<><div className="auth-field-row">{input('first_name',t('First name','שם פרטי'),{autoComplete:'given-name'})}{input('last_name',t('Last name','שם משפחה'),{autoComplete:'family-name'})}</div><div className="auth-field-row city-age">{input('city',t('City / town','עיר / יישוב'),{autoComplete:'address-level2',placeholder:t('e.g. Haifa','למשל, חיפה')})}{input('age',t('Age','גיל'),{type:'number',min:1,max:120,inputMode:'numeric',maxLength:undefined})}</div>{input('phone',t('Mobile number','טלפון נייד'),{type:'tel',autoComplete:'tel',dir:'ltr',placeholder:'050-123-4567',maxLength:24})}<p className="auth-field-note">{t('We’ll verify this number by SMS after confirming your email.','נאמת את המספר ב־SMS לאחר אימות המייל.')}</p></>}
    <label className="auth-field">{t('Email address','כתובת מייל')}<input name="email" type="email" dir="ltr" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} required/></label>
    {!register&&<p className="auth-field-note">{t('We’ll send a one-time sign-in code. No password to remember.','נשלח קוד התחברות חד־פעמי. אין צורך לזכור סיסמה.')}</p>}
    {configured&&<Captcha onToken={onCaptcha} resetKey={captchaVersion}/>}
    <button className="primary-button auth-submit" disabled={busy||!configured||remaining>0}>{busy?t('Sending…','שולחים…'):register?t('Create account & send code','יצירת חשבון ושליחת קוד'):t('Send sign-in code','שליחת קוד התחברות')}<ArrowRight size={17}/></button>
   </form>
   {register&&<div className="auth-data-note"><ShieldNote/><p>{t('Your name, city and age personalize your account. Your email and phone verify it. These details aren’t shown to other students.','השם, היישוב והגיל משמשים לפרופיל שלכם. המייל והטלפון משמשים לאימות. הפרטים לא מוצגים לתלמידים אחרים.')}</p></div>}
   <p className="auth-switch">{register?t('Already have an account?','כבר יש לכם חשבון?'):t('New to Limud?','פעם ראשונה ב־Limud?')} <Link href={`${register?'/login':'/register'}?lang=${lang}`}>{register?t('Sign in','התחברות'):t('Create an account','יצירת חשבון')}</Link></p>
  </>}
  <Link className="auth-guest" href="/">{t('Just looking? Continue to the demo','רק מתרשמים? ממשיכים לדמו')}<ArrowRight size={15}/></Link>
 </AuthFrame>;
}
function ShieldNote(){return <CheckCircle2 size={17}/>;}
