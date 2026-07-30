import { Env, Article } from '../types';

interface TranslationResult {
  translatedText: string;
  modelUsed: string;
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
 * Router & Translation caller with flexible AI Model selection
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

  const truncatedText = text.slice(0, 1200);
  const modelToUse = preferredModel || '@cf/meta/m2m100-1.2b';

  // 1. If Gemini is explicitly chosen or used as fallback
  if (modelToUse === 'gemini-2.5-flash' || (!env.AI && env.GEMINI_API_KEY)) {
    if (env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a professional translator from ${sourceLang} to ${targetLang}. Translate the following text cleanly and accurately into fluent ${targetLang}. Preserve all Markdown formatting (including links, image tags, lists, and headings). Output ONLY the translated text without explanations or quotes:\n\n${truncatedText}`
              }]
            }]
          })
        });

        if (response.ok) {
          const json: any = await response.json();
          const translated = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated) {
            return { translatedText: translated, modelUsed: 'gemini-2.5-flash' };
          }
        }
      } catch (e) {
        console.warn('Gemini API translation failed:', e);
      }
    }
  }

  // 2. Workers AI execution if available
  if (env.AI) {
    try {
      // Check if chosen model is an LLM Instruct/Chat model (e.g. Llama 3.1, Mistral, Qwen)
      if (
        modelToUse.includes('llama') || 
        modelToUse.includes('mistral') || 
        modelToUse.includes('qwen')
      ) {
        const prompt = `[INST] You are an expert translator. Translate the following English news text into fluent, natural Persian (Farsi). Preserve all Markdown formatting (including links, image tags, lists, and headings). Output ONLY the translated Persian text without any English commentary, preamble, or quotation marks.\n\nText to translate:\n${truncatedText} [/INST]`;
        
        const response: any = await env.AI.run(modelToUse, {
          messages: [
            { role: 'system', content: 'You are a professional English to Persian (Farsi) news translator. Always preserve Markdown formatting.' },
            { role: 'user', content: `Translate this news text into fluent Persian (Farsi), preserving Markdown:\n${truncatedText}` }
          ],
          max_tokens: 800,
        });

        const translated = response?.response?.trim() || response?.translated_text?.trim();
        if (translated) {
          return { translatedText: translated, modelUsed: modelToUse };
        }
      }

      // Default translation model (e.g. @cf/meta/m2m100-1.2b or @cf/ai4bharat/indictrans2-en-indic-1B)
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
      console.warn(`Workers AI (${modelToUse}) execution failed, switching to fallback:`, err);
    }
  }

  // 3. Secondary Fallback Attempt: Gemini API if not already tried
  if (env.GEMINI_API_KEY && modelToUse !== 'gemini-2.5-flash') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following text accurately into fluent Persian (Farsi). Preserve all Markdown formatting (including links, image tags, lists, and headings):\n\n${truncatedText}`
            }]
          }]
        })
      });

      if (response.ok) {
        const json: any = await response.json();
        const translated = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) {
          return { translatedText: translated, modelUsed: 'gemini-2.5-flash' };
        }
      }
    } catch (e) {}
  }

  // 4. Graceful Fallback
  return {
    translatedText: truncatedText,
    modelUsed: `${modelToUse} (fallback)`
  };
}

/**
 * Cron translator routine:
 * Fetches pending articles and translates title & content.
 */
export async function translator(env: Env): Promise<{ processed: number; successCount: number; errors: string[] }> {
  const startTime = Date.now();
  const errors: string[] = [];
  let processed = 0;
  let successCount = 0;

  try {
    // Ensure table has model_used and ai_model columns
    try {
      await env.DB.prepare("ALTER TABLE translations ADD COLUMN model_used TEXT").run();
    } catch {}
    try {
      await env.DB.prepare("ALTER TABLE translations ADD COLUMN ai_model TEXT").run();
    } catch {}

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

        const [titleResult, contentResult] = await Promise.all([
          translateTextWithAI(env, article.title, 'english', 'persian'),
          translateTextWithAI(env, article.content, 'english', 'persian'),
        ]);

        const modelUsed = titleResult.modelUsed || contentResult.modelUsed || '@cf/meta/m2m100-1.2b';
        const finalTitle = titleResult.translatedText || article.title;
        const finalContent = contentResult.translatedText || article.content;

        await env.DB.prepare(`
          INSERT INTO translations (
            article_id, 
            target_language, 
            translated_title, 
            translated_content, 
            translated_at,
            model_used,
            ai_model
          ) VALUES (?, 'persian', ?, ?, datetime('now'), ?, ?)
        `).bind(
          article.id,
          finalTitle,
          finalContent,
          modelUsed,
          modelUsed
        ).run();

        // Also record into translation_history
        try {
          await env.DB.prepare(`
            INSERT INTO translation_history (article_id, target_language, translated_title, translated_content, translated_at, model_used)
            VALUES (?, 'persian', ?, ?, datetime('now'), ?)
          `).bind(article.id, finalTitle, finalContent, modelUsed).run();
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
