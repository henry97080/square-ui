-- Vercel Postgres Schema for Bookmarks App
-- Run this in Vercel Dashboard → Database → Query or via vercel postgres pull

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  color VARCHAR(100) NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  has_dark_icon BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active', -- active, archived, trashed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookmark-Tags junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS bookmark_tags (
  bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (bookmark_id, tag_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection_id ON bookmarks(collection_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(status);
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_favorite ON bookmarks(is_favorite);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_bookmark_id ON bookmark_tags(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag_id ON bookmark_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
