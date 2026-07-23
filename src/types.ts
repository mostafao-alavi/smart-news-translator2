/**
 * Type definitions for Smart News Aggregator & Translator Cloudflare Worker
 */

export interface Source {
  id?: number;
  name: string;
  url: string;
  language?: string;
  category?: string;
  selector?: string;
  scrape_limit?: number;
  is_active?: boolean | number;
  created_at?: string;
}

export interface Article {
  id?: number;
  source_id: number;
  original_url: string;
  title: string;
  content: string;
  published_at?: string;
  created_at?: string;
  translation_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface Translation {
  id?: number;
  article_id: number;
  target_language: string;
  translated_title: string;
  translated_content: string;
  translated_at?: string;
  model_used?: string;
}

export interface JoinedArticleNews {
  id: number;
  source_id: number;
  source_name: string;
  original_url: string;
  title: string;
  content?: string | null;
  published_at: string;
  created_at: string;
  translation_status: string;
  translated_title: string | null;
  translated_content?: string | null;
  translated_at: string | null;
  model_used?: string | null;
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
  CONTENT_BUCKET: R2Bucket;
  SCRAPE_QUEUE: Queue;
  TRANSLATE_QUEUE: Queue;
  AI: any; // برای دسترسی به Workers AI
  GEMINI_API_KEY: string; // تزریقشده توسط Secrets Store
  ADMIN_SECRET: string;
}
