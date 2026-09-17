import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/account-server';
import { botConfigured,hasBotPass } from '@/lib/learning-access';
import VerifyHuman from '@/components/auth/verify-human';
export default async function Verify(){const account=await currentAccount();if(!account)redirect('/');if(!botConfigured()||await hasBotPass(account.user.id))redirect('/classroom');return <VerifyHuman/>;}
