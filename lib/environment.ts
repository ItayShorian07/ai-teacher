export type EnvironmentValues = Readonly<Record<string, string | undefined>>;

export type AppEnvironment = 'development' | 'preview' | 'production' | 'test';

export interface EnvironmentTargets {
  nonProductionSupabaseUrl: string;
  productionSupabaseUrl: string;
  productionSiteUrl: string;
}

export const serviceVariables = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'GEMINI_API_KEY',
] as const;

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

export function appEnvironment(env: EnvironmentValues): AppEnvironment {
  const environment = env.VERCEL_ENV || env.APP_ENV || 'development';

  if (!['development', 'preview', 'production', 'test'].includes(environment)) {
    throw new Error(
      'APP_ENV must be development, preview, production or test.',
    );
  }

  if (env.VERCEL_ENV && env.APP_ENV && env.APP_ENV !== env.VERCEL_ENV) {
    throw new Error('APP_ENV must match VERCEL_ENV on Vercel.');
  }

  return environment as AppEnvironment;
}

function configuredOrigin(value: string): string {
  const url = new URL(value);
  const isLocal = localHosts.has(url.hostname);

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:'))
  ) {
    throw new Error(
      'Use an HTTPS origin, or an HTTP loopback origin, without a path.',
    );
  }

  return url.origin;
}

export function resolveSiteOrigin(env: EnvironmentValues): string {
  const environment = appEnvironment(env);
  let siteUrl = env.NEXT_PUBLIC_SITE_URL;

  // Preview links must return to the same branch, never to production.
  if (!siteUrl && environment === 'preview') {
    const hostname = env.VERCEL_BRANCH_URL || env.VERCEL_URL;
    if (hostname) siteUrl = `https://${hostname}`;
  }

  if (!siteUrl && ['development', 'test'].includes(environment)) {
    siteUrl = 'http://127.0.0.1:3000';
  }

  if (!siteUrl)
    throw new Error('NEXT_PUBLIC_SITE_URL is required for this environment.');

  const origin = configuredOrigin(siteUrl);
  const isLocal = localHosts.has(new URL(origin).hostname);
  if (['development', 'test'].includes(environment) !== isLocal) {
    throw new Error(
      'Local environments need a loopback site URL; deployments need HTTPS.',
    );
  }

  return origin;
}

export function environmentErrors(
  env: EnvironmentValues,
  targets: EnvironmentTargets,
): string[] {
  let environment: AppEnvironment;
  let siteOrigin: string;

  try {
    environment = appEnvironment(env);
    siteOrigin = resolveSiteOrigin(env);
  } catch {
    return [
      'Invalid environment or site URL. Check APP_ENV, VERCEL_ENV and NEXT_PUBLIC_SITE_URL.',
    ];
  }

  const configuredServices = serviceVariables.filter((name) =>
    env[name]?.trim(),
  );
  if (environment === 'test') {
    return configuredServices.length
      ? [
          'Test builds must not contain service credentials or remote service URLs.',
        ]
      : [];
  }

  // Local demo mode does not need external services.
  if (environment === 'development' && configuredServices.length === 0)
    return [];

  const errors: string[] = [];
  for (const name of serviceVariables) {
    if (!env[name]?.trim()) errors.push(`Missing ${name}.`);
  }

  let nonProductionUrl: string;
  let productionUrl: string;
  let productionSiteUrl: string;
  try {
    nonProductionUrl = configuredOrigin(targets.nonProductionSupabaseUrl);
    productionUrl = configuredOrigin(targets.productionSupabaseUrl);
    productionSiteUrl = configuredOrigin(targets.productionSiteUrl);
    if (
      localHosts.has(new URL(productionUrl).hostname) ||
      localHosts.has(new URL(productionSiteUrl).hostname)
    )
      throw new Error('Production must use remote services.');
  } catch {
    return [
      ...errors,
      'Register both Supabase URLs and the production site URL in config/environments.json.',
    ];
  }

  if (nonProductionUrl === productionUrl) {
    errors.push(
      'Production and non-production must use different Supabase projects.',
    );
  }

  const expectedUrl =
    environment === 'production' ? productionUrl : nonProductionUrl;
  try {
    if (configuredOrigin(env.NEXT_PUBLIC_SUPABASE_URL || '') !== expectedUrl) {
      errors.push(
        'NEXT_PUBLIC_SUPABASE_URL does not match the registered environment.',
      );
    }
  } catch {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid origin.');
  }

  if ((environment === 'production') !== (siteOrigin === productionSiteUrl)) {
    errors.push(
      'The site URL does not match the environment: production and preview must be separate.',
    );
  }

  return errors;
}
