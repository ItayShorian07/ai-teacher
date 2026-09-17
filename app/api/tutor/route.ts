import { createHash } from 'node:crypto';
import { privateJson,validOrigin,boundedJson } from '@/lib/account-server';
import { LearningError,learningAccess,consumeQuota } from '@/lib/learning-access';
import { tutorSchema,questionSchema } from '@/lib/tutor-validation';
import { generateStory,generateQuestion,checkAnswer,embed } from '@/lib/gemini';
import { makeQuestion,topic as topicFor } from '@/lib/learning';
import { checkAnswer as deterministicCheck,checkRecovery } from '@/lib/checker';
import { interests } from '@/lib/interests';
const presets=new Set(interests.map(([id])=>id));
export const maxDuration=120;
export async function POST(request:Request){
 if(!validOrigin(request))return privateJson({error:'invalid_origin'},403);
 try{
 const parsed=tutorSchema.safeParse(await boundedJson(request,20000));if(!parsed.success)return privateJson({error:'invalid_input'},400);
 const input=parsed.data,{action,lang,subject,stage,level,variant}=input;
 const {account,db}=await learningAccess(action==='coach');
 await consumeQuota(account.user.id);
 const profile={lang,subject,stage,hobby:input.hobby};
 // Canonical curriculum topic comes from the selected track, not free-form instructions.
 const topic=topicFor(profile)[lang];
 if(['check','coach','recover'].includes(action)){
  if(!input.studentAnswer?.trim())return privateJson({error:'answer_required'},400);
  if(!input.questionId){
   const q=makeQuestion(profile,level,variant);
   const r=action==='recover'?checkRecovery(q,input.studentAnswer):deterministicCheck(q,input.studentAnswer,action!=='coach');
   return privateJson({status:r.status,feedback:r.message[lang]});
  }
  const {data:stored,error}=await db.from('learning_questions').select('payload,context').eq('id',input.questionId).eq('user_id',account.user.id).maybeSingle();
  if(error)throw new LearningError('storage_unavailable',503);
  if(!stored)throw new LearningError('question_not_found',404);
  const q=questionSchema.parse(stored.payload);
  const result=await checkAnswer({question:action==='recover'?q.recovery:q.prompt,expression:action==='recover'?'':q.expression,correctAnswer:action==='recover'?q.recoveryAnswer:q.answer,studentAnswer:input.studentAnswer,lang,context:stored.context,mode:action,final:action!=='coach'});
  return privateJson(result);
 }
 const hobbies=[...new Set(input.interests.length?input.interests:[input.hobby])].sort();
 const personal=!!input.customHobby||hobbies.some(h=>!presets.has(h));
 const context={subject,topic,stage,lang,level:action==='question'?level:0,variant:action==='question'?variant:0,hobbies:[...hobbies,...(input.customHobby?[input.customHobby]:[])]};
 const cacheKey=createHash('sha256').update(JSON.stringify({v:2,model:process.env.GEMINI_MODEL||'gemini-2.5-flash',action,context,owner:personal?account.user.id:'shared'})).digest('hex');
 const {data:cached,error:cacheError}=await db.from('learning_cache').select('payload').eq('cache_key',cacheKey).maybeSingle();
 if(cacheError)throw new LearningError('storage_unavailable',503);
 let payload=cached?.payload;
 if(!payload){
  const vector=await embed(`${subject} ${topic} ${stage} ${lang} ${context.hobbies.join(', ')}`);
  const filters={p_embedding:vector,p_language:lang,p_subject:subject,p_grade:stage==='primary'?5:stage==='middle'?8:11,p_topic:topic};
  const {data:materials,error}=await db.rpc('retrieve_learning_material',filters);
  if(error)throw new LearningError('retrieval_unavailable',503);
  const {data:examples,error:exampleError}=action==='question'?await db.rpc('retrieve_learning_questions',{...filters,p_level:level}):{data:[],error:null};
  if(exampleError)throw new LearningError('retrieval_unavailable',503);
  const sources=(materials||[]).map((m:{title:string;source_page?:number})=>`${m.title}${m.source_page?` · ${m.source_page}`:''}`);
  const reference=[...(materials||[]).map((m:{content:string})=>m.content.slice(0,8000)),...(examples||[]).map((q:{question_text:string;answer:unknown;worked_solution:string})=>JSON.stringify(q).slice(0,8000))];
  sources.push(...(examples||[]).map((q:{title:string})=>q.title));
  payload=action==='story'?{text:await generateStory({...context,reference}),sources}: {question:await generateQuestion({...context,reference}),sources,reference};
  const {error:saveError}=await db.from('learning_cache').upsert({cache_key:cacheKey,owner_id:personal?account.user.id:null,kind:action,payload,embedding:vector},{onConflict:'cache_key',ignoreDuplicates:true});
  if(saveError)throw new LearningError('storage_unavailable',503);
 }
 if(action==='story')return privateJson({...payload,cached:!!cached});
 const q=questionSchema.parse(payload.question);
 const {data:session,error}=await db.from('learning_questions').insert({user_id:account.user.id,payload:q,context:{...context,reference:payload.reference}}).select('id').single();
 if(error)throw new LearningError('storage_unavailable',503);
 return privateJson({questionId:session.id,question:{prompt:q.prompt,expression:q.expression,hint:q.hint,recovery:q.recovery},sources:payload.sources,cached:!!cached});
 }catch(e){if(e instanceof Error&&e.message==='BODY_TOO_LARGE')return privateJson({error:'body_too_large'},413);if(e instanceof SyntaxError)return privateJson({error:'invalid_json'},400);return privateJson({error:e instanceof LearningError?e.message:'learning_unavailable'},e instanceof LearningError?e.status:503);}
}
