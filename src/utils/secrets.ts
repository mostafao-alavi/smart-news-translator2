import { Env } from '../types.ts';

/**
 * Key list of all managed application secrets
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
 * In-memory secrets cache for Worker lifecycle
 */
const secretCache = new Map<string, string>();

/**
 * Safely extracts a secret value from Cloudflare Secrets Store (MY_SEC_STORE)
 */
async function fetchFromSecretsStore(secretsStore: any, key: string): Promise<string | null> {
  if (!secretsStore) return null;

  try {
    // 1. Cloudflare Secrets Store standard get method
    if (typeof secretsStore.get === 'function') {
      const res = await secretsStore.get(key);
      if (res !== null && res !== undefined) {
        if (typeof res === 'string') return res.trim();
        if (typeof res === 'object' && res.value !== undefined) return String(res.value).trim();
        if (typeof res.text === 'function') {
          const txt = await res.text();
          if (txt) return txt.trim();
        }
      }

      // Try lower-case variant
      const lowerKey = key.toLowerCase();
      if (lowerKey !== key) {
        const lowerRes = await secretsStore.get(lowerKey);
        if (lowerRes !== null && lowerRes !== undefined) {
          if (typeof lowerRes === 'string') return lowerRes.trim();
          if (typeof lowerRes === 'object' && lowerRes.value !== undefined) return String(lowerRes.value).trim();
        }
      }
    }

    // 2. Direct property access
    if (secretsStore[key] && typeof secretsStore[key] === 'string') {
      return secretsStore[key].trim();
    }
  } catch (err: any) {
    console.warn(`[Secrets Store] Error reading key "${key}":`, err?.message || err);
  }

  return null;
}

/**
 * Resolves a single secret with multi-tier fallback:
 * Tier 1: Worker runtime `env` variable
 * Tier 2: Cloudflare Secrets Store (`env.MY_SEC_STORE`)
 * Tier 3: Memory Cache
 * Tier 4: Cloudflare KV (`env.CACHE`)
 * Tier 5: Node `process.env` (for local development fallback)
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

  // 3. Cloudflare Secrets Store (MY_SEC_STORE)
  if (env?.MY_SEC_STORE) {
    const storeVal = await fetchFromSecretsStore(env.MY_SEC_STORE, key);
    if (storeVal) {
      secretCache.set(key, storeVal);
      return storeVal;
    }
  }

  // 4. Cloudflare KV cache fallback
  if (env?.CACHE) {
    try {
      const kvVal = await env.CACHE.get(`secret:${key}`) || await env.CACHE.get(key);
      if (kvVal && typeof kvVal === 'string' && kvVal.trim() !== '') {
        secretCache.set(key, kvVal.trim());
        return kvVal.trim();
      }
    } catch {}
  }

  // 5. Node.js process.env fallback (local dev)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    const pVal = process.env[key];
    if (pVal && pVal.trim() !== '') {
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
 * Returns diagnostic metadata about Secrets Store status with masked preview
 */
export async function getSecretsStatus(env: Env): Promise<{
  store_connected: boolean;
  store_binding_name: string;
  secrets_loaded: Record<string, boolean>;
  masked_preview: Record<string, string>;
}> {
  const storeConnected = !!env?.MY_SEC_STORE;
  const secretsLoaded: Record<string, boolean> = {};
  const maskedPreview: Record<string, string> = {};

  for (const key of MANAGED_SECRET_KEYS) {
    const val = await getSecret(env, key);
    const hasVal = !!val && val.length > 0;
    secretsLoaded[key] = hasVal;

    if (hasVal) {
      if (val.length <= 4) {
        maskedPreview[key] = '****';
      } else if (val.startsWith('http://') || val.startsWith('https://')) {
        maskedPreview[key] = val; // URLs are safe to show
      } else {
        const visibleEnd = val.slice(-4);
        maskedPreview[key] = `****${visibleEnd}`;
      }
    } else {
      maskedPreview[key] = 'NOT_SET';
    }
  }

  return {
    store_connected: storeConnected,
    store_binding_name: 'MY_SEC_STORE',
    secrets_loaded: secretsLoaded,
    masked_preview: maskedPreview,
  };
}
