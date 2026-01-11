# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

This is a **Bookmarks management application** built with Next.js 15 and shadcn/ui, deployed to **Vercel** with **Vercel Postgres** database.

### Technology Stack
- **Framework**: Next.js 15.5.9 with App Router and React 18.3.1
- **UI**: shadcn/ui components with Radix UI primitives and Tailwind CSS v4
- **State**: Zustand for client-side state management
- **Database**: Vercel Postgres (Neon-based PostgreSQL)
- **Deployment**: Vercel
- **Runtime**: Node.js runtime for API routes

---

## Development Commands

### Local Development
```bash
pnpm install          # Install dependencies
pnpm dev               # Start dev server on http://localhost:3000
pnpm build             # Build for production
pnpm start             # Start production server
pnpm lint              # Run ESLint
```

### Database Management (Vercel Postgres)
```bash
# Pull database schema locally (requires vercel-cli)
npx vercel link
npx vercel postgres pull

# Push schema to Vercel
npx vercel postgres push

# Query database via CLI
npx vercel postgres query "SELECT * FROM bookmarks"
```

---

## Architecture Overview

### Data Flow

```
Frontend (React Components)
    ↓
Zustand Store (bookmarks-store.ts)
    ↓
API Routes (/api/bookmarks, /api/collections, /api/tags)
    ↓
Vercel Postgres Database
```

### Database Schema

**Tables:**
- `bookmarks` - Main bookmarks table with status (active/archived/trashed)
- `collections` - Bookmark categories
- `tags` - Tags for organizing bookmarks
- `bookmark_tags` - Many-to-many relationship table

**Key Design**: Bookmarks have a `status` field instead of being deleted:
- `active` - Normal bookmarks
- `archived` - Archived bookmarks (restoreable)
- `trashed` - In trash (can be permanently deleted)

---

## Database Connection

The app uses `@vercel/postgres` for database connections. See `lib/db.ts`:

```typescript
import { sql } from "@vercel/postgres";

export async function query<T = any>(
  queryText: string,
  params: any[] = []
): Promise<{ rows: T[] }> {
  const result = await sql.query(queryText, params);
  return { rows: result.rows as T[] };
}

export async function execute(
  queryText: string,
  params: any[] = []
): Promise<{ rowCount: number }> {
  const result = await sql.query(queryText, params);
  return { rowCount: result.rowCount ?? 0 };
}
```

Use `query()` for SELECT operations and `execute()` for INSERT/UPDATE/DELETE.

### SQL Syntax Notes (PostgreSQL vs SQLite):
- Parameter placeholders: `$1, $2, $3` instead of `?`
- String aggregation: `STRING_AGG(t.name, ',')` instead of `GROUP_CONCAT`
- Case-insensitive search: `ILIKE` instead of `LIKE`
- Boolean values: `true/false` instead of `1/0`
- UUIDs: Auto-generated via `gen_random_uuid()` instead of `crypto.randomUUID()`

---

## API Routes Structure

All API routes access Postgres via `@vercel/postgres`:

**Endpoints:**
- `GET /api/bookmarks` - List bookmarks (supports: status, collectionId, search, tags, isFavorite filters)
- `POST /api/bookmarks` - Create bookmark
- `PUT /api/bookmarks` - Update bookmark
- `DELETE /api/bookmarks?id=xxx&action=trash` - Trash/archive/restore/delete
- `GET/POST /api/collections` - Manage collections
- `GET/POST /api/tags` - Manage tags

---

## Deployment to Vercel

### Initial Setup

1. **Push code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"

3. **Create Vercel Postgres Database**:
   - In Vercel Dashboard → Your Project → Storage
   - Click "Create Database"
   - Select "Postgres" (Neon-based)
   - Click "Create"

4. **Run Database Schema**:
   - In Vercel Dashboard → Your Database → Query
   - Copy the contents of `lib/schema.sql`
   - Paste and run the query

### Environment Variables

Vercel automatically sets `POSTGRES_URL` for your project. The app will use this in production.

For local development, create `.env.local`:
```bash
cp .env.local.example .env.local
# Edit .env.local with your local Postgres connection string
```

### Deploying Updates

Simply push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically build and deploy.

---

## Component Architecture

### Page Structure
- `/` - Main bookmarks page (grid/list view)
- `/favorites` - Filtered view of favorite bookmarks
- `/archive` - Archived bookmarks
- `/trash` - Trashed bookmarks

### Store Pattern
The `bookmarks-store.ts` uses Zustand with:
- Client-side filtering and sorting
- `getFilteredBookmarks()` - Returns filtered/sorted bookmarks
- `getFavoriteBookmarks()` - Favorites-only view
- `getArchivedBookmarks()` - Archived view
- `getTrashedBookmarks()` - Trash view

### Key Components
- `components/dashboard/` - Main dashboard UI including header, sidebar, bookmark cards
- `components/ui/` - shadcn/ui components (button, input, dropdown, sheet, etc.)
- `components/theme-provider.tsx` - Theme context with next-themes for dark/light mode

---

## Important Notes

### No Demo Data
The `mock-data/bookmarks.ts` exports empty arrays. You will create your own collections, tags, and bookmarks through the UI.

### TypeScript Configuration
- Uses ES2017 target with isolatedModules
- Path alias `@/*` maps to root directory
- No special types needed for Vercel Postgres

### Theme Support
App uses `next-themes` for dark/light mode. Theme is stored in localStorage and synchronized across pages via `ThemeProvider`.

### Local Development with Database
To run the app locally with a database connection:
1. Set up a local Postgres instance, or
2. Use Vercel Postgres directly (connection string from Vercel Dashboard)
3. Add `POSTGRES_URL` to your `.env.local`

---

## Quick Start for Personal Use

1. Deploy to Vercel and create Postgres database
2. Run the schema from `lib/schema.sql` in Vercel Dashboard
3. Open your deployed app
4. Create collections and tags via the UI
5. Start adding bookmarks!
