import type { NextConfig } from 'next';
import environmentTargets from './config/environments.json';
import { environmentErrors } from './lib/environment';

const errors = environmentErrors(process.env, environmentTargets);
if (errors.length) {
  throw new Error(
    `Environment check failed:\n${errors.join('\n')}\nSee docs/WORKFLOW.he.md.`,
  );
}

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source:
          '/(login|register|forgot-password|account|auth|api/account|api/auth)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};
export default config;
