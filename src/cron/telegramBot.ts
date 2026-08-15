import { Env } from '../types';

export interface TelegramNewsPayload {
  chatId?: string;
  botToken?: string;
  title: string;
  content: string;
  tags?: string[];
  sourceUrl?: string;
  imageUrl?: string;
}

export interface TelegramResponse {
  ok: boolean;
  result?: any;
  error_code?: number;
  description?: string;
}

/**
 * Format a news item into an attractive, high-converting Telegram HTML post
 */
export function formatTelegramMessage(payload: {
  title: string;
  content: string;
  tags?: string[];
  sourceUrl?: string;
  channelHandle?: string;
}): string {
  const channel = payload.channelHandle || '@updaaate_crypto';
  const cleanTitle = payload.title.replace(/<[^>]*>/g, '').trim();
  
  // Clean content of HTML tags and shorten to an engaging teaser
  let cleanContent = payload.content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&hellip;/g, '...')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanContent.length > 500) {
    cleanContent = cleanContent.slice(0, 500) + '...';
  }

  // Format hashtags
  let tagsFormatted = '';
  if (payload.tags && payload.tags.length > 0) {
    tagsFormatted = payload.tags
      .map(t => '#' + t.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, ''))
      .filter(t => t.length > 1)
      .join(' ');
  }

  const parts = [
    `⚡️ <b>${cleanTitle}</b>\n`,
    `✍️ ${cleanContent}\n`,
  ];

  if (payload.sourceUrl) {
    parts.push(`🌐 <a href="${payload.sourceUrl}">مطالعه متن کامل در وب‌سایت</a>\n`);
  }

  if (tagsFormatted) {
    parts.push(`🏷 ${tagsFormatted}\n`);
  }

  parts.push(`📢 <b>عضویت در کانال:</b> ${channel} | <i>هزاردستان</i>`);

  return parts.join('\n');
}

/**
 * Send raw text message to Telegram channel/chat
 */
export async function sendTelegramMessage(options: {
  token?: string;
  chatId?: string;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  disable_web_page_preview?: boolean;
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

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: options.text,
        parse_mode: options.parse_mode || 'HTML',
        disable_web_page_preview: options.disable_web_page_preview || false,
      }),
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
 * Send news article to Telegram channel
 */
export async function sendNewsToTelegram(payload: TelegramNewsPayload): Promise<TelegramResponse> {
  const formattedText = formatTelegramMessage({
    title: payload.title,
    content: payload.content,
    tags: payload.tags,
    sourceUrl: payload.sourceUrl,
    channelHandle: payload.chatId || '@updaaate_crypto',
  });

  return await sendTelegramMessage({
    token: payload.botToken,
    chatId: payload.chatId || '@updaaate_crypto',
    text: formattedText,
    parse_mode: 'HTML',
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
    tags?: string[];
    source_url?: string;
  }
): Promise<TelegramResponse> {
  const token = env.TELEGRAM_BOT_TOKEN || (typeof process !== 'undefined' ? process.env.TELEGRAM_BOT_TOKEN : undefined);
  const chatId = env.TELEGRAM_CHAT_ID || (typeof process !== 'undefined' ? process.env.TELEGRAM_CHAT_ID : undefined) || '@updaaate_crypto';

  if (!token) {
    console.warn('[Telegram] Skipping Telegram publish: TELEGRAM_BOT_TOKEN not set');
    return { ok: false, description: 'Telegram token not set' };
  }

  const response = await sendNewsToTelegram({
    botToken: token,
    chatId,
    title: translated.title,
    content: translated.summary || translated.content,
    tags: translated.tags,
    sourceUrl: translated.source_url,
  });

  const targetDb = env.DB_ARCHIVE || env.DB;
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
        response.ok ? `Sent message ID ${messageId}` : response.description
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
  const testText = `🤖 <b>تست اتصال ربات تلگرام ۱۰۰۰ دستان</b>\n\n✅ ارتباط ربات با کانال <code>${chatId}</code> با موفقیت برقرار شد.\n⏰ زمان: ${nowStr}\n🚀 سیستم هوشمند مانیتورینگ و توزیع محتوای ۱۰۰۰ دستان فعال است.`;

  return await sendTelegramMessage({
    token: botToken,
    chatId,
    text: testText,
    parse_mode: 'HTML',
  });
}
