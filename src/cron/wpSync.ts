import { Env } from '../types.ts';

export interface WpSyncResult {
  processed: number;
  successCount: number;
  errors: string[];
}

/**
 * Uploads an image from external URL to WordPress Media Library
 */
export async function uploadWordPressMedia(
  apiUrl: string,
  username: string,
  appPassword: string,
  imageUrl: string,
  title?: string
): Promise<number | null> {
  try {
    const cleanUrl = apiUrl.trim().replace(/\/+$/, '');
    const mediaEndpoint = cleanUrl.endsWith('/posts')
      ? cleanUrl.replace(/\/posts$/, '/media')
      : (cleanUrl.endsWith('/wp/v2') ? `${cleanUrl}/media` : `${cleanUrl}/wp/v2/media`);

    console.log(`[WordPress] Fetching remote image for upload: ${imageUrl}`);
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HazardastanWorker/1.0',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!imgRes.ok) {
      console.warn(`[WordPress] Failed to download image from source: HTTP ${imgRes.status}`);
      return null;
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : (contentType.includes('webp') ? 'webp' : 'jpg');
    const filename = `news-${Date.now()}.${ext}`;
    const imageBlob = await imgRes.arrayBuffer();

    const authHeader = `Basic ${btoa(`${username.trim()}:${appPassword.trim()}`)}`;

    console.log(`[WordPress] Uploading media to ${mediaEndpoint}`);
    const uploadRes = await fetch(mediaEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'User-Agent': 'HazardastanWorker/2.0',
      },
      body: imageBlob,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.warn(`[WordPress] Media upload failed (HTTP ${uploadRes.status}): ${errText.slice(0, 150)}`);
      return null;
    }

    const mediaData: any = await uploadRes.json();
    console.log(`[WordPress] Image uploaded successfully. Media ID: ${mediaData.id}`);
    return mediaData.id || null;
  } catch (err: any) {
    console.error(`[WordPress] Error in uploadWordPressMedia:`, err.message);
    return null;
  }
}

/**
 * Resolves or creates tags in WordPress and returns array of tag IDs
 */
export async function ensureWordPressTags(
  apiUrl: string,
  authHeader: string,
  rawTags?: string[] | string | null
): Promise<number[]> {
  if (!rawTags) return [];

  let tagNames: string[] = [];
  if (Array.isArray(rawTags)) {
    tagNames = rawTags.map(t => String(t).trim()).filter(Boolean);
  } else if (typeof rawTags === 'string') {
    try {
      const parsed = JSON.parse(rawTags);
      if (Array.isArray(parsed)) {
        tagNames = parsed.map(t => String(t).trim()).filter(Boolean);
      } else {
        tagNames = rawTags.split(/[,،]/).map(t => t.trim()).filter(Boolean);
      }
    } catch {
      tagNames = rawTags.split(/[,،]/).map(t => t.trim()).filter(Boolean);
    }
  }

  if (tagNames.length === 0) return [];

  const cleanUrl = apiUrl.trim().replace(/\/+$/, '');
  const tagsEndpoint = cleanUrl.endsWith('/posts')
    ? cleanUrl.replace(/\/posts$/, '/tags')
    : (cleanUrl.endsWith('/wp/v2') ? `${cleanUrl}/tags` : `${cleanUrl}/wp/v2/tags`);

  const tagIds: number[] = [];

  for (const name of tagNames.slice(0, 10)) {
    try {
      // 1. Try to create the tag
      const createRes = await fetch(tagsEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'User-Agent': 'HazardastanWorker/2.0',
        },
        body: JSON.stringify({ name }),
      });

      if (createRes.ok) {
        const created: any = await createRes.json();
        if (created.id) {
          tagIds.push(created.id);
          continue;
        }
      }

      // 2. If tag exists, grab the existing term_id or search for it
      const errJson: any = await createRes.json().catch(() => null);
      if (errJson && errJson.data && errJson.data.term_id) {
        tagIds.push(errJson.data.term_id);
        continue;
      }

      // Search for existing tag
      const searchRes = await fetch(`${tagsEndpoint}?search=${encodeURIComponent(name)}`, {
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'HazardastanWorker/2.0',
        },
      });

      if (searchRes.ok) {
        const foundList: any = await searchRes.json();
        if (Array.isArray(foundList) && foundList.length > 0) {
          const match = foundList.find((t: any) => t.name?.toLowerCase() === name.toLowerCase()) || foundList[0];
          if (match && match.id) {
            tagIds.push(match.id);
          }
        }
      }
    } catch (tagErr: any) {
      console.warn(`[WordPress] Tag resolution failed for "${name}":`, tagErr.message);
    }
  }

  return tagIds;
}

