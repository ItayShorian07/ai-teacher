'use client';
import { createBrowserClient } from '@supabase/ssr';
import { authConfig } from './config';
export function browserSupabase(){const {url,key}=authConfig();return createBrowserClient(url,key);}
