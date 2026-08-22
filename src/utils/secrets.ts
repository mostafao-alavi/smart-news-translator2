import { Env } from '../types.ts';

/**
 * Key list of all managed application secrets and environment variables
 */
export const MANAGED_SECRET_KEYS = [
  'WP_API_URL',
  'WP_USERNAME',
  'WP_APPLICATION_PASSWORD',
  'WP_POST_STATUS',
  'WP_CATEGORY_ID',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'TELEGRAM_ADMIN_ID',
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'ADMIN_SECRET'
] as const;

export type ManagedSecretKey = typeof MANAGED_SECRET_KEYS[number];

/**
 * In-memory cache for runtime secret resolution
 */
const secretCache = new Map<string, string>();

/**
 * Resolves a single secret from standard environment variables:
 * 1. Worker/Server runtime `env` variable
 * 2. In-memory cache
 * 3. Node.js `process.env`
 */
export async function getSecret(env: Env, key: string, fallback: string = ''): Promise<string> {
  // 1. Direct env variable
  const directVal = (env as any)?.[key];
  if (directVal && typeof directVal === 'string' && directVal.trim() !== '') {
    return directVal.trim();
  }

  // 2. Memory Cache
  if (secretCache.has(key)) {
    const cached = secretCache.get(key);
    if (cached) return cached;
  }

  // 3. Node.js process.env fallback
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    const pVal = process.env[key];
    if (pVal && pVal.trim() !== '') {
      secretCache.set(key, pVal.trim());
      return pVal.trim();
    }
  }

  return fallback;
}

/**
 * Automatically hydrates all managed secrets into the `env` object
 * ensuring all subsequent services receive clean, resolved credentials.
 */
export async function hydrateEnvWithSecrets(env: Env): Promise<Env> {
  if (!env) return env;

  for (const key of MANAGED_SECRET_KEYS) {
    const val = await getSecret(env, key);
    if (val && !(env as any)[key]) {
      (env as any)[key] = val;
    }
  }

  return env;
}

/**
 * Returns diagnostic metadata about environment secrets status with masked preview
 */
export async function getSecretsStatus(env: Env): Promise<{
  store_connected: boolean;
  store_binding_name: string;
  secrets_loaded: Record<string, boolean>;
  masked_preview: Record<string, string>;
  secrets: Record<string, { isSet: boolean; maskedValue: string; source: string }>;
}> {
  const secretsLoaded: Record<string, boolean> = {};
  const maskedPreview: Record<string, string> = {};
  const secretsDetail: Record<string, { isSet: boolean; maskedValue: string; source: string }> = {};

  for (const key of MANAGED_SECRET_KEYS) {
    const val = await getSecret(env, key);
    const hasVal = !!val && val.length > 0;
    secretsLoaded[key] = hasVal;

    let masked = '—';
    let source = 'none';

    if ((env as any)?.[key]) {
      source = 'environment';
    } else if (typeof process !== 'undefined' && process.env?.[key]) {
      source = 'process.env';
    }

    if (hasVal) {
      if (val.length <= 4) {
        masked = '****';
      } else if (val.startsWith('http://') || val.startsWith('https://')) {
        masked = val; // URLs are safe to show
      } else {
        const visibleEnd = val.slice(-4);
        masked = `****${visibleEnd}`;
      }
      maskedPreview[key] = masked;
    } else {
      maskedPreview[key] = 'NOT_SET';
    }

    secretsDetail[key] = {
      isSet: hasVal,
      maskedValue: masked,
      source: source,
    };
  }

  return {
    store_connected: true,
    store_binding_name: 'ENV_VARS',
    secrets_loaded: secretsLoaded,
    masked_preview: maskedPreview,
    secrets: secretsDetail,
  };
}
