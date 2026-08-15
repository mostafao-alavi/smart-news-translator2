import { Env, Article, SeoMetadata } from '../types';
import { GoogleGenAI } from '@google/genai';

export interface TranslationResult {
  translatedText: string;
  modelUsed: string;
}

export interface SeoMetadataResult {
  suggested_titles: string[];
  tags: string[];
  meta_description: string;
  modelUsed?: string;
}

/**
 * Indic Languages code mapping for @cf/ai4bharat/indictrans2-en-indic-1B
 */
const INDIC_LANG_MAP: Record<string, string> = {
  hi: 'hin_Deva',
  hindi: 'hin_Deva',
  bn: 'ben_Beng',
  bengali: 'ben_Beng',
  ta: 'tam_Taml',
  tamil: 'tam_Taml',
  te: 'tel_Telu',
  telugu: 'tel_Telu',
  mr: 'mar_Deva',
  marathi: 'mar_Deva',
  gu: 'guj_Gujr',
  gujarati: 'guj_Gujr',
  kn: 'kan_Knda',
  kannada: 'kan_Knda',
  ml: 'mal_Mlym',
  malayalam: 'mal_Mlym',
  pa: 'pan_Guru',
  punjabi: 'pan_Guru',
};

/**
 * M2M100 code mapping for @cf/meta/m2m100-1.2b
 */
const M2M_LANG_MAP: Record<string, string> = {
  persian: 'fa',
  farsi: 'fa',
  fa: 'fa',
  english: 'en',
  en: 'en',
  arabic: 'ar',
  ar: 'ar',
  french: 'fr',
  fr: 'fr',
  german: 'de',
  de: 'de',
  spanish: 'es',
  es: 'es',
  russian: 'ru',
  ru: 'ru',
  turkish: 'tr',
  tr: 'tr',
};

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(apiKey?: string): GoogleGenAI | null {
  const key = apiKey || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
  if (!key) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: key });
  }
  return geminiClient;
}

/**
 * Model Router Selection based on target language
 */
function selectTranslationModel(targetLang: string) {
  const norm = targetLang.toLowerCase().trim();
  
  // Check if target is an Indic language -> route to @cf/ai4bharat/indictrans2-en-indic-1B
  if (norm in INDIC_LANG_MAP) {
    return {
      model: '@cf/ai4bharat/indictrans2-en-indic-1B',
      sourceCode: 'eng_Latn',
      targetCode: INDIC_LANG_MAP[norm],
      isIndic: true,
    };
  }

  // Default to @cf/meta/m2m100-1.2b for multi-lingual general translation (e.g. English -> Persian)
  return {
    model: '@cf/meta/m2m100-1.2b',
    sourceCode: 'en',
    targetCode: M2M_LANG_MAP[norm] || norm || 'fa',
    isIndic: false,
  };
}

/**
 * STAGE 1: High-Quality Journalistic Translation
 * Translates English text to fluent, idiomatic Persian using Gemini / Workers AI.
 */
