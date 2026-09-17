'use client';
import { interests } from '@/lib/interests';

export function InterestPicker({lang,values,onChange,custom,onCustom}:{lang:'he'|'en';values:string[];onChange:(v:string[])=>void;custom:string;onCustom:(v:string)=>void}){
 return <fieldset className="interest-picker"><legend>{lang==='he'?'מה מעניין אתכם? (לא חובה)':'What interests you? (optional)'}</legend><div className="hobby-options">{interests.map(([id,en,he])=><button key={id} type="button" aria-pressed={values.includes(id)} className={`hobby-chip ${values.includes(id)?'selected':''}`} onClick={()=>onChange(values.includes(id)?values.filter(x=>x!==id):values.length<20?[...values,id]:values)}>{lang==='he'?he:en}</button>)}</div><label className="auth-field">{lang==='he'?'משהו נוסף שאתם אוהבים':'Something else you love'}<input value={custom} onChange={e=>onCustom(e.target.value)} maxLength={60} placeholder={lang==='he'?'למשל מיינקראפט, הארי פוטר או K-pop':'Minecraft, Harry Potter or K-pop'}/></label></fieldset>;
}
