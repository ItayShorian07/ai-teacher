export type EnvironmentValues = Readonly<Record<string, string | undefined>>;
export type AppEnvironment = 'development' | 'preview' | 'production' | 'test';
type DataEnvironment = 'development' | 'production';

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

const appEnvironments = new Set([
  'development',
  'preview',
  'production',
  'test',
]);
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const turnstileTestKeys = new Set([
  '1x00000000000000000000AA',
  '2x00000000000000000000AB',
  '1x00000000000000000000BB',
  '2x00000000000000000000BB',
  '3x00000000000000000000FF',
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
]);

function parseEnvironment(
  value: string | undefined,
): AppEnvironment | undefined {
  if (!value) return undefined;
  if (!appEnvironments.has(value))
    throw new Error('Invalid application environment.');
  return value as AppEnvironment;
}

function sameEnvironmentRole(first: AppEnvironment, second: AppEnvironment) {
  if (first === 'test' || second === 'test') return first === second;
  return (first === 'production') === (second === 'production');
}

export function appEnvironment(env: EnvironmentValues): AppEnvironment {
  const declared = parseEnvironment(env.NEXT_PUBLIC_APP_ENV);
  const legacy = parseEnvironment(env.APP_ENV);
  const platform = parseEnvironment(
    env.VERCEL_ENV || env.NEXT_PUBLIC_VERCEL_ENV,
  );
  if (declared && legacy && !sameEnvironmentRole(declared, legacy)) {
    throw new Error(
      'NEXT_PUBLIC_APP_ENV and APP_ENV disagree. Remove the legacy APP_ENV value.',
    );
  }
  const configured = declared || legacy;
  if (
    platform &&
    (platform === 'test' ||
      (configured && !sameEnvironmentRole(platform, configured)))
  ) {
    throw new Error(
      'The declared application environment does not match Vercel.',
    );
  }
  // Hosted development still runs as a Vercel Preview deployment.
  return (
    platform || configured || (env.NODE_ENV === 'test' ? 'test' : 'development')
  );
}

function configuredOrigin(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Use a valid HTTPS origin, or an HTTP loopback origin.');
  }
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
  if (!siteUrl && environment === 'preview') {
    const hostname =
      env.VERCEL_BRANCH_URL ||
      env.NEXT_PUBLIC_VERCEL_BRANCH_URL ||
      env.VERCEL_URL ||
      env.NEXT_PUBLIC_VERCEL_URL;
    if (hostname) siteUrl = `https://${hostname}`;
  }
  if (!siteUrl && ['development', 'test'].includes(environment))
    siteUrl = 'http://127.0.0.1:3000';
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

export function assertSupabaseTarget(
  env: EnvironmentValues,
  targets: EnvironmentTargets,
) {
  if (!env.NEXT_PUBLIC_APP_ENV) throw new Error('Missing NEXT_PUBLIC_APP_ENV.');
  const environment = appEnvironment(env);
  const expectedData: DataEnvironment =
    environment === 'production' ? 'production' : 'development';
  if (env.NEXT_PUBLIC_SUPABASE_ENV !== expectedData) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ENV must match the application environment.',
    );
  }
  let nonProductionUrl: string;
  let productionUrl: string;
  try {
    nonProductionUrl = configuredOrigin(targets.nonProductionSupabaseUrl);
    productionUrl = configuredOrigin(targets.productionSupabaseUrl);
  } catch {
    throw new Error(
      'Register valid Supabase URLs in config/environments.json.',
    );
  }
  if (
    nonProductionUrl === productionUrl ||
    localHosts.has(new URL(productionUrl).hostname)
  ) {
    throw new Error(
      'Production and non-production must use different Supabase projects.',
    );
  }
  const expectedUrl =
    environment === 'production' ? productionUrl : nonProductionUrl;
  if (configuredOrigin(env.NEXT_PUBLIC_SUPABASE_URL || '') !== expectedUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL does not match the registered environment.',
    );
  }
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
      'Invalid environment or site URL. Check NEXT_PUBLIC_APP_ENV, VERCEL_ENV and NEXT_PUBLIC_SITE_URL.',
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
  if (environment === 'development' && configuredServices.length === 0)
    return [];

  const errors: string[] = [];
  for (const name of serviceVariables)
    if (!env[name]?.trim()) errors.push(`Missing ${name}.`);
  try {
    assertSupabaseTarget(env, targets);
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : 'Invalid Supabase environment.',
    );
  }
  try {
    const productionOrigin = configuredOrigin(targets.productionSiteUrl);
    if (
      localHosts.has(new URL(productionOrigin).hostname) ||
      (environment === 'production') !== (siteOrigin === productionOrigin)
    ) {
      errors.push('The site URL does not match the registered environment.');
    }
  } catch {
    errors.push(
      'Register a valid production site URL in config/environments.json.',
    );
  }
  if (
    environment === 'production' &&
    [env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, env.TURNSTILE_SECRET_KEY].some(
      (key) => key && turnstileTestKeys.has(key),
    )
  ) {
    errors.push('Turnstile test keys cannot be used in production.');
  }
  return errors;
}