export async function translateTextWithAI(
  env: Env, 
  text: string, 
  sourceLang: string = 'english', 
  targetLang: string = 'persian',
  preferredModel?: string
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return { translatedText: '', modelUsed: 'none' };
  }

  const truncatedText = text.slice(0, 4000);
  const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
  const isGeminiRequested = preferredModel === 'gemini-3.7-flash' || preferredModel === 'gemini-2.5-flash' || preferredModel === 'gemini-flash-latest' || !preferredModel;

  const translationPrompt = `شما یک مترجم ارشد و روزنامه‌نگار حرفه‌ای در حوزه فناوری، بازارهای مالی و ارز دیجیتال برای رسانه معتبر «هزاردستان» هستید.
متن انگلیسی زیر را به زبان فارسی روان، سلیس و با لحن ژورنالیستی و جذاب ترجمه کنید.

دستورالعمل‌های الزامی:
۱. اصطلاحات تخصصی حوزه تکنولوژی، رمزارز و اقتصاد را به صورت دقیق و مصطلح در رسانه‌های معتبر ترجمه کنید (مثلاً: Staking -> استیکینگ / سپرده‌گذاری، Liquidity Pool -> استخر نقدینگی، Bear Market -> بازار خرسی / نزولی، Yield Farming -> کشت سود، Serverless -> بدون سرور، Proof of Stake -> اثبات سهام، Hedge Fund -> صندوق پوشش ریسک، Cash Flow -> جریان نقدی).
۲. از ترجمه تحت‌اللفظی و نامفهوم اکیداً پرهیز کنید؛ جملات باید ساختار دستوری طبیعی و فاخر زبان فارسی داشته باشند.
۳. کلیه قالب‌بندی‌های Markdown، لینک‌ها، عناوین و بولت‌پوینت‌ها را عیناً حفظ کنید.
۴. خروجی باید صرفاً متن ترجمه شده به فارسی باشد، بدون هیچ‌گونه مقدمه، توضیح اضافه، یا علامت نقل‌قول انگلیسی.

متن اصلی انگلیسی:
${truncatedText}`;

  // 1. Try Gemini API first (via GoogleGenAI SDK or direct HTTP)
  if (apiKey && (isGeminiRequested || !env.AI)) {
    try {
      const ai = getGeminiClient(apiKey);
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: translationPrompt,
        });
        const translated = response?.text?.trim();
        if (translated) {
          return { translatedText: translated, modelUsed: 'gemini-3.7-flash' };
        }
      }
    } catch (sdkErr) {
      console.warn('Gemini SDK translation failed, falling back to HTTP:', sdkErr);
    }

    // Direct HTTP fetch fallback for Gemini
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: translationPrompt }]
          }]
        })
      });

      if (response.ok) {
        const json: any = await response.json();
        const translated = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) {
          return { translatedText: translated, modelUsed: 'gemini-3.7-flash' };
        }
      }
    } catch (e) {
      console.warn('Gemini HTTP translation failed:', e);
    }
  }

  // 2. Workers AI execution if available
  if (env.AI) {
    const modelToUse = preferredModel || '@cf/meta/m2m100-1.2b';
    try {
      if (
        modelToUse.includes('llama') || 
        modelToUse.includes('mistral') || 
        modelToUse.includes('qwen')
      ) {
        const response: any = await env.AI.run(modelToUse, {
          messages: [
            { role: 'system', content: 'شما مترجم ارشد خبر به فارسی روان و ژورنالیستی هستید. تمام ساختارهای Markdown را حفظ کنید.' },
            { role: 'user', content: translationPrompt }
          ],
          max_tokens: 1200,
        });

        const translated = response?.response?.trim() || response?.translated_text?.trim();
        if (translated) {
          return { translatedText: translated, modelUsed: modelToUse };
        }
      }

      // Fast translation model (e.g. @cf/meta/m2m100-1.2b)
      const route = selectTranslationModel(targetLang);
      const targetModel = modelToUse.startsWith('@cf/') ? modelToUse : route.model;

      let response: any;
      if (route.isIndic) {
        response = await env.AI.run(targetModel, {
          text: truncatedText,
          src_lang: route.sourceCode,
          tgt_lang: route.targetCode,
        });
      } else {
        response = await env.AI.run(targetModel, {
          text: truncatedText,
          source_lang: route.sourceCode,
          target_lang: route.targetCode,
        });
      }

      if (response?.translated_text) {
        return { translatedText: response.translated_text, modelUsed: targetModel };
      }
      if (typeof response === 'string') {
        return { translatedText: response, modelUsed: targetModel };
      }
    } catch (err) {
      console.warn(`Workers AI (${modelToUse}) execution failed:`, err);
    }
  }

  // 3. Graceful Fallback if offline
  return {
    translatedText: truncatedText,
    modelUsed: preferredModel ? `${preferredModel} (fallback)` : 'fallback-raw'
  };
}

/**
 * STAGE 2: Advanced SEO & Journalistic Headline Engine
 * Generates 3 alternative titles, 5 keyword tags, and a ~150-word meta description.
 */
