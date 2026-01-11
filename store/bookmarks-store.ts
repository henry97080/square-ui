import { create } from "zustand";
import { bookmarks as initialBookmarks, type Bookmark } from "@/mock-data/bookmarks";

type ViewMode = "grid" | "list";
type SortBy = "date-newest" | "date-oldest" | "alpha-az" | "alpha-za";
type FilterType = "all" | "favorites" | "with-tags" | "without-tags";

interface BookmarksState {
  bookmarks: Bookmark[];
  archivedBookmarks: Bookmark[];
  trashedBookmarks: Bookmark[];
  selectedCollection: string;
  selectedTags: string[];
  searchQuery: string;
  viewMode: ViewMode;
  sortBy: SortBy;
  filterType: FilterType;
  setSelectedCollection: (collectionId: string) => void;
  toggleTag: (tagId: string) => void;
  clearTags: () => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortBy) => void;
  setFilterType: (filter: FilterType) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  setArchivedBookmarks: (bookmarks: Bookmark[]) => void;
  setTrashedBookmarks: (bookmarks: Bookmark[]) => void;
  toggleFavorite: (bookmarkId: string) => void;
  archiveBookmark: (bookmarkId: string) => void;
  restoreFromArchive: (bookmarkId: string) => void;
  trashBookmark: (bookmarkId: string) => void;
  restoreFromTrash: (bookmarkId: string) => void;
  permanentlyDelete: (bookmarkId: string) => void;
  getFilteredBookmarks: () => Bookmark[];
  getFavoriteBookmarks: () => Bookmark[];
  getArchivedBookmarks: () => Bookmark[];
  getTrashedBookmarks: () => Bookmark[];
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: initialBookmarks,
  archivedBookmarks: [],
  trashedBookmarks: [],
  selectedCollection: "all",
  selectedTags: [],
  searchQuery: "",
  viewMode: "grid",
  sortBy: "date-newest",
  filterType: "all",

  setSelectedCollection: (collectionId) => set({ selectedCollection: collectionId }),

  toggleTag: (tagId) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tagId)
        ? state.selectedTags.filter((t) => t !== tagId)
        : [...state.selectedTags, tagId],
    })),

  clearTags: () => set({ selectedTags: [] }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setSortBy: (sort) => set({ sortBy: sort }),

  setFilterType: (filter) => set({ filterType: filter }),

  setBookmarks: (bookmarks) => set({ bookmarks }),

  addBookmark: (bookmark) =>
    set((state) => ({ bookmarks: [bookmark, ...state.bookmarks] })),

  setArchivedBookmarks: (bookmarks) => set({ archivedBookmarks: bookmarks }),

  setTrashedBookmarks: (bookmarks) => set({ trashedBookmarks: bookmarks }),

  toggleFavorite: async (bookmarkId) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: true }),
      });

      if (response.ok) {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.id === bookmarkId
              ? { ...bookmark, isFavorite: !bookmark.isFavorite }
              : bookmark
          ),
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  archiveBookmark: async (bookmarkId) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}&action=archive`, {
        method: 'DELETE',
      });

      if (response.ok) {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
          archivedBookmarks: [...state.archivedBookmarks, state.bookmarks.find((b) => b.id === bookmarkId)!],
        }));
      }
    } catch (error) {
      console.error('Error archiving bookmark:', error);
    }
  },

  restoreFromArchive: async (bookmarkId) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}&action=restore`, {
        method: 'DELETE',
      });

      if (response.ok) {
        set((state) => {
          const bookmark = state.archivedBookmarks.find((b) => b.id === bookmarkId);
          if (!bookmark) return state;
          return {
            archivedBookmarks: state.archivedBookmarks.filter((b) => b.id !== bookmarkId),
            bookmarks: [...state.bookmarks, bookmark],
          };
        });
      }
    } catch (error) {
      console.error('Error restoring from archive:', error);
    }
  },

  trashBookmark: async (bookmarkId) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}&action=trash`, {
        method: 'DELETE',
      });

      if (response.ok) {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
          trashedBookmarks: [...state.trashedBookmarks, state.bookmarks.find((b) => b.id === bookmarkId)!],
        }));
      }
    } catch (error) {
      console.error('Error trashing bookmark:', error);
    }
  },

  restoreFromTrash: async (bookmarkId) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}&action=restore`, {
        method: 'DELETE',
      });

      if (response.ok) {
        set((state) => {
          const bookmark = state.trashedBookmarks.find((b) => b.id === bookmarkId);
          if (!bookmark) return state;
          return {
            trashedBookmarks: state.trashedBookmarks.filter((b) => b.id !== bookmarkId),
            bookmarks: [...state.bookmarks, bookmark],
          };
        });
      }
    } catch (error) {
      console.error('Error restoring from trash:', error);
    }
  },

  permanentlyDelete: async (bookmarkId) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}&action=delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        set((state) => ({
          trashedBookmarks: state.trashedBookmarks.filter((b) => b.id !== bookmarkId),
        }));
      }
    } catch (error) {
      console.error('Error permanently deleting:', error);
    }
  },

  getFilteredBookmarks: () => {
    const state = get();
    let filtered = [...state.bookmarks];

    if (state.selectedCollection !== "all") {
      filtered = filtered.filter((b) => b.collectionId === state.selectedCollection);
    }

    if (state.selectedTags.length > 0) {
      filtered = filtered.filter((b) =>
        state.selectedTags.some((tag) => b.tags.includes(tag))
      );
    }

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      );
    }

    switch (state.filterType) {
      case "favorites":
        filtered = filtered.filter((b) => b.isFavorite);
        break;
      case "with-tags":
        filtered = filtered.filter((b) => b.tags.length > 0);
        break;
      case "without-tags":
        filtered = filtered.filter((b) => b.tags.length === 0);
        break;
    }

    switch (state.sortBy) {
      case "date-newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "date-oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "alpha-az":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alpha-za":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return filtered;
  },

  getFavoriteBookmarks: () => {
    const state = get();
    let filtered = state.bookmarks.filter((b) => b.isFavorite);

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      );
    }

    switch (state.sortBy) {
      case "date-newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "date-oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "alpha-az":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alpha-za":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return filtered;
  },

  getArchivedBookmarks: () => {
    const state = get();
    let filtered = [...state.archivedBookmarks];

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      );
    }

    return filtered;
  },

  getTrashedBookmarks: () => {
    const state = get();
    let filtered = [...state.trashedBookmarks];

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      );
    }

    return filtered;
  },
}));
