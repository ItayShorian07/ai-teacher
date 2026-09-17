'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
export default function ThemeToggle({lang='he'}:{lang?:'he'|'en'}) {
 const [dark,setDark]=useState(false);
 useEffect(()=>{setDark(document.documentElement.dataset.theme==='dark');},[]);
 function toggle(){const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';try{localStorage.setItem('limud-theme',next?'dark':'light');}catch{}}
 const label=lang==='he'?(dark?'מעבר למצב בהיר':'מעבר למצב כהה'):(dark?'Switch to light mode':'Switch to dark mode');
 return <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button>;
}
