export interface JoinedArticleNews {
  id: number;
  source_id: number;
  source_name: string;
  original_url: string;
  title: string;
  content: string;
  published_at: string;
  created_at: string;
  translation_status: 'pending' | 'processing' | 'completed' | 'failed';
  translated_title: string | null;
  translated_content: string | null;
  translated_at: string | null;
}

export interface SourceItem {
  id: number;
  name: string;
  url: string;
  language: string;
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

export interface WorkerFileInfo {
  filename: string;
  language: string;
  path: string;
}
