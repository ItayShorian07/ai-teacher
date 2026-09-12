import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, devIndicators: false,
 async headers(){return [
  {source:'/(login|register|account|auth|api/account)/:path*',headers:[{key:'Cache-Control',value:'private, no-store'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Content-Type-Options',value:'nosniff'}]}
 ];} };
export default config;
