import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authConfig } from './config';
export async function serverSupabase(){
 const {url,key}=authConfig();const jar=await cookies();
 return createServerClient(url,key,{cookies:{getAll(){return jar.getAll();},setAll(values){try{for(const {name,value,options} of values)jar.set(name,value,options);}catch{/* Proxy owns refresh during server rendering. */}}}});
}
