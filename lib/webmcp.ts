export type LearningSnapshot = {language:string;subject:string;stage:string;view:string;level:number;question:string;paused:boolean;solved:number};
type Context={registerTool:(tool:{name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};
export function registerLearningState(read:()=>LearningSnapshot){
 const context=(document as Document & {modelContext?:Context}).modelContext;
 if(!context?.registerTool)return ()=>{};
 const lifecycle=new AbortController();
 try{Promise.resolve(context.registerTool({name:'read_learning_session',description:'Read the current visible lesson, practice level, and recovery state. Does not reveal answers or change progress.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object');return read();}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
 return ()=>lifecycle.abort();
}
