import { Question, Bi, bi } from './learning';
type Poly = [number, number, number];
// Bounded, non-executing parser for numbers and polynomials through degree two.
function parse(input:string, variable?:string):Poly|null{
 const s=input.replace(/\s/g,'').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/²/g,'^2');
 if(!s||s.length>200||/[^0-9.a-z+*/()^\-]/.test(s))return null;
 const raw=s.match(/(?:\d+(?:\.\d*)?|\.\d+)|[a-z+*/()^\-]/g)||[];
 if(raw.join('')!==s)return null;
 const tokens:string[]=[];
 raw.forEach((token,index)=>{const prev=raw[index-1];if(index&&((/^(?:\d|\.)/.test(prev)||prev===')'||prev===variable)&&(token==='('||token===variable)))tokens.push('*');tokens.push(token);});
 let i=0;
 const clean=(p:Poly):Poly=>{if(p.some(n=>!Number.isFinite(n)||Math.abs(n)>1e15))throw 0;return p;};
 const plus=(a:Poly,b:Poly,sign=1):Poly=>clean([a[0]+sign*b[0],a[1]+sign*b[1],a[2]+sign*b[2]]);
 const times=(a:Poly,b:Poly):Poly=>{const out=[0,0,0,0,0];for(let j=0;j<3;j++)for(let k=0;k<3;k++)out[j+k]+=a[j]*b[k];if(Math.abs(out[3])+Math.abs(out[4])>1e-10)throw 0;return clean(out.slice(0,3) as Poly);};
 const atom=():Poly=>{const token=tokens[i++];if(token==='('){const v=add();if(tokens[i++]!==')')throw 0;return v;}if(variable&&token===variable)return [0,1,0];if(!token||!/^(?:\d|\.)/.test(token))throw 0;return clean([Number(token),0,0]);};
 const power=():Poly=>{const v=atom();if(tokens[i]!=='^')return v;i++;const e=unary();if(e[1]||e[2]||!Number.isInteger(e[0])||Math.abs(e[0])>10)throw 0;if(v[1]===0&&v[2]===0){if(v[0]===0&&e[0]<=0)throw 0;return clean([v[0]**e[0],0,0]);}if(e[0]===1)return v;if(e[0]===2)return times(v,v);if(e[0]===0)return [1,0,0];throw 0;};
 const unary=():Poly=>{if(tokens[i]==='-'){i++;return clean(unary().map(n=>-n) as Poly);}if(tokens[i]==='+'){i++;return unary();}return power();};
 const mul=():Poly=>{let v=unary();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],right=unary();if(op==='*')v=times(v,right);else{if(right[1]||right[2]||right[0]===0)throw 0;v=clean(v.map(n=>n/right[0]) as Poly);}}return v;};
 const add=():Poly=>{let v=mul();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++];v=plus(v,mul(),op==='+'?1:-1);}return v;};
 try{const value=add();return i===tokens.length?value:null;}catch{return null;}
}
export function arithmetic(input:string):number|null{const p=parse(input);return p&&p[1]===0&&p[2]===0?p[0]:null;}
export type Check={status:'correct'|'continue'|'mistake'|'clarify';message:Bi};
const response=(status:Check['status'],en:string,he:string):Check=>({status,message:bi(en,he)});
const clarify=()=>response('clarify','I couldn’t verify that notation. Try a number, fraction, or a complete equation. Written explanations need the live tutor.','לא הצלחתי לבדוק את הכתיבה הזו. נסו מספר, שבר או משוואה מלאה. הסברים במילים דורשים חיבור למורה חי.');
const mistake=()=>response('mistake','Let’s pause and check this step together.','נעצור רגע ונבדוק את השלב הזה יחד.');
const correct=()=>response('correct','That’s it! Your answer is correct.','זהו זה! התשובה שלכם נכונה.');
const continuing=()=>response('continue','This step checks out. Keep going to the final answer.','השלב הזה נכון. המשיכו עד לתשובה הסופית.');
export function checkAnswer(q:Question,raw:string,final=false):Check{
 const lines=raw.trim().split(/\n|→/).map(s=>s.trim()).filter(Boolean);if(!lines.length)return clarify();let result:Check=clarify();
 for(const line of lines){
  const s=line.replace(/\s/g,'');const parts=s.split('=');
  if(parts.length>2)return clarify();
  if(parts.length===1){const value=arithmetic(s);result=value===null?clarify():Math.abs(value-q.answer)<1e-8?correct():mistake();}
  else if(q.variable&&parts[0]===q.variable&&!/[a-z]/.test(parts[1])){const value=arithmetic(parts[1]);result=value===null?clarify():Math.abs(value-q.answer)<1e-8?correct():mistake();}
  else if(/[a-z]/.test(s)){
   if(!q.variable)return clarify();const left=parse(parts[0],q.variable),right=parse(parts[1],q.variable);if(!left||!right)return clarify();
   const [c,b,a]=left.map((n,i)=>n-right[i]);
   if(Math.abs(a)<1e-10&&Math.abs(b)<1e-10)return Math.abs(c)<1e-10?response('clarify','This identity doesn’t help find the unknown. Try a step that isolates it.','השוויון הזה אינו עוזר למצוא את הנעלם. נסו שלב שמבודד אותו.'):mistake();
   if(q.kind==='linear'&&Math.abs(a)>1e-10)return clarify();
   let roots:number[]=[];
   if(Math.abs(a)<1e-10)roots=[-c/b];else{const disc=b*b-4*a*c;if(disc>=0)roots=[(-b+Math.sqrt(disc))/(2*a),(-b-Math.sqrt(disc))/(2*a)];}
   if(q.kind==='quadratic')roots=roots.filter(n=>n>0);
   result=roots.length>0&&roots.every(n=>Math.abs(n-q.answer)<1e-8)?continuing():mistake();
  }else{const left=arithmetic(parts[0]),right=arithmetic(parts[1]);result=left===null||right===null?clarify():Math.abs(left-right)>1e-8?mistake():Math.abs(right-q.answer)<1e-8?correct():continuing();}
  if(result.status==='mistake'||result.status==='clarify')return result;
 }
 return final&&result.status==='continue'?response('clarify','Your working is on track. Add the final value to finish.','הדרך שלכם נכונה. הוסיפו את הערך הסופי כדי לסיים.'):result;
}
export function checkRecovery(q:Question,raw:string):Check{
 const variable=/\by\b/.test(q.recovery)?'y':undefined;
 return checkAnswer({...q,kind:'numeric',answer:q.recoveryAnswer,variable},raw.trim(),true);
}
