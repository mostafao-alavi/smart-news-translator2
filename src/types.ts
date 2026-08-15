/**
 * Type definitions for Smart News Aggregator & Translator Cloudflare Worker
 */

export interface Source {
  id?: number;
  name: string;
  url?: string;
  rss_url?: string;
  base_url?: string;
  language?: string;
  category?: string;
  selector?: string;
  scrape_limit?: number;
  is_active?: boolean | number;
  last_scraped_at?: string;
  created_at?: string;
}

export interface Article {
  id?: number;
  source_id: number;
  external_id?: string;
  original_url?: string;
  link?: string;
  title: string;
  summary?: string;
  content?: string;
  featured_image?: string | null;
  published_at?: string;
  scraped_at?: string;
  created_at?: string;
  status?: 'pending' | 'translating' | 'translated' | 'published' | 'failed' | string;
  translation_status?: 'pending' | 'processing' | 'completed' | 'failed' | string;
  wp_sync_status?: 'pending' | 'syncing' | 'published' | 'failed' | null;
  wp_post_id?: number | null;
  wp_published_at?: string | null;
  wp_error?: string | null;
}

export interface ArticleContent {
  id?: number;
  article_id: number;
  full_text: string;
  html_content?: string | null;
  author?: string | null;
  scraped_at?: string;
}

export interface ArticleImage {
  id?: number;
  article_id: number;
  image_url: string;
  image_alt?: string | null;
  is_featured?: number;
  downloaded_path?: string | null;
  wp_media_id?: number | null;
  created_at?: string;
}

export interface Platform {
  id?: number;
  name: string;
  slug: string;
  platform_type: 'wordpress' | 'webhook' | 'rest_api' | 'telegram' | 'bale' | string;
  api_url: string;
  auth_username?: string | null;
  auth_password_secret?: string | null;
  is_active?: boolean | number;
  created_at?: string;
}

export interface SeoMetadata {
  suggested_titles: string[];
  tags: string[];
  meta_description: string;
}

export interface Translation {
  id?: number;
  article_id: number;
  target_language?: string;
  translated_title: string;
  translated_content: string;
  translated_summary?: string | null;
  suggested_titles?: string[] | string | null;
  tags?: string[] | string | null;
  meta_description?: string | null;
  translated_at?: string;
  ai_model?: string;
  model_used?: string;
  approval_status?: 'pending' | 'approved' | 'rejected' | string;
}

export interface ArchiveDistribution {
  id?: number;
  article_id: number;
  translation_id?: number;
  platform: string;
  platform_post_id?: string | null;
  platform_url?: string | null;
  status?: string;
  sent_at?: string;
  published_at?: string;
  error_message?: string | null;
}

export interface OperationLog {
  id?: number;
  operation: string;
  article_id?: number | null;
  status?: string;
  message?: string | null;
  created_at?: string;
}

export interface JoinedArticleNews {
  id: number;
  source_id: number;
  source_name: string;
  original_url: string;
  title: string;
  content?: string | null;
  featured_image?: string | null;
  published_at: string;
  created_at: string;
  translation_status: string;
  wp_sync_status?: 'pending' | 'syncing' | 'published' | 'failed' | null;
  wp_post_id?: number | null;
  wp_published_at?: string | null;
  wp_error?: string | null;
  translated_title: string | null;
  translated_content?: string | null;
  suggested_titles?: string[] | string | null;
  tags?: string[] | string | null;
  meta_description?: string | null;
  translated_at: string | null;
  model_used?: string | null;
}

export interface Distribution {
  id?: number;
  translation_id: number;
  target_platform: string;
  author_name?: string | null;
  platform_post_id?: string | null;
  published_at?: string;
}

export interface JoinedDistribution {
  id: number;
  translation_id: number;
  target_platform: string;
  author_name: string | null;
  platform_post_id: string | null;
  published_at: string;
  article_id: number;
  translated_title: string;
  translated_content?: string | null;
  original_title?: string | null;
  source_name?: string | null;
  original_url?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface StatsData {
  sources_count: number;
  articles_count: number;
  translations_count: number;
  pending_translations_count: number;
  approved_translations_count?: number;
  wp_published_count?: number;
  distributions_count?: number;
  platforms_count?: number;
}

// Ambient Cloudflare Worker Types
export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[]; meta: any }>;
  run(): Promise<{ meta: { changes: number; last_row_id: number | string } }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<{ results?: T[]; meta: { changes: number; last_row_id?: number | string } }[]>;
}

export interface KVNamespace {
  get(key: string, options?: any): Promise<string | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: any): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

export interface R2Object {
  text(): Promise<string>;
  json<T = any>(): Promise<T>;
}

export interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: any): Promise<any>;
  delete(key: string): Promise<void>;
}

export interface QueueMessage<T = any> {
  id: string;
  timestamp: Date;
  body: T;
  ack(): void;
  retry(): void;
}

export interface MessageBatch<T = any> {
  queue: string;
  messages: QueueMessage<T>[];
  ackAll(): void;
  retryAll(): void;
}

export interface Queue<T = any> {
  send(message: T, options?: any): Promise<void>;
  sendBatch(messages: { body: T }[], options?: any): Promise<void>;
}

export interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
  type: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// Cloudflare Workers Environment bindings
export interface Env {
  DB: D1Database;
  DB_ARCHIVE?: D1Database;
  CACHE?: KVNamespace;
  AI: any; // برای دسترسی به Workers AI
  SCRAPE_QUEUE: Queue;
  TRANSLATE_QUEUE: Queue;
  CONTENT_BUCKET?: R2Bucket;
  GEMINI_API_KEY?: string;
  ADMIN_SECRET?: string;
  WP_API_URL?: string;
  WP_USERNAME?: string;
  WP_APPLICATION_PASSWORD?: string;
  WP_POST_STATUS?: string;
  WP_CATEGORY_ID?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}
