import { Env } from '../types.ts';
import { getSecret } from '../utils/secrets.ts';

export interface TelegramInlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface TelegramNewsPayload {
  chatId?: string;
  botToken?: string;
  title: string;
  content: string;
  tags?: string[] | string | null;
  sourceUrl?: string;
  sitePostUrl?: string;
  imageUrl?: string | null;
  channelHandle?: string;
  replyMarkup?: {
    inline_keyboard: TelegramInlineButton[][];
  };
}

export interface TelegramResponse {
  ok: boolean;
  result?: any;
  error_code?: number;
  description?: string;
}

/**
 * Escapes unsafe HTML characters for Telegram HTML parse_mode
 */
function escapeTelegramHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Format a news item into an attractive, high-converting Telegram HTML post or photo caption
 * strictly linking only to our WordPress website (Updaaate), never external sources.
 */
export function formatTelegramMessage(payload: {
  title: string;
  content: string;
  tags?: string[] | string | null;
  sitePostUrl?: string;
  sourceUrl?: string;
  channelHandle?: string;
  isPhotoCaption?: boolean;
}): string {
  const channel = payload.channelHandle || '@updaaate_crypto';
  const cleanTitle = payload.title.replace(/<[^>]*>/g, '').trim();
  
  // Clean content of HTML tags and entities
  let cleanContent = payload.content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&hellip;/g, '...')
    .replace(/\s+/g, ' ')
    .trim();

  // Caption in Telegram sendPhoto has a strict 1024-character limit
  // Text message in sendMessage has a 4096-character limit
  const maxContentLength = payload.isPhotoCaption ? 520 : 1200;
  if (cleanContent.length > maxContentLength) {
    cleanContent = cleanContent.slice(0, maxContentLength).trim() + '...';
  }

  // Format hashtags
  let tagsFormatted = '';
  let parsedTags: string[] = [];
  if (Array.isArray(payload.tags)) {
    parsedTags = payload.tags;
  } else if (typeof payload.tags === 'string') {
    try {
      parsedTags = JSON.parse(payload.tags);
    } catch {
      parsedTags = payload.tags.split(',').map(t => t.trim());
    }
  }

  if (parsedTags && parsedTags.length > 0) {
    tagsFormatted = parsedTags
      .map(t => '#' + String(t).trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, ''))
      .filter(t => t.length > 1)
      .slice(0, 6)
      .join(' ');
  }

  const parts: string[] = [
    `⚡️ <b>${escapeTelegramHtml(cleanTitle)}</b>\n`,
    `✍️ ${escapeTelegramHtml(cleanContent)}\n`
  ];

  // Only link to our WordPress website (Updaaate), never external source URLs
  const siteUrl = payload.sitePostUrl;
  if (siteUrl && (siteUrl.startsWith('http://') || siteUrl.startsWith('https://'))) {
    parts.push(`🌐 <a href="${escapeTelegramHtml(siteUrl)}">مطالعه متن کامل در وب‌سایت آپدیت</a>\n`);
  }

  if (tagsFormatted) {
    parts.push(`🏷 ${tagsFormatted}\n`);
  }

  parts.push(`📢 <b>عضویت در کانال:</b> ${channel} | <i>رسانه آپدیت</i>`);

  return parts.join('\n');
}

/**
 * Send photo with caption to Telegram channel/chat with optional inline keyboard
 */