export async function generateSeoMetadataWithAI(
  env: Env,
  articleTitle: string,
  articleContent: string,
  preferredModel?: string
): Promise<SeoMetadataResult> {
  const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
  const truncatedContent = (articleContent || articleTitle).slice(0, 3000);

  const seoPrompt = `شما یک مدیر سئو و سردبیر ارشد دیجیتال برای یک رسانه خبری مطرح (هزاردستان) هستید.
بر اساس عنوان و متن خبر زیر، بسته کامل سئو و تیترزنی ژورنالیستی را به زبان فارسی تولید کنید.

عنوان خبر: ${articleTitle}
متن خبر:
${truncatedContent}

خروجی شما باید دقیقاً یک شیء JSON با ساختار زیر باشد:
{
  "suggested_titles": [
    "تیتر جذاب اول (حداکثر ۸۰ کاراکتر، جذاب، کلیک‌خور و ژورنالیستی)",
    "تیتر جذاب دوم (حداکثر ۸۰ کاراکتر، زاویه دید تحلیلی یا پرسشی)",
    "تیتر جذاب سوم (حداکثر ۸۰ کاراکتر، متمرکز بر اثرگذاری و کلمه کلیدی اصلی)"
  ],
  "tags": [
    "تگ ۱",
    "تگ ۲",
    "تگ ۳",
    "تگ ۴",
    "تگ ۵"
  ],
  "meta_description": "یک خلاصه سئومحور و جذاب در حدود ۱۰۰ الی ۱۵۰ کلمه به زبان فارسی روان که هم خلاصه خبر باشد و هم برای موتورهای جستجو بهینه‌سازی شده باشد و مخاطب را ترغیب به خواندن متن کامل کند."
}

قوانین الزامی:
۱. آرایه suggested_titles باید دقیقاً ۳ تیتر متمایز، جذاب و روان (هر کدام حداکثر ۸۰ کاراکتر) باشد.
۲. آرایه tags باید دقیقاً ۵ تگ کلمه کلیدی پرجستجو و مرتبط با موضوع خبر باشد.
۳. فیلد meta_description باید یک خلاصه منسجم، جذاب و سئومحور در حدود ۱۰۰ تا ۱۵۰ کلمه باشد.
۴. خروجی فقط و فقط باید فرمت معتبر JSON باشد بدون هیچ توضیح اضافی، بدون مقدمه و بدون کد بلاک markdown.`;

  if (apiKey) {
    // 1. Try Gemini SDK
    try {
      const ai = getGeminiClient(apiKey);
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: seoPrompt,
        });

        const rawText = response?.text?.trim() || '';
        const parsed = parseSeoJson(rawText);
        if (parsed) {
          return { ...parsed, modelUsed: 'gemini-3.7-flash' };
        }
      }
    } catch (e) {
      console.warn('Gemini SDK SEO generation failed:', e);
    }

    // 2. Try Gemini HTTP
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: seoPrompt }]
          }]
        })
      });

      if (response.ok) {
        const json: any = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const parsed = parseSeoJson(rawText);
        if (parsed) {
          return { ...parsed, modelUsed: 'gemini-3.7-flash' };
        }
      }
    } catch (e) {
      console.warn('Gemini HTTP SEO generation failed:', e);
    }
  }

  // 3. Fallback Heuristic SEO generator if AI is not available
  return generateFallbackSeo(articleTitle, articleContent);
}

/**
 * Safely parse JSON from LLM output (handles ```json fences or partial wrappers)
 */
function parseSeoJson(rawText: string): SeoMetadataResult | null {
  if (!rawText) return null;
  try {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    }
    
    // Find first { and last }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }

    const obj = JSON.parse(clean);
    if (obj && Array.isArray(obj.suggested_titles) && Array.isArray(obj.tags) && typeof obj.meta_description === 'string') {
      return {
        suggested_titles: obj.suggested_titles.slice(0, 3).map((t: string) => String(t).slice(0, 80).trim()),
        tags: obj.tags.slice(0, 5).map((t: string) => String(t).trim()),
        meta_description: obj.meta_description.trim()
      };
    }
  } catch (err) {
    console.warn('Failed to parse SEO JSON from AI output:', err, rawText);
  }
  return null;
}

/**
 * Heuristic SEO fallback
 */
