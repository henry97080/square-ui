"use client";

import * as React from "react";
import { useBookmarksStore } from "@/store/bookmarks-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, MoreHorizontal, RotateCcw, XCircle, ExternalLink, Bookmark } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Bookmark {
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
}

function TrashedBookmarkCard({ bookmark }: { bookmark: Bookmark }) {
  const { restoreFromTrash, permanentlyDelete } = useBookmarksStore();

  // Favicon component with fallback
  const Favicon = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const [error, setError] = React.useState(false);

    if (!src || error) {
      return <Bookmark className={className} />;
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={32}
        height={32}
        className={className}
        onError={() => setError(true)}
        unoptimized
      />
    );
  };

  return (
    <div className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors opacity-75 hover:opacity-100">
      <div className="size-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
        <Favicon
          src={bookmark.favicon}
          alt={bookmark.title}
          className={cn("size-6 grayscale", bookmark.hasDarkIcon && "dark:invert")}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{bookmark.title}</h3>
        <p className="text-sm text-muted-foreground truncate">{bookmark.url}</p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => restoreFromTrash(bookmark.id)}
        >
          <RotateCcw className="size-4 mr-1" />
          Restore
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => window.open(bookmark.url, "_blank")}
            >
              <ExternalLink className="size-4 mr-2" />
              Open URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => permanentlyDelete(bookmark.id)}
            >
              <XCircle className="size-4 mr-2" />
              Delete Permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function TrashContent() {
  const { getTrashedBookmarks, setTrashedBookmarks, trashedBookmarks } = useBookmarksStore();
  const filteredTrash = getTrashedBookmarks();

  // Fetch trashed bookmarks from API
  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/bookmarks?status=trashed");

        if (response.ok) {
          const data = await response.json();
          const bookmarks: Bookmark[] = data.bookmarks.map((b: any) => ({
            id: b.id,
            title: b.title,
            url: b.url,
            description: b.description || "",
            favicon: b.favicon || "",
            collectionId: b.collectionId || "",
            tags: b.tags || [],
            createdAt: b.createdAt,
            isFavorite: b.isFavorite || false,
            hasDarkIcon: b.hasDarkIcon || false,
          }));
          setTrashedBookmarks(bookmarks);
        }
      } catch (error) {
        console.error("Error fetching trashed bookmarks:", error);
      }
    }
    fetchData();
  }, [setTrashedBookmarks]);

  return (
    <div className="flex-1 w-full overflow-auto">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Trash</h2>
              <p className="text-sm text-muted-foreground">
                {trashedBookmarks.length} bookmark
                {trashedBookmarks.length !== 1 ? "s" : ""} in trash
              </p>
            </div>
          </div>
          {trashedBookmarks.length > 0 && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              Items in trash will be permanently deleted after 30 days
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {filteredTrash.map((bookmark) => (
            <TrashedBookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>

        {trashedBookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trash2 className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Trash is empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Deleted bookmarks will appear here. You can restore them or delete
              them permanently.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

