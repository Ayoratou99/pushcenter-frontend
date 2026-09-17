/**
 * Reads the runtime configuration injected by `public/config.js` (rewritten by
 * the Docker entrypoint), falling back to the build-time VITE_* variables and
 * finally to local development defaults.
 */
type RuntimeConfig = {
  API_BASE_URL?: string;
  API_TIMEOUT?: string;
  APP_NAME?: string;
  APP_VERSION?: string;
  FACEBOOK_APP_ID?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

const runtime: RuntimeConfig = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};

/** Runtime value first, then the build-time one, then the default. */
function read(runtimeKey: keyof RuntimeConfig, buildValue: unknown, fallback: string): string {
  const value = runtime[runtimeKey];

  if (value !== undefined && value !== null && value !== '') {
    return String(value);
  }

  if (buildValue !== undefined && buildValue !== null && buildValue !== '') {
    return String(buildValue);
  }

  return fallback;
}

const apiBaseUrl = read('API_BASE_URL', import.meta.env.VITE_API_BASE_URL, 'http://localhost:8000/api/v1');

export const ENV_CONFIG = {
  apiBaseUrl,
  api: {
    baseUrl: apiBaseUrl,
    timeout: Number(read('API_TIMEOUT', import.meta.env.VITE_API_TIMEOUT, '30000')) || 30000,
  },
  app: {
    name: read('APP_NAME', import.meta.env.VITE_APP_NAME, 'AninfPush Management'),
    version: read('APP_VERSION', import.meta.env.VITE_APP_VERSION, '1.0.0'),
  },
  facebookAppId: read('FACEBOOK_APP_ID', import.meta.env.VITE_FACEBOOK_APP_ID, ''),
};
