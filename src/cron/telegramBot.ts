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
 */
export function formatTelegramMessage(payload: {
  title: string;
  content: string;
  tags?: string[] | string | null;
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

  if (payload.sourceUrl && (payload.sourceUrl.startsWith('http://') || payload.sourceUrl.startsWith('https://'))) {
    parts.push(`🌐 <a href="${escapeTelegramHtml(payload.sourceUrl)}">مطالعه متن کامل در وب‌سایت</a>\n`);
  }

  if (tagsFormatted) {
    parts.push(`🏷 ${tagsFormatted}\n`);
  }

  parts.push(`📢 <b>عضویت در کانال:</b> ${channel} | <i>هزاردستان</i>`);

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
 * Builds an attractive inline keyboard with "مطالعه متن کامل در وب‌سایت" and optional source links
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

  // Primary Action Button: "مطالعه متن کامل در وب‌سایت"
  const targetSiteUrl = options.sitePostUrl || options.sourceUrl;
  if (targetSiteUrl && (targetSiteUrl.startsWith('http://') || targetSiteUrl.startsWith('https://'))) {
    keyboard.push([
      {
        text: '🌐 مطالعه متن کامل در وب‌سایت',
        url: targetSiteUrl,
      }
    ]);
  }

  // Secondary Row (if both site URL and original external source exist and differ)
  if (options.sitePostUrl && options.sourceUrl && options.sitePostUrl !== options.sourceUrl) {
    if (options.sourceUrl.startsWith('http://') || options.sourceUrl.startsWith('https://')) {
      keyboard.push([
        {
          text: '📑 منبع اصلی خبر',
          url: options.sourceUrl,
        }
      ]);
    }
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

  // Build inline keyboard (e.g. "مطالعه متن کامل در وب‌سایت")
  const replyMarkup = payload.replyMarkup || buildTelegramInlineKeyboard({
    sitePostUrl: payload.sitePostUrl,
    sourceUrl: payload.sourceUrl,
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
      sourceUrl: replyMarkup ? undefined : payload.sourceUrl, // If inline button exists, no need to duplicate link inside caption
      channelHandle: chatId,
      isPhotoCaption: true,
    });

    console.log(`[Telegram] Dispatching photo post to ${chatId} (Image: ${payload.imageUrl}, HasButton: ${!!replyMarkup})`);
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
    sourceUrl: replyMarkup ? undefined : payload.sourceUrl,
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
 * Distribute a translated article to Telegram channel and log result to DB Archive
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

  // Resolve article image and WordPress website URL from payload or database
  let resolvedImageUrl = translated.image_url || translated.featured_image || null;
  let resolvedSitePostUrl = translated.site_post_url || null;

  const targetDb = env.DB_ARCHIVE || env.DB;

  if (targetDb) {
    try {
      // Look up if this article has already been published to WordPress to get the direct post URL
      const wpDistRow: any = await targetDb.prepare(
        "SELECT platform_url, platform_post_id FROM distributions WHERE article_id = ? AND platform = 'wordpress' AND status = 'published' ORDER BY id DESC LIMIT 1"
      ).bind(translated.article_id).first();

      if (wpDistRow?.platform_url) {
        resolvedSitePostUrl = wpDistRow.platform_url;
      }
    } catch {}
  }

  if (!resolvedImageUrl || !resolvedSitePostUrl) {
    if (env.DB) {
      try {
        const artRow: any = await env.DB.prepare('SELECT featured_image, wp_post_id, wp_sync_status, original_url FROM articles WHERE id = ?').bind(translated.article_id).first();
        if (artRow?.featured_image && !resolvedImageUrl) {
          resolvedImageUrl = artRow.featured_image;
        }
        if (artRow?.wp_post_id && !resolvedSitePostUrl) {
          resolvedSitePostUrl = `https://updaaate.ir/?p=${artRow.wp_post_id}`;
        }
      } catch {}
    }
  }

  if (!resolvedImageUrl && env.DB_ARCHIVE) {
    try {
      const artRow: any = await env.DB_ARCHIVE.prepare('SELECT featured_image, wp_post_id FROM articles WHERE id = ?').bind(translated.article_id).first();
      if (artRow?.featured_image) {
        resolvedImageUrl = artRow.featured_image;
      }
      if (artRow?.wp_post_id && !resolvedSitePostUrl) {
        resolvedSitePostUrl = `https://updaaate.ir/?p=${artRow.wp_post_id}`;
      }
    } catch {}
  }

  const response = await sendNewsToTelegram({
    botToken: token,
    chatId,
    title: translated.title,
    content: translated.summary || translated.content,
    tags: translated.tags,
    sourceUrl: translated.source_url,
    sitePostUrl: resolvedSitePostUrl || undefined,
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
        response.ok ? `Sent message ID ${messageId} (Photo+Caption)` : response.description
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

