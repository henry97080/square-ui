export type Bookmark = {
  id: string;
  title: string;
  url: string;
  description: string;
  favicon: string;
  collectionId: string;
  tags: string[];
  createdAt: string;
  isFavorite: boolean;
  hasDarkIcon?: boolean;
};

export type Collection = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  count: number;
};

// Empty arrays - user will create their own collections, tags, and bookmarks
// These are populated from the Vercel Postgres database in production
export const collections: Collection[] = [];
export const tags: Tag[] = [];
export const bookmarks: Bookmark[] = [];