export async function sendTelegramPhoto(options: {
  token?: string;
  chatId?: string;
  photo: string;
  caption?: string;
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  reply_markup?: {
    inline_keyboard: TelegramInlineButton[][];
  };
}): Promise<TelegramResponse> {
  const token = options.token || (typeof process !== 'undefined' ? process.env.TELEGRAM_BOT_TOKEN : undefined);
  const chatId = options.chatId || (typeof process !== 'undefined' ? process.env.TELEGRAM_CHAT_ID : undefined) || '@updaaate_crypto';

  if (!token) {
    return {
      ok: false,
      error_code: 400,
      description: 'TELEGRAM_BOT_TOKEN is not configured.'
    };
  }

  const apiUrl = `https://api.telegram.org/bot${token}/sendPhoto`;

  const requestBody: any = {
    chat_id: chatId,
    photo: options.photo,
    caption: options.caption,
    parse_mode: options.parse_mode || 'HTML',
  };

  if (options.reply_markup && options.reply_markup.inline_keyboard && options.reply_markup.inline_keyboard.length > 0) {
    requestBody.reply_markup = options.reply_markup;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: TelegramResponse = await response.json();
    return data;
  } catch (err: any) {
    return {
      ok: false,
      error_code: 500,
      description: `Telegram Photo API network error: ${err.message}`,
    };
  }
}

/**
 * Send raw text message to Telegram channel/chat with optional inline keyboard
 */
export async function sendTelegramMessage(options: {
  token?: string;
  chatId?: string;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  disable_web_page_preview?: boolean;
  reply_markup?: {
    inline_keyboard: TelegramInlineButton[][];
  };
}): Promise<TelegramResponse> {
  const token = options.token || (typeof process !== 'undefined' ? process.env.TELEGRAM_BOT_TOKEN : undefined);
  const chatId = options.chatId || (typeof process !== 'undefined' ? process.env.TELEGRAM_CHAT_ID : undefined) || '@updaaate_crypto';

  if (!token) {
    return {
      ok: false,
      error_code: 400,
      description: 'TELEGRAM_BOT_TOKEN is not configured in environment or parameter.'
    };
  }

  const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  const requestBody: any = {
    chat_id: chatId,
    text: options.text,
    parse_mode: options.parse_mode || 'HTML',
    disable_web_page_preview: options.disable_web_page_preview || false,
  };

  if (options.reply_markup && options.reply_markup.inline_keyboard && options.reply_markup.inline_keyboard.length > 0) {
    requestBody.reply_markup = options.reply_markup;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: TelegramResponse = await response.json();
    return data;
  } catch (err: any) {
    return {
      ok: false,
      error_code: 500,
      description: `Telegram API network error: ${err.message}`,
    };
  }
}

/**
 * Builds an attractive inline keyboard strictly with "مطالعه کامل خبر در وب‌سایت آپدیت"
 */
export function buildTelegramInlineKeyboard(options: {
  sitePostUrl?: string | null;
  sourceUrl?: string | null;
  customButtons?: TelegramInlineButton[][];
}): { inline_keyboard: TelegramInlineButton[][] } | undefined {
  if (options.customButtons && options.customButtons.length > 0) {
    return { inline_keyboard: options.customButtons };
  }

  const keyboard: TelegramInlineButton[][] = [];

  // Exclusive Action Button: "🌐 مطالعه کامل خبر در وب‌سایت آپدیت"
  const targetSiteUrl = options.sitePostUrl;
  if (targetSiteUrl && (targetSiteUrl.startsWith('http://') || targetSiteUrl.startsWith('https://'))) {
    keyboard.push([
      {
        text: '🌐 مطالعه کامل خبر در وب‌سایت آپدیت',
        url: targetSiteUrl,
      }
    ]);
  }

  return keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined;
}

/**
 * Send news article to Telegram channel:
 * If an image URL is present, sends via `sendPhoto` with formatted caption and inline keyboard button.
 * If photo delivery fails (or no image exists), gracefully falls back to text `sendMessage`.
 */
