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
 * Safely extracts a secret value from Cloudflare Secrets Store (MY_SEC_STORE, SECRETS, SECRETS_STORE)
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
 * Tier 1: Worker runtime `env` variable or direct binding from `secrets_store_secrets`
 * Tier 2: Cloudflare Secrets Store (`env.MY_SEC_STORE`, `env.SECRETS`, `env.SECRETS_STORE`)
 * Tier 3: Memory Cache
 * Tier 4: Cloudflare KV (`env.CACHE`)
 * Tier 5: Node `process.env` (for local development fallback)
 */
export async function getSecret(env: Env, key: string, fallback: string = ''): Promise<string> {
  // 1. Direct env variable or direct secrets binding
  const directVal = (env as any)?.[key];
  if (directVal && typeof directVal === 'string' && directVal.trim() !== '') {
    return directVal.trim();
  } else if (directVal && typeof directVal === 'object') {
    if (typeof directVal.get === 'function') {
      const val = await directVal.get(key) || await directVal.get();
      if (val) return typeof val === 'string' ? val.trim() : (val.value ? String(val.value).trim() : '');
    } else if (directVal.value) {
      return String(directVal.value).trim();
    }
  }

  // 2. Memory Cache
  if (secretCache.has(key)) {
    const cached = secretCache.get(key);
    if (cached) return cached;
  }

  // 3. Cloudflare Secrets Store (MY_SEC_STORE, SECRETS, SECRETS_STORE)
  const storeInstance = env?.MY_SEC_STORE || env?.SECRETS || env?.SECRETS_STORE;
  if (storeInstance) {
    const storeVal = await fetchFromSecretsStore(storeInstance, key);
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
  const storeConnected = !!(env?.MY_SEC_STORE || env?.SECRETS || env?.SECRETS_STORE);
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
    store_binding_name: env?.SECRETS ? 'SECRETS' : (env?.SECRETS_STORE ? 'SECRETS_STORE' : 'MY_SEC_STORE'),
    secrets_loaded: secretsLoaded,
    masked_preview: maskedPreview,
  };
}
/**
 * Verifies if a secret has the required scope (e.g., 'workers') for Cloudflare Workers consumption.
 * According to Cloudflare Secrets Store Access Control docs:
 * Deploying a Worker with a secret binding requires both:
 * 1. Account Secrets Store Edit permission
 * 2. The secret's scope list must include 'workers'
 */
export function hasWorkerScope(scopes?: string[]): boolean {
  if (!scopes || !Array.isArray(scopes)) return true; // optimistic default
  return scopes.includes('workers');
}

/**
 * Cloudflare API v4 Client for Secrets Store
 */
export async function callCloudflareSecretsStoreAPI<T = any>(
  accountId: string,
  apiToken: string,
  path: string,
  init?: RequestInit
): Promise<{ success: boolean; result?: T; errors?: any[]; messages?: any[]; result_info?: any }> {
  if (!accountId || !apiToken) {
    return { success: false, errors: [{ message: 'Cloudflare Account ID and API Token are required.' }] };
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/secrets_store${cleanPath}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });

    const data = (await response.json()) as any;
    return data;
  } catch (err: any) {
    return {
      success: false,
      errors: [{ message: err?.message || 'Network error calling Cloudflare Secrets Store API' }],
    };
  }
}

/**
 * Lists all Secrets Stores in a Cloudflare account
 */
export async function listCloudflareStores(accountId: string, apiToken: string) {
  return callCloudflareSecretsStoreAPI(accountId, apiToken, '/stores');
}

/**
 * Lists secrets inside a specific Secrets Store with their scopes and status
 */
export async function listStoreSecrets(accountId: string, storeId: string, apiToken: string) {
  return callCloudflareSecretsStoreAPI(accountId, apiToken, `/stores/${storeId}/secrets`);
}

/**
 * Fetches Secrets Store quota and current usage for the account
 */
export async function getSecretsStoreQuota(accountId: string, apiToken: string) {
  return callCloudflareSecretsStoreAPI(accountId, apiToken, '/quota');
}

