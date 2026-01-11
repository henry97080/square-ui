"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookmarksStore } from "@/store/bookmarks-store";

interface Collection {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

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

interface EditBookmarkDialogProps {
  bookmark: Bookmark;
  collections: Collection[];
  tags: Tag[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EditBookmarkDialog({
  bookmark,
  collections,
  tags,
  open,
  onOpenChange,
  onUpdate,
}: EditBookmarkDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [title, setTitle] = React.useState(bookmark.title);
  const [url, setUrl] = React.useState(bookmark.url);
  const [description, setDescription] = React.useState(bookmark.description);
  const [collectionId, setCollectionId] = React.useState(
    bookmark.collectionId || "all"
  );
  const [selectedTags, setSelectedTags] = React.useState<string[]>(
    bookmark.tags || []
  );
  const { setBookmarks } = useBookmarksStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookmark.id,
          title,
          url,
          description,
          collectionId: collectionId === "all" ? null : collectionId,
          tags: selectedTags,
        }),
      });

      if (response.ok) {
        // Fetch updated bookmarks from API
        const bookmarksRes = await fetch("/api/bookmarks");
        if (bookmarksRes.ok) {
          const data = await bookmarksRes.json();
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
          setBookmarks(bookmarks);
        }

        onOpenChange(false);
        onUpdate();
      } else {
        alert("Failed to update bookmark. Please try again.");
      }
    } catch (error) {
      console.error("Error updating bookmark:", error);
      alert("Error updating bookmark. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
            <DialogDescription>
              Update your bookmark details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="My Awesome Bookmark"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-url">URL *</Label>
              <Input
                id="edit-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="A brief description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-collection">Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger id="edit-collection">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">No Collection</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag.id)}
                    className={selectedTags.includes(tag.id) ? "" : tag.color}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title || !url}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
