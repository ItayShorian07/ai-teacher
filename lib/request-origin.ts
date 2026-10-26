import {
  appEnvironment,
  resolveSiteOrigin,
  type EnvironmentValues,
} from './environment';

function trustedOrigins(env: EnvironmentValues): Set<string> {
  const origins = new Set([resolveSiteOrigin(env)]);

  if (appEnvironment(env) === 'preview') {
    for (const hostname of [env.VERCEL_BRANCH_URL, env.VERCEL_URL]) {
      if (hostname) {
        origins.add(
          resolveSiteOrigin({
            ...env,
            NEXT_PUBLIC_SITE_URL: `https://${hostname}`,
          }),
        );
      }
    }
  }

  return origins;
}

function localDevelopmentOrigin(
  requestUrl: string,
  env: EnvironmentValues,
): string | null {
  if (appEnvironment(env) !== 'development' || env.NODE_ENV !== 'development')
    return null;

  try {
    return resolveSiteOrigin({
      ...env,
      NEXT_PUBLIC_SITE_URL: new URL(requestUrl).origin,
    });
  } catch {
    return null;
  }
}

export function validRequestOrigin(
  request: Request,
  env: EnvironmentValues,
): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  if (trustedOrigins(env).has(origin)) return true;

  const localOrigin = localDevelopmentOrigin(request.url, env);
  if (!localOrigin) return false;

  try {
    const client = new URL(origin);
    const target = new URL(localOrigin);
    const clientOrigin = resolveSiteOrigin({
      ...env,
      NEXT_PUBLIC_SITE_URL: origin,
    });
    return (
      clientOrigin === client.origin &&
      client.protocol === target.protocol &&
      client.port === target.port
    );
  } catch {
    return false;
  }
}

export function callbackOrigin(
  requestUrl: string,
  env: EnvironmentValues,
): string {
  const origin = new URL(requestUrl).origin;
  if (trustedOrigins(env).has(origin)) return origin;

  // Loopback requests may use another local port during development.
  return localDevelopmentOrigin(requestUrl, env) || resolveSiteOrigin(env);
}