function generateFallbackSeo(title: string, content: string): SeoMetadataResult {
  const cleanTitle = (title || 'خبر جدید').trim();
  const cleanContent = (content || cleanTitle).replace(/[\r\n]+/g, ' ').trim();
  
  const suggested_titles = [
    cleanTitle.slice(0, 80),
    `تحلیل و بررسی: ${cleanTitle}`.slice(0, 80),
    `همه جزئیات درباره ${cleanTitle}`.slice(0, 80),
  ];

  // Extract simple keywords
  const tags = ['فناوری', 'اخبار روز', 'هوش مصنوعی', 'اقتصاد و بازار', 'هزاردستان'];

  const meta_description = cleanContent.length > 250
    ? cleanContent.slice(0, 250) + '... گزارش کامل رویداد و بررسی جزئیات این خبر را در وب‌سایت هزاردستان بخوانید.'
    : `${cleanTitle}. گزارش کامل و تحلیل این رویداد در پایگاه خبری هزاردستان.`;

  return {
    suggested_titles,
    tags,
    meta_description,
    modelUsed: 'heuristic-fallback'
  };
}

/**
 * Cron translator routine:
 * 2-Stage Pipeline:
 * Stage 1: Translates pending articles (title & content)
 * Stage 2: Generates SEO metadata (suggested_titles, tags, meta_description)
 * Stores full translation and SEO payload into D1 database.
 */
