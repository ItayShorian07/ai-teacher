export type AppEnvironment = 'development' | 'preview' | 'production' | 'test';
export type DataEnvironment = 'development' | 'production';

type EnvironmentPair = {
  appEnvironment: string | undefined;
  dataEnvironment: string | undefined;
  configured: boolean;
};

const appEnvironments = new Set<AppEnvironment>(['development', 'preview', 'production', 'test']);
const dataEnvironments = new Set<DataEnvironment>(['development', 'production']);

export function assertEnvironmentPair({ appEnvironment, dataEnvironment, configured }: EnvironmentPair) {
  if (!configured) return;
  if (!appEnvironment || !appEnvironments.has(appEnvironment as AppEnvironment)) {
    throw new Error('INVALID_APP_ENVIRONMENT');
  }
  if (!dataEnvironment || !dataEnvironments.has(dataEnvironment as DataEnvironment)) {
    throw new Error('INVALID_DATA_ENVIRONMENT');
  }

  const expectsProductionData = appEnvironment === 'production';
  if (expectsProductionData !== (dataEnvironment === 'production')) {
    throw new Error('ENVIRONMENT_DATA_MISMATCH');
  }
}

export function currentAppEnvironment(): AppEnvironment {
  const configured = process.env.NEXT_PUBLIC_APP_ENV;
  const vercel = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;
  const value = configured ?? vercel ?? (process.env.NODE_ENV === 'test' ? 'test' : 'development');
  return appEnvironments.has(value as AppEnvironment) ? value as AppEnvironment : 'development';
}

type OriginOptions = {
  appEnvironment: AppEnvironment;
  requestOrigin?: string;
  siteUrl?: string;
  vercelUrls?: Array<string | undefined>;
};

function originOf(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}

export function resolveDeploymentOrigin({ appEnvironment, requestOrigin, siteUrl, vercelUrls = [] }: OriginOptions) {
  if (appEnvironment === 'production') {
    const production = originOf(siteUrl);
    if (!production) throw new Error('INVALID_SITE_URL');
    return production;
  }

  if (appEnvironment === 'preview') {
    const allowed = new Set(vercelUrls.map(originOf).filter((value): value is string => Boolean(value)));
    const request = originOf(requestOrigin);
    if (request && allowed.has(request)) return request;
    const fallback = allowed.values().next().value as string | undefined;
    if (fallback) return fallback;
    throw new Error('INVALID_PREVIEW_ORIGIN');
  }

  const local = originOf(requestOrigin) ?? originOf(siteUrl) ?? 'http://127.0.0.1:3000';
  const hostname = new URL(local).hostname;
  if (!['localhost', '127.0.0.1'].includes(hostname)) throw new Error('INVALID_DEVELOPMENT_ORIGIN');
  return local;
}

export function deploymentOrigin(requestOrigin?: string) {
  return resolveDeploymentOrigin({
    appEnvironment: currentAppEnvironment(),
    requestOrigin,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    // Preview aliases are the only accepted cross-request origins.
    vercelUrls: [
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.NEXT_PUBLIC_VERCEL_URL,
      process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL,
    ],
  });
}
