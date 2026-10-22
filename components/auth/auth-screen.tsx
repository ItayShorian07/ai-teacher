'use client';
import { FormEvent,useState,useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight,Mail,CheckCircle2,ArrowLeft } from 'lucide-react';
import { browserSupabase } from '@/lib/supabase/client';
import { profileSchema,emailSchema,otpSchema,authErrorCode } from '@/lib/auth-validation';
import { newPasswordSchema,identifierSchema } from '@/lib/password-validation';
import { AuthFrame,AuthLang,useAuthLanguage,SetupNotice,GoogleIcon,authErrorText,useCooldown } from './shared';
import { InterestPicker } from './interests';
import { Captcha } from './captcha';
export default function AuthScreen({mode,configured,initialLang,googleEnabled,passwordEnabled,errorCode=''}:{mode:'login'|'register';configured:boolean;passwordEnabled:boolean;googleEnabled:boolean;initialLang:AuthLang;errorCode?:string}){
 const {lang,setLang,t}=useAuthLanguage(initialLang);const register=mode==='register';
 const [email,setEmail]=useState('');const [details,setDetails]=useState({username:'',first_name:'',last_name:'',city:'',age:'',phone:'',school:''});
 const [method,setMethod]=useState<'password'|'code'>('password');const [identifier,setIdentifier]=useState('');const [password,setPassword]=useState('');const [confirmPassword,setConfirmPassword]=useState('');
 const [interests,setInterests]=useState<string[]>([]);const [customHobby,setCustomHobby]=useState('');
 const [step,setStep]=useState<'details'|'email'>('details');const [token,setToken]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState(errorCode);
 const {remaining,start}=useCooldown();const [captchaToken,setCaptchaToken]=useState('');const [captchaVersion,setCaptchaVersion]=useState(0);
 const onCaptcha=useCallback((value:string)=>setCaptchaToken(value),[]);
 function resetCaptcha(){setCaptchaToken('');setCaptchaVersion(v=>v+1);}
 async function sendCode(event?:FormEvent){event?.preventDefault();if(busy||remaining)return;setError('');if(!configured){setError('not_configured');return;}
  const validatedEmail=emailSchema.safeParse(email);if(!validatedEmail.success){setError('invalid_email');return;}
  const profile=register?profileSchema.safeParse({...details,locale:lang,hobbies:interests,custom_hobby:customHobby}):null;if(profile&&!profile.success){setError('invalid_profile');return;}
  if(!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||!captchaToken){setError('captcha');return;}
  if(register&&step==='details'&&(!newPasswordSchema.safeParse(password).success||password!==confirmPassword)){setError(password!==confirmPassword?'password_mismatch':'weak_password');return;}
  setBusy(true);
  try{const supabase=browserSupabase();const {error:err}=register
    ?step==='email'
      ?await supabase.auth.resend({type:'signup',email:validatedEmail.data,options:{captchaToken}})
      :await supabase.auth.signUp({email:validatedEmail.data,password,options:{data:profile?.success?profile.data:{},captchaToken,emailRedirectTo:`${window.location.origin}/auth/callback`}})
    :await supabase.auth.signInWithOtp({email:validatedEmail.data,options:{shouldCreateUser:false,captchaToken}});
   // A sign-in request for an unknown email must not reveal account existence.
   if(err&&err.code!=='otp_disabled'&&err.code!=='user_not_found')throw err;
   setEmail(validatedEmail.data);setStep('email');setPassword('');setConfirmPassword('');start();
  }catch(e){setError(authErrorCode(e));}finally{setBusy(false);resetCaptcha();}
 }
 async function signIn(event:FormEvent){event.preventDefault();if(busy)return;setError('');
  if(!passwordEnabled){setError('not_configured');return;}
  if(!identifierSchema.safeParse(identifier).success||!password){setError('invalid_login');return;}
  if(!captchaToken){setError('captcha');return;}
  setBusy(true);
  try{const response=await fetch('/api/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier,password,captchaToken})});const data=await response.json();if(!response.ok){setError(data.error||'unavailable');return;}setPassword('');window.location.assign('/account/complete');}
  catch{setError('unavailable');}finally{setBusy(false);resetCaptcha();}
 }
 async function verifyEmail(event:FormEvent){event.preventDefault();if(busy)return;const parsed=otpSchema.safeParse(token);if(!parsed.success){setError('invalid_code');return;}setBusy(true);setError('');
  try{const {data,error:err}=await browserSupabase().auth.verifyOtp({email,token:parsed.data,type:'email'});if(err||!data.session){setError(err?authErrorCode(err):'invalid_code');return;}window.location.assign('/account/complete');}
  catch{setError('unavailable');}finally{setBusy(false);}
 }
 async function google(){if(!googleEnabled||busy)return;setBusy(true);setError('');try{const {error:err}=await browserSupabase().auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/auth/callback`}});if(err)throw err;}catch(e){setError(authErrorCode(e));setBusy(false);}}
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
   <button className="google-button" onClick={google} disabled={!googleEnabled||busy}><GoogleIcon/>{t('Continue with Google','המשך עם Google')}</button>{!googleEnabled&&<p className="auth-field-note">{t('Google sign-in is not available yet.','התחברות עם Google עדיין אינה זמינה.')}</p>}
   <div className="auth-divider"><span>{t('or with your account','או עם החשבון שלכם')}</span></div>
   {!register&&<div className="auth-methods" role="group" aria-label={t('Sign-in method','אופן ההתחברות')}><button type="button" aria-pressed={method==='password'} onClick={()=>{setMethod('password');setError('');resetCaptcha();}}>{t('Username & password','שם משתמש וסיסמה')}</button><button type="button" aria-pressed={method==='code'} onClick={()=>{setMethod('code');setPassword('');setError('');resetCaptcha();}}>{t('Email code','קוד במייל')}</button></div>}
   {!register&&method==='password'&&configured&&!passwordEnabled&&<p className="auth-field-note" role="status">{t('Password sign-in is being set up. You can use an email code.','כניסה בסיסמה עדיין בהגדרה. אפשר להשתמש בקוד למייל.')}</p>}
   <form className="auth-form" onSubmit={!register&&method==='password'?signIn:sendCode}>
    {register&&<>{input('username',t('Username','שם משתמש'),{autoComplete:'username',dir:'ltr',maxLength:30,minLength:3,pattern:'[A-Za-z][A-Za-z0-9_]{2,29}',autoCapitalize:'none',spellCheck:false,placeholder:'itay_shorian'})}<p className="auth-field-note">{t('3–30 English letters, numbers or underscores; start with a letter. Reserved when you finish your verified profile.','3–30 אותיות באנגלית, ספרות או קו תחתון; מתחילים באות. השם יישמר בסיום השלמת הפרופיל המאומת.')}</p><div className="auth-field-row">{input('first_name',t('First name','שם פרטי'),{autoComplete:'given-name'})}{input('last_name',t('Last name','שם משפחה'),{autoComplete:'family-name'})}</div><div className="auth-field-row city-age">{input('city',t('City / town','עיר / יישוב'),{autoComplete:'address-level2',placeholder:t('e.g. Haifa','למשל, חיפה')})}{input('age',t('Age','גיל'),{type:'number',min:1,max:120,inputMode:'numeric',maxLength:undefined})}</div>{input('phone',t('Mobile number','טלפון נייד'),{type:'tel',autoComplete:'tel',dir:'ltr',placeholder:'050-123-4567',maxLength:24})}{input('school',t('School','בית ספר'),{maxLength:120})}<InterestPicker lang={lang} values={interests} onChange={setInterests} custom={customHobby} onCustom={setCustomHobby}/></>}
    {!register&&method==='password'?<label className="auth-field">{t('Username or email','שם משתמש או מייל')}<input name="username" dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="itay_shorian" value={identifier} onChange={e=>setIdentifier(e.target.value)} maxLength={254} required/></label>:<label className="auth-field">{t('Email address','כתובת מייל')}<input name="email" type="email" dir="ltr" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} required/></label>}
    {(register||method==='password')&&<><label className="auth-field">{t('Password','סיסמה')}<input name="password" type="password" dir="ltr" autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={register?12:1} maxLength={128} required/></label>{register?<><p className="auth-field-note">{t('Use at least 12 characters. A few unrelated words make a good passphrase.','לפחות 12 תווים. אפשר להשתמש בכמה מילים שאינן קשורות זו לזו.')}</p><label className="auth-field">{t('Confirm password','אימות סיסמה')}<input name="password_confirmation" type="password" dir="ltr" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength={12} maxLength={128} required/></label></>:<Link className="auth-password-help" href={`/forgot-password?lang=${lang}`}>{t('Forgot your password?','שכחתם את הסיסמה?')}</Link>}</>}
    {!register&&method==='code'&&<p className="auth-field-note">{t('Use an email code, including for an existing account without a password.','אפשר להיכנס בקוד למייל גם לחשבון קיים שעדיין אין לו סיסמה.')}</p>}
    {configured&&<Captcha onToken={onCaptcha} resetKey={captchaVersion}/>}
    <button className="primary-button auth-submit" disabled={busy||!configured||!captchaToken||(!register&&method==='password'?!passwordEnabled:remaining>0)}>{busy?t('Please wait…','רק רגע…'):register?t('Create account & verify email','יצירת חשבון ואימות מייל'):method==='password'?t('Sign in','התחברות'):t('Send sign-in code','שליחת קוד התחברות')}<ArrowRight size={17}/></button>
   </form>
   {register&&<div className="auth-data-note"><CheckCircle2 size={17}/><p>{t('Your name, city and age personalize your account. Your email verifies it. Your phone is a contact field. These details aren’t shown to other students.','השם, היישוב והגיל משמשים לפרופיל שלכם. המייל משמש לאימות והטלפון הוא פרט ליצירת קשר. הפרטים לא מוצגים לתלמידים אחרים.')}</p></div>}
   <p className="auth-switch">{register?t('Already have an account?','כבר יש לכם חשבון?'):t('New to Limud?','פעם ראשונה ב־Limud?')} <Link href={`${register?'/login':'/register'}?lang=${lang}`}>{register?t('Sign in','התחברות'):t('Create an account','יצירת חשבון')}</Link></p>
  </>}
  <Link className="auth-guest" href="/demo">{t('Just looking? Continue to the demo','רק מתרשמים? ממשיכים לדמו')}<ArrowRight size={15}/></Link>
 </AuthFrame>;
}