export async function translator(env: Env): Promise<{ processed: number; successCount: number; errors: string[] }> {
  const startTime = Date.now();
  const errors: string[] = [];
  let processed = 0;
  let successCount = 0;

  try {
    // Ensure table has all needed SEO columns
    const columnsToEnsure = [
      "ALTER TABLE translations ADD COLUMN model_used TEXT",
      "ALTER TABLE translations ADD COLUMN ai_model TEXT",
      "ALTER TABLE translations ADD COLUMN suggested_titles TEXT",
      "ALTER TABLE translations ADD COLUMN tags TEXT",
      "ALTER TABLE translations ADD COLUMN meta_description TEXT",
      "ALTER TABLE translation_history ADD COLUMN suggested_titles TEXT",
      "ALTER TABLE translation_history ADD COLUMN tags TEXT",
      "ALTER TABLE translation_history ADD COLUMN meta_description TEXT"
    ];

    for (const alterSql of columnsToEnsure) {
      try {
        await env.DB.prepare(alterSql).run();
      } catch {}
    }

    const { results: pendingArticles } = await env.DB.prepare(
      "SELECT id, source_id, original_url, title, content, published_at, created_at, translation_status FROM articles WHERE translation_status = 'pending' ORDER BY created_at ASC LIMIT 5"
    ).all<Article>();

    if (!pendingArticles || pendingArticles.length === 0) {
      return { processed: 0, successCount: 0, errors: [] };
    }

    processed = pendingArticles.length;

    for (const article of pendingArticles) {
      if (!article.id) continue;

      try {
        await env.DB.prepare(
          "UPDATE articles SET translation_status = 'processing' WHERE id = ?"
        ).bind(article.id).run();

        // ----------------------------------------------------
        // STAGE 1: Journalistic Persian Translation
        // ----------------------------------------------------
        const [titleResult, contentResult] = await Promise.all([
          translateTextWithAI(env, article.title, 'english', 'persian'),
          translateTextWithAI(env, article.content || article.title, 'english', 'persian'),
        ]);

        const modelUsed = titleResult.modelUsed || contentResult.modelUsed || 'gemini-2.5-flash';
        const finalTitle = titleResult.translatedText || article.title;
        const finalContent = contentResult.translatedText || article.content;

        // ----------------------------------------------------
        // STAGE 2: SEO & Headline Optimization
        // ----------------------------------------------------
        const seoResult = await generateSeoMetadataWithAI(
          env,
          finalTitle,
          finalContent,
          modelUsed
        );

        const titlesJson = JSON.stringify(seoResult.suggested_titles);
        const tagsJson = JSON.stringify(seoResult.tags);
        const metaDesc = seoResult.meta_description;

        // Delete existing translation if re-translating
        try {
          await env.DB.prepare('DELETE FROM translations WHERE article_id = ?').bind(article.id).run();
        } catch {}

        // Insert into translations table
        await env.DB.prepare(`
          INSERT INTO translations (
            article_id, 
            target_language, 
            translated_title, 
            translated_content, 
            suggested_titles,
            tags,
            meta_description,
            translated_at,
            model_used,
            ai_model,
            approval_status
          ) VALUES (?, 'persian', ?, ?, ?, ?, ?, datetime('now'), ?, ?, 'approved')
        `).bind(
          article.id,
          finalTitle,
          finalContent,
          titlesJson,
          tagsJson,
          metaDesc,
          modelUsed,
          modelUsed
        ).run();

        // Also record into translation_history log
        try {
          await env.DB.prepare(`
            INSERT INTO translation_history (
              article_id, 
              target_language, 
              translated_title, 
              translated_content, 
              suggested_titles,
              tags,
              meta_description,
              translated_at, 
              model_used
            ) VALUES (?, 'persian', ?, ?, ?, ?, ?, datetime('now'), ?)
          `).bind(
            article.id, 
            finalTitle, 
            finalContent, 
            titlesJson, 
            tagsJson, 
            metaDesc, 
            modelUsed
          ).run();
        } catch {}

        await env.DB.prepare(
          "UPDATE articles SET translation_status = 'completed' WHERE id = ?"
        ).bind(article.id).run();

        successCount++;
      } catch (err: any) {
        const errorMsg = `Translation failed for article ID ${article.id}: ${err.message || 'AI Model error'}`;
        errors.push(errorMsg);

        try {
          await env.DB.prepare(
            "UPDATE articles SET translation_status = 'failed' WHERE id = ?"
          ).bind(article.id).run();
        } catch {
          // Ignore
        }
      }
    }
  } catch (globalErr: any) {
    errors.push(`Global translator error: ${globalErr.message}`);
  }

  const durationMs = Date.now() - startTime;

  // Record execution log in D1
  try {
    await env.DB.prepare(`
      INSERT INTO execution_logs (task_type, status, items_processed, items_success, error_message, duration_ms, executed_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      'cron_translator',
      errors.length > 0 ? (successCount > 0 ? 'partial' : 'failed') : 'success',
      processed,
      successCount,
      errors.join('; ') || null,
      durationMs
    ).run();
  } catch {
    // Gracefully handle if logging table is not ready yet
  }

  return {
    processed,
    successCount,
    errors,
  };
}

/**
 * Translates a single article by ID and saves to D1 Archive (and Primary DB)
 */
export async function translateArticle(
  env: Env,
  articleId: number
): Promise<{
  article_id: number;
  translation_id?: number;
  title: string;
  content: string;
  summary: string;
  suggested_titles: string[];
  tags: string[];
  meta_description: string;
  source_url?: string;
  source_name?: string;
  featured_image?: string | null;
  model_used: string;
}> {
  console.log(`[Translator] Translating article ID ${articleId}...`);

  // 1. Fetch article & full text from Primary DB
  let articleRow: any = null;
  try {
    articleRow = await env.DB.prepare(`
      SELECT 
        a.id, 
        a.source_id, 
        s.name as source_name,
        a.title, 
        COALESCE(a.link, a.original_url) as link, 
        a.summary, 
        COALESCE(ac.full_text, a.content, a.title) as full_text, 
        COALESCE(a.featured_image, ai.image_url) as featured_image
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      LEFT JOIN article_contents ac ON a.id = ac.article_id
      LEFT JOIN article_images ai ON a.id = ai.article_id AND ai.is_featured = 1
      WHERE a.id = ?
    `).bind(articleId).first();
  } catch {
    // Fallback simple query
    articleRow = await env.DB.prepare(
      'SELECT id, source_id, title, COALESCE(link, original_url) as link, content as full_text, featured_image FROM articles WHERE id = ?'
    ).bind(articleId).first();
  }

  if (!articleRow) {
    throw new Error(`Article with ID ${articleId} not found in DB`);
  }

  // Update status to processing
  try {
    await env.DB.prepare("UPDATE articles SET status = 'translating', translation_status = 'processing' WHERE id = ?").bind(articleId).run();
  } catch {}

  const rawTitle = articleRow.title || 'بدون عنوان';
  const rawContent = articleRow.full_text || articleRow.summary || rawTitle;

  // 2. Stage 1: Persian Translation
  const [titleRes, contentRes] = await Promise.all([
    translateTextWithAI(env, rawTitle, 'english', 'persian'),
    translateTextWithAI(env, rawContent, 'english', 'persian'),
  ]);

  const modelUsed = titleRes.modelUsed || contentRes.modelUsed || 'workers-ai';
  const translatedTitle = titleRes.translatedText || rawTitle;
  const translatedContent = contentRes.translatedText || rawContent;

  // 3. Stage 2: SEO & Meta Generation
  const seoRes = await generateSeoMetadataWithAI(env, translatedTitle, translatedContent, modelUsed);

  // 4. Save to Archive DB
  const translationRecord = {
    article_id: articleId,
    translated_title: translatedTitle,
    translated_content: translatedContent,
    translated_summary: seoRes.meta_description,
    meta_description: seoRes.meta_description,
    suggested_titles: seoRes.suggested_titles,
    tags: seoRes.tags,
    ai_model: modelUsed,
  };

  const savedTransId = await saveTranslation(env, translationRecord);

  // 5. Update status in Primary DB
  try {
    await env.DB.prepare("UPDATE articles SET status = 'translated', translation_status = 'completed' WHERE id = ?").bind(articleId).run();
  } catch {}

  return {
    article_id: articleId,
    translation_id: savedTransId || undefined,
    title: translatedTitle,
    content: translatedContent,
    summary: seoRes.meta_description,
    suggested_titles: seoRes.suggested_titles,
    tags: seoRes.tags,
    meta_description: seoRes.meta_description,
    source_url: articleRow.link,
    source_name: articleRow.source_name || 'Cointelegraph',
    featured_image: articleRow.featured_image || null,
    model_used: modelUsed,
  };
}

/**
 * Saves translated news to D1 Archive (and Primary DB)
 */
export async function saveTranslation(
  env: Env,
  translation: {
    article_id: number;
    translated_title: string;
    translated_content: string;
    translated_summary?: string;
    meta_description?: string;
    suggested_titles?: string[] | string;
    tags?: string[] | string;
    ai_model?: string;
  }
): Promise<number | null> {
  const titlesJson = Array.isArray(translation.suggested_titles)
    ? JSON.stringify(translation.suggested_titles)
    : (translation.suggested_titles || null);

  const tagsJson = Array.isArray(translation.tags)
    ? JSON.stringify(translation.tags)
    : (translation.tags || null);

  let translationId: number | null = null;

  // 1. Save to D1 Archive if available
  if (env.DB_ARCHIVE) {
    try {
      const res = await env.DB_ARCHIVE.prepare(`
        INSERT INTO translations (
          article_id, 
          translated_title, 
          translated_content, 
          translated_summary, 
          meta_description, 
          suggested_titles, 
          tags, 
          ai_model, 
          translated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        translation.article_id,
        translation.translated_title,
        translation.translated_content,
        translation.translated_summary || null,
        translation.meta_description || null,
        titlesJson,
        tagsJson,
        translation.ai_model || 'workers-ai'
      ).run();

      translationId = Number(res.meta?.last_row_id) || null;
    } catch (err: any) {
      console.warn(`[Translator] Failed to insert into DB_ARCHIVE:`, err.message);
    }
  }

  // 2. Also save to Primary DB for unified UI viewing & backward compatibility
  if (env.DB) {
    try {
      // Remove previous translation for this article if exists
      try {
        await env.DB.prepare('DELETE FROM translations WHERE article_id = ?').bind(translation.article_id).run();
      } catch {}

      const primRes = await env.DB.prepare(`
        INSERT INTO translations (
          article_id, 
          translated_title, 
          translated_content, 
          suggested_titles, 
          tags, 
          meta_description, 
          ai_model,
          model_used,
          translated_at, 
          approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'approved')
      `).bind(
        translation.article_id,
        translation.translated_title,
        translation.translated_content,
        titlesJson,
        tagsJson,
        translation.meta_description || null,
        translation.ai_model || 'workers-ai',
        translation.ai_model || 'workers-ai'
      ).run();

      if (!translationId) {
        translationId = Number(primRes.meta?.last_row_id) || null;
      }
    } catch (primErr: any) {
      console.warn(`[Translator] Failed to insert translation in DB Primary:`, primErr.message);
    }
  }

  return translationId;
}

