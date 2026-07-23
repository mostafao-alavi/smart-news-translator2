/**
 * Type definitions for Smart News Aggregator & Translator Cloudflare Worker
 */

export interface Source {
  id?: number;
  name: string;
  url: string;
  language?: string;
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
  content: string;
  published_at: string;
  created_at: string;
  translation_status: string;
  translated_title: string | null;
  translated_content: string | null;
  translated_at: string | null;
  model_used: string | null;
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
  AI: any;
  GEMINI_API_KEY?: string;
}
