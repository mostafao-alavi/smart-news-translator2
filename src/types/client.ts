export interface JoinedArticleNews {
  id: number;
  source_id: number;
  source_name: string;
  original_url: string;
  title: string;
  content?: string | null;
  published_at: string;
  created_at: string;
  translation_status: 'pending' | 'processing' | 'completed' | 'failed';
  translated_title: string | null;
  translated_content?: string | null;
  translated_at: string | null;
  model_used?: string | null;
}

export interface SourceItem {
  id: number;
  name: string;
  url: string;
  language: string;
  category?: string;
  selector?: string;
  scrape_limit?: number;
  is_active?: boolean | number;
  created_at?: string;
}

export interface StatsData {
  sources_count: number;
  articles_count: number;
  translations_count: number;
  pending_translations_count: number;
}

export interface DbStatusInfo {
  engine: string;
  status: string;
  ping_ms: number;
  sources_count: number;
  articles_count: number;
  translations_count: number;
  pending_count: number;
  last_sync: string;
}

export interface ExecutionLogItem {
  id: number;
  task_type: 'cron_scraper' | 'cron_translator' | 'manual_scraper' | 'manual_translator' | string;
  status: 'success' | 'failed' | 'partial' | string;
  items_processed: number;
  items_success: number;
  error_message: string | null;
  duration_ms: number;
  executed_at: string;
}

export interface SystemEventItem {
  id: number;
  event_type: string;
  description: string;
  created_at: string;
}

export interface TranslationHistoryItem {
  id: number;
  article_id: number;
  target_language: string;
  translated_title: string;
  translated_content: string;
  translated_at: string;
  model_used: string;
}

export interface WorkerFileInfo {
  filename: string;
  language: string;
  path: string;
}