/**
 * Publishes a single translated article to WordPress
 */
export async function distributeToWordPress(
  env: Env,
  translated: {
    article_id: number;
    translation_id?: number;
    title: string;
    content: string;
    summary?: string;
    tags?: string[] | string | null;
    source_url?: string;
    source_name?: string;
    featured_image?: string | null;
  }
): Promise<{ ok: boolean; postId?: string; postUrl?: string; error?: string }> {
  const apiUrl = (env.WP_API_URL || 'https://updaaate.ir/wp-json/wp/v2/').trim();
  const username = (env.WP_USERNAME || '1000dastan').trim();
  const password = (env.WP_APPLICATION_PASSWORD || '').trim();
  const status = env.WP_POST_STATUS || 'publish';
  const categoryId = Number(env.WP_CATEGORY_ID) || 3;

  if (!username || !password) {
    console.warn('[WordPress] Skipping live publish: WP_USERNAME or WP_APPLICATION_PASSWORD not set');
    return { ok: false, error: 'WP credentials not configured' };
  }

  const postsEndpoint = apiUrl.endsWith('/posts') || apiUrl.endsWith('/posts/')
    ? apiUrl
    : `${apiUrl.replace(/\/+$/, '')}/posts`;

  try {
    const authHeader = `Basic ${btoa(`${username}:${password}`)}`;

    // 1. Upload featured image if available
    let featuredMediaId: number | null = null;
    if (translated.featured_image) {
      featuredMediaId = await uploadWordPressMedia(apiUrl, username, password, translated.featured_image, translated.title);
    }

    // 2. Resolve WordPress Tags
    let tagIds: number[] = [];
    if (translated.tags) {
      tagIds = await ensureWordPressTags(apiUrl, authHeader, translated.tags);
    }

    // 3. Format HTML content
    const authorAttribution = translated.source_name || 'Cointelegraph';
    const paragraphs = translated.content
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${p}</p>`)
      .join('\n');

    const formattedHtml = `
<div class="translated-article-container font-vazirmatn text-justify leading-relaxed">
  ${paragraphs}
  <hr class="my-6 border-t border-gray-200" />
  <p class="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
    <strong>منبع اصلی خبر:</strong> ${authorAttribution}
    ${translated.source_url ? ` | <a href="${translated.source_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">مشاهده خبر اصلی</a>` : ''}
  </p>
</div>`.trim();

    // 4. Post to WordPress
    const payload: any = {
      title: translated.title,
      content: formattedHtml,
      excerpt: translated.summary || '',
      status: status,
      categories: [categoryId],
    };

    if (tagIds.length > 0) {
      payload.tags = tagIds;
    }

    if (featuredMediaId) {
      payload.featured_media = featuredMediaId;
    }

    const res = await fetch(postsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'User-Agent': 'HazardastanWorker/2.0',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok && res.status !== 201) {
      const errText = await res.text();
      const errMessage = `WordPress error (HTTP ${res.status}): ${errText.slice(0, 200)}`;
      console.error(errMessage);

      // Log in DB_ARCHIVE / DB
      const targetDb = env.DB_ARCHIVE || env.DB;
      if (targetDb) {
        try {
          await targetDb.prepare(`
            INSERT INTO operation_logs (operation, article_id, status, message, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
          `).bind('wordpress_distribution', translated.article_id, 'failed', errMessage).run();
        } catch {}
      }

      return { ok: false, error: errMessage };
    }

    const postData: any = await res.json();
    const postId = String(postData.id);
    const postUrl = postData.link || `https://updaaate.ir/?p=${postId}`;
    const nowIso = new Date().toISOString();

    console.log(`[WordPress] Successfully published article ID ${translated.article_id} as WP Post ID ${postId} (${postUrl})`);

    // 4. Save to distributions table in D1 Archive (and Primary DB for fallback)
    const targetDb = env.DB_ARCHIVE || env.DB;
    if (targetDb) {
      try {
        await targetDb.prepare(`
          INSERT INTO distributions (article_id, translation_id, platform, platform_post_id, platform_url, status, published_at)
          VALUES (?, ?, ?, ?, ?, 'published', datetime('now'))
        `).bind(
          translated.article_id,
          translated.translation_id || null,
          'wordpress',
          postId,
          postUrl
        ).run();

        await targetDb.prepare(`
          INSERT INTO operation_logs (operation, article_id, status, message, created_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).bind('wordpress_distribution', translated.article_id, 'success', `Published to WP ID ${postId}`).run();
      } catch (distErr: any) {
        console.warn(`[WordPress] Failed to write distribution log to archive DB:`, distErr.message);
      }
    }

    // 5. Update articles table in Primary D1
    if (env.DB) {
      try {
        await env.DB.prepare(`
          UPDATE articles
          SET status = 'published',
              wp_sync_status = 'published',
              wp_post_id = ?,
              wp_published_at = ?
          WHERE id = ?
        `).bind(Number(postId) || null, nowIso, translated.article_id).run();
      } catch {}
    }

    return { ok: true, postId, postUrl };
  } catch (err: any) {
    console.error(`[WordPress] Fatal distribution error:`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Publishes batch of translated articles from Cloudflare D1 to WordPress
 */
export async function wpSyncPublisher(
  env: Env,
  options: { limit?: number; forceArticleId?: number } = {}
): Promise<WpSyncResult> {
  const result: WpSyncResult = { processed: 0, successCount: 0, errors: [] };
  if (!env || !env.DB) {
    result.errors.push('اتصال دیتابیس D1 برقرار نیست.');
    return result;
  }

  const limit = options.limit || 5;

  let query = `
    SELECT 
      articles.id AS article_id,
      articles.title AS original_title,
      articles.link AS original_url,
      articles.featured_image,
      translations.id AS translation_id,
      translations.translated_title,
      translations.translated_content,
      translations.translated_summary
    FROM translations
    JOIN articles ON translations.article_id = articles.id
    WHERE (articles.wp_sync_status IS NULL OR articles.wp_sync_status != 'published')
  `;

  let stmt;
  if (options.forceArticleId) {
    query += ` AND articles.id = ?`;
    stmt = env.DB.prepare(query).bind(options.forceArticleId);
  } else {
    query += ` ORDER BY translations.id DESC LIMIT ?`;
    stmt = env.DB.prepare(query).bind(limit);
  }

  let items: any[] = [];
  try {
    const { results } = await stmt.all();
    items = results || [];
  } catch (err: any) {
    result.errors.push(`خطا در پرس‌وجوی دیتابیس: ${err.message}`);
    return result;
  }

  result.processed = items.length;

  for (const item of items) {
    const pubRes = await distributeToWordPress(env, {
      article_id: item.article_id,
      translation_id: item.translation_id,
      title: item.translated_title || item.original_title,
      content: item.translated_content,
      summary: item.translated_summary,
      source_url: item.original_url,
      featured_image: item.featured_image,
    });

    if (pubRes.ok) {
      result.successCount++;
    } else if (pubRes.error) {
      result.errors.push(pubRes.error);
    }
  }

  return result;
}

/**
 * Test WordPress REST API & Application Passwords connection.
 */
export async function testWordPressConnection(
  apiUrl: string,
  username: string,
  appPassword: string
): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    const cleanUrl = apiUrl.trim();
    const cleanUser = username.trim();
    const cleanPass = appPassword.trim();

    if (!cleanUser || !cleanPass) {
      return {
        success: false,
        message: 'نام کاربری و رمز عبور برنامه‌ای (Application Password) وردپرس الزامی است.',
      };
    }

    let userMeEndpoint = cleanUrl;
    if (userMeEndpoint.endsWith('/posts') || userMeEndpoint.endsWith('/posts/')) {
      userMeEndpoint = userMeEndpoint.replace(/\/posts\/?$/, '/users/me');
    } else {
      userMeEndpoint = `${userMeEndpoint.replace(/\/+$/, '')}/users/me`;
    }
    const authHeader = `Basic ${btoa(`${cleanUser}:${cleanPass}`)}`;

    const response = await fetch(userMeEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'CloudflareWorker-NewsSync/1.0',
      },
    });

    if (response.ok) {
      const userData: any = await response.json();
      return {
        success: true,
        message: `ارتباط با REST API وردپرس با موفقیت برقرار شد. کاربر: ${userData.name || cleanUser} (${userData.slug || ''})`,
        user: userData,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `خطای احراز هویت در وردپرس (کد ${response.status}): ${errorText.slice(0, 200)}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `خطا در برقراری اتصال به وردپرس: ${err.message}`,
    };
  }
}