export async function sendNewsToTelegram(payload: TelegramNewsPayload): Promise<TelegramResponse> {
  const token = payload.botToken;
  const chatId = payload.chatId || '@updaaate_crypto';

  // Build inline keyboard strictly for the WordPress website
  const replyMarkup = payload.replyMarkup || buildTelegramInlineKeyboard({
    sitePostUrl: payload.sitePostUrl,
  });

  // Check if image URL is valid and suitable for Telegram Photo API
  const hasValidImage = payload.imageUrl && 
    (payload.imageUrl.startsWith('http://') || payload.imageUrl.startsWith('https://')) &&
    !payload.imageUrl.includes('placeholder') &&
    !payload.imageUrl.endsWith('.svg');

  if (hasValidImage) {
    const caption = formatTelegramMessage({
      title: payload.title,
      content: payload.content,
      tags: payload.tags,
      sitePostUrl: replyMarkup ? undefined : payload.sitePostUrl,
      channelHandle: chatId,
      isPhotoCaption: true,
    });

    console.log(`[Telegram] Dispatching photo post to ${chatId} (Image: ${payload.imageUrl}, HasWPButton: ${!!replyMarkup})`);
    const photoResult = await sendTelegramPhoto({
      token,
      chatId,
      photo: payload.imageUrl!,
      caption,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });

    if (photoResult.ok) {
      return photoResult;
    }

    console.warn(`[Telegram] Photo dispatch failed (${photoResult.description}), falling back to text message.`);
  }

  // Text message fallback or standard text dispatch
  const formattedText = formatTelegramMessage({
    title: payload.title,
    content: payload.content,
    tags: payload.tags,
    sitePostUrl: replyMarkup ? undefined : payload.sitePostUrl,
    channelHandle: chatId,
    isPhotoCaption: false,
  });

  return await sendTelegramMessage({
    token,
    chatId,
    text: formattedText,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

/**
 * Distribute a translated article to Telegram channel and log result to DB Archive.
 * WordPress-First Rule: Ensures article is published to WordPress site first before sending to Telegram.
 */
export async function distributeToTelegram(
  env: Env,
  translated: {
    article_id: number;
    translation_id?: number;
    title: string;
    content: string;
    summary?: string;
    tags?: string[] | string | null;
    source_url?: string;
    site_post_url?: string | null;
    image_url?: string | null;
    featured_image?: string | null;
  }
): Promise<TelegramResponse> {
  const token = await getSecret(env, 'TELEGRAM_BOT_TOKEN', '');
  const chatId = await getSecret(env, 'TELEGRAM_CHAT_ID', '@updaaate_crypto');

  if (!token) {
    console.warn('[Telegram] Skipping Telegram publish: TELEGRAM_BOT_TOKEN not set in environment variables');
    return { ok: false, description: 'Telegram bot token not set in environment variables' };
  }

  // 1. Resolve article image from payload or database
  let resolvedImageUrl = translated.image_url || translated.featured_image || null;
  let resolvedSitePostUrl = translated.site_post_url || null;

  const targetDb = env.DB_ARCHIVE || env.DB;

  // 2. Check if already published to WordPress
  if (!resolvedSitePostUrl && targetDb) {
    try {
      const wpDistRow: any = await targetDb.prepare(
        "SELECT platform_url, platform_post_id FROM distributions WHERE article_id = ? AND platform = 'wordpress' AND status = 'published' ORDER BY id DESC LIMIT 1"
      ).bind(translated.article_id).first();

      if (wpDistRow?.platform_url) {
        resolvedSitePostUrl = wpDistRow.platform_url;
      } else if (wpDistRow?.platform_post_id) {
        resolvedSitePostUrl = `https://updaaate.ir/?p=${wpDistRow.platform_post_id}`;
      }
    } catch {}
  }

  if (!resolvedSitePostUrl || !resolvedImageUrl) {
    if (env.DB) {
      try {
        const artRow: any = await env.DB.prepare('SELECT featured_image, wp_post_id, wp_sync_status, original_url FROM articles WHERE id = ?').bind(translated.article_id).first();
        if (artRow?.featured_image && !resolvedImageUrl) {
          resolvedImageUrl = artRow.featured_image;
        }
        if (artRow?.wp_post_id && artRow?.wp_sync_status === 'published' && !resolvedSitePostUrl) {
          resolvedSitePostUrl = `https://updaaate.ir/?p=${artRow.wp_post_id}`;
        }
      } catch {}
    }
  }

  // 3. WordPress-First Rule Enforcement:
  // If not yet published to WordPress, automatically publish to WordPress first!
  if (!resolvedSitePostUrl) {
    console.log(`[Telegram] Article #${translated.article_id} is not yet published to WordPress. Initiating auto WordPress publication first...`);
    try {
      const { distributeToWordPress } = await import('./wpSync');
      const wpResult = await distributeToWordPress(env, {
        article_id: translated.article_id,
        translation_id: translated.translation_id,
        title: translated.title,
        content: translated.content,
        summary: translated.summary,
        tags: translated.tags,
        source_url: translated.source_url,
        source_name: 'Cointelegraph',
        featured_image: resolvedImageUrl,
      });

      if (wpResult.ok && (wpResult.postUrl || wpResult.postId)) {
        resolvedSitePostUrl = wpResult.postUrl || `https://updaaate.ir/?p=${wpResult.postId}`;
        console.log(`[Telegram] WordPress auto-publish succeeded. Web link: ${resolvedSitePostUrl}`);
      } else {
        const wpError = wpResult.error || 'خطای ناشناخته در ارتباط با وردپرس';
        console.warn(`[Telegram] Aborting Telegram dispatch: WordPress publishing failed (${wpError})`);
        return {
          ok: false,
          description: `ارسال به تلگرام متوقف شد: خبر هنوز در سایت آپدیت منتشر نشده است و انتشار اولیه در وردپرس با خطا مواجه شد (${wpError}).`,
        };
      }
    } catch (wpPublishErr: any) {
      console.error(`[Telegram] Exception during WordPress pre-publication:`, wpPublishErr.message);
      return {
        ok: false,
        description: `ارسال به تلگرام متوقف شد: انتشار اولیه در وردپرس با خطا مواجه شد: ${wpPublishErr.message}`,
      };
    }
  }

  // 4. Send news to Telegram with exclusive link to our WordPress post
  const response = await sendNewsToTelegram({
    botToken: token,
    chatId,
    title: translated.title,
    content: translated.summary || translated.content,
    tags: translated.tags,
    sitePostUrl: resolvedSitePostUrl,
    imageUrl: resolvedImageUrl,
  });

  if (targetDb) {
    try {
      const messageId = response.ok ? String(response.result?.message_id) : null;
      await targetDb.prepare(`
        INSERT INTO distributions (article_id, translation_id, platform, platform_post_id, platform_url, status, published_at, error_message)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
      `).bind(
        translated.article_id,
        translated.translation_id || null,
        'telegram',
        messageId,
        messageId ? `https://t.me/${chatId.replace('@', '')}/${messageId}` : null,
        response.ok ? 'published' : 'failed',
        response.ok ? null : response.description
      ).run();

      await targetDb.prepare(`
        INSERT INTO operation_logs (operation, article_id, status, message, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(
        'telegram_distribution',
        translated.article_id,
        response.ok ? 'success' : 'failed',
        response.ok ? `Sent message ID ${messageId} with Updaaate link` : response.description
      ).run();
    } catch (err: any) {
      console.warn('[Telegram] Failed to log distribution record:', err.message);
    }
  }

  return response;
}

/**
 * Test Bot connection with a simple ping message
 */
export async function testBot(botToken?: string, chatId: string = '@updaaate_crypto'): Promise<TelegramResponse> {
  const nowStr = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
  const testText = `🤖 <b>تست اتصال ربات تلگرام ۱۰۰۰ دستان</b>\n\n✅ ارتباط ربات با کانال <code>${chatId}</code> با موفقیت برقرار شد.\n📸 قابلیت ارسال <b>تصویر شاخص همراه با کپشن (Photo + Caption)</b> فعال است.\n⏰ زمان تست: ${nowStr}\n🚀 سامانه هوشمند مانیتورینگ و توزیع محتوای ۱۰۰۰ دستان آماده به کار است.`;

  return await sendTelegramMessage({
    token: botToken,
    chatId,
    text: testText,
    parse_mode: 'HTML',
  });
}

