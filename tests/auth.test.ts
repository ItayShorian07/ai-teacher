import test from 'node:test';
import assert from 'node:assert/strict';
import { profileSchema,normalizePhone,accountComplete,emailSchema,otpSchema } from '../lib/auth-validation';
const profile={first_name:'נועה',last_name:'לוי',city:'חיפה',age:14,phone:'+972501234567',locale:'he'};
const user={email:'student@example.test',email_confirmed_at:'2026-09-12',phone:'972501234567',phone_confirmed_at:'2026-09-12'};
test('Israeli phone formats canonicalize without losing international support',()=>{
 for(const phone of ['050-123-4567','050 123 4567','972501234567','+972 (50) 123-4567'])assert.equal(normalizePhone(phone),profile.phone);
 assert.equal(normalizePhone('+1 415 555 0123'),'+14155550123');
});
test('registration validates required fields and strips whitespace',()=>{
 assert.equal(profileSchema.parse({...profile,first_name:' נועה ',age:'14',phone:'0501234567'}).first_name,'נועה');
 for(const invalid of [{first_name:''},{last_name:''},{city:''},{age:0},{age:121},{age:14.5},{phone:'123'},{locale:'xx'},{verified:true},{role:'admin'},{id:'another-user'}])assert.equal(profileSchema.safeParse({...profile,...invalid}).success,false,JSON.stringify(invalid));
 assert.equal(emailSchema.safeParse('not-an-email').success,false);assert.equal(otpSchema.safeParse('abc123').success,false);assert.equal(otpSchema.safeParse('123456').success,true);
});
test('completion requires BOTH trusted auth channels and a complete profile',()=>{
 assert.equal(accountComplete(user,profile),true);
 assert.equal(accountComplete({...user,email_confirmed_at:null},profile),false);
 assert.equal(accountComplete({...user,phone_confirmed_at:null},profile),false);
 assert.equal(accountComplete({...user,phone:'972509999999'},profile),false);
 assert.equal(accountComplete(user,null),false);
 assert.equal(accountComplete(user,{...profile,city:''}),false);
 // Generic confirmation or editable metadata never substitutes for channel verification.
 const spoof={email:user.email,phone:user.phone,confirmed_at:'today',user_metadata:{email_verified:true,phone_verified:true,complete:true}};
 assert.equal(accountComplete(spoof,profile),false);
});
test('a previously verified phone cannot verify a newly requested phone',()=>{
 assert.equal(accountComplete(user,{...profile,phone:'+972509999999'}),false);
 assert.equal(accountComplete({...user,phone:'+972509999999'}, {...profile,phone:'+972509999999'}),true);
});

test('an SMS verification session for another account cannot complete onboarding',()=>{
 const changedSession={...user,id:'different-account'};
 assert.equal(accountComplete(changedSession,profile,'original-account'),false);
 assert.equal(accountComplete({...user,id:'original-account'},profile,'original-account'),true);
});
