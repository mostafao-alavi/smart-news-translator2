-- Migration: Add featured_image column to articles table in D1 Primary (news_db)
ALTER TABLE articles ADD COLUMN featured_image TEXT;
