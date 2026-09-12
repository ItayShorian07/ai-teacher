'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
export default function AccountLink({lang}:{lang:'he'|'en'}){
 const [signedIn,setSignedIn]=useState(false);
 useEffect(()=>{const controller=new AbortController();fetch('/api/account/status',{cache:'no-store',signal:controller.signal}).then(r=>r.json()).then(data=>setSignedIn(data.signedIn===true)).catch(()=>{});return()=>controller.abort();},[]);
 return <Link className="account-nav-link" href={signedIn?'/account':`/login?lang=${lang}`}><UserRound size={17}/><span>{signedIn?(lang==='he'?'החשבון שלי':'My account'):(lang==='he'?'התחברות':'Sign in')}</span></Link>;
}
