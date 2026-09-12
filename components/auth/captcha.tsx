'use client';
import Script from 'next/script';
import { useEffect,useRef,useState } from 'react';
type Turnstile={render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
export function Captcha({onToken,resetKey}:{onToken:(token:string)=>void;resetKey:number}){
 const host=useRef<HTMLDivElement>(null);const [ready,setReady]=useState(false);
 const sitekey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
 useEffect(()=>{const api=(window as Window&{turnstile?:Turnstile}).turnstile;if(!ready||!host.current||!api||!sitekey)return;
  const id=api.render(host.current,{sitekey,theme:'light',size:'flexible',callback:(token:string)=>onToken(token),'expired-callback':()=>onToken(''),'error-callback':()=>onToken('')});return()=>{api.remove(id);};
 },[ready,resetKey,sitekey,onToken]);
 if(!sitekey)return null;
 return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={()=>setReady(true)}/><div className="auth-captcha" ref={host}/></>;
}
