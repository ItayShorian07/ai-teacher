import { z } from 'zod';
export function normalizePhone(value:string):string {
 const clean=value.trim().replace(/[\s()\-]/g,'');
 if(/^05\d{8}$/.test(clean))return `+972${clean.slice(1)}`;
 if(/^9725\d{8}$/.test(clean))return `+${clean}`;
 return clean;
}
const name=z.string().trim().min(1).max(60).regex(/^[^\p{Cc}<>]+$/u);
export const profileSchema=z.object({
 first_name:name,last_name:name,city:z.string().trim().min(2).max(100).regex(/^[^\p{Cc}<>]+$/u),
 age:z.coerce.number().int().min(1).max(120),
 phone:z.string().transform(normalizePhone).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/)),
 locale:z.enum(['he','en'])
}).strict();
export const emailSchema=z.string().trim().email().max(254);
export const otpSchema=z.string().trim().regex(/^\d{6,10}$/);
export type AccountProfile=z.infer<typeof profileSchema>;
export type VerifiedIdentity={id?:string;email?:string|null;email_confirmed_at?:string|null;phone?:string|null;phone_confirmed_at?:string|null};
export function accountComplete(user:VerifiedIdentity,profile:unknown,expectedUserId?:string):boolean{
 if(expectedUserId && user.id!==expectedUserId)return false;
 const parsed=profileSchema.safeParse(profile);
 return parsed.success&&!!user.email&&!!user.email_confirmed_at&&!!user.phone_confirmed_at&&!!user.phone&&normalizePhone(user.phone.startsWith('+')?user.phone:`+${user.phone}`)===parsed.data.phone;
}
export function authErrorCode(error:unknown):string{
 const e=error as {status?:number;code?:string};
 if(e?.status===429||e?.code?.includes('rate_limit'))return 'rate_limit';
 if(e?.code==='otp_expired'||e?.code==='otp_disabled')return 'invalid_code';
 if(e?.code?.includes('captcha'))return 'captcha';
 return 'unavailable';
}
