import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// GET all bookmarks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";
    const collectionId = searchParams.get("collectionId");
    const isFavorite = searchParams.get("isFavorite");
    const search = searchParams.get("search");
    const tags = searchParams.get("tags");

    let queryText = `
      SELECT b.*, COALESCE STRING_AGG(t.name, ',') as tag_names
      FROM bookmarks b
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.status = $1
    `;
    const params: any[] = [status];
    let paramIndex = 2;

    if (collectionId && collectionId !== "all") {
      queryText += ` AND b.collection_id = $${paramIndex}`;
      params.push(collectionId);
      paramIndex++;
    }

    if (isFavorite === "true") {
      queryText += ` AND b.is_favorite = true`;
    }

    if (search) {
      queryText += ` AND (b.title ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex + 1} OR b.url ILIKE $${paramIndex + 2})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      paramIndex += 3;
    }

    if (tags) {
      const tagArray = tags.split(",");
      queryText += ` AND t.id = ANY($${paramIndex})`;
      params.push(tagArray);
      paramIndex++;
    }

    queryText += ` GROUP BY b.id ORDER BY b.created_at DESC`;

    const { rows } = await query(queryText, params);

    const bookmarks = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      description: row.description,
      favicon: row.favicon,
      collectionId: row.collection_id,
      tags: row.tag_names ? row.tag_names.split(",") : [],
      createdAt: row.created_at,
      isFavorite: row.is_favorite,
      hasDarkIcon: row.has_dark_icon,
    }));

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

// POST create a new bookmark
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      title?: string;
      url?: string;
      description?: string;
      favicon?: string;
      collectionId?: string;
      tags?: string[];
      isFavorite?: boolean;
      hasDarkIcon?: boolean;
    };

    const {
      title,
      url,
      description,
      favicon,
      collectionId,
      tags,
      isFavorite,
      hasDarkIcon,
    } = body;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Generate favicon if not provided
    let faviconUrl = favicon;
    if (url && !favicon) {
      try {
        const urlObj = new URL(url);
        faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
      } catch {
        faviconUrl = "";
      }
    }

    // Insert bookmark
    await execute(
      `INSERT INTO bookmarks (id, title, url, description, favicon, collection_id, is_favorite, has_dark_icon, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10)`,
      [
        id,
        title || "",
        url || "",
        description || "",
        faviconUrl,
        collectionId || null,
        isFavorite || false,
        hasDarkIcon || false,
        now,
        now,
      ]
    );

    // Insert tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Check if tag exists, if not create it
        const { rows: tagRows } = await query(
          "SELECT id FROM tags WHERE name = $1",
          [tagName]
        );

        let tagId: string;
        if (tagRows.length === 0) {
          tagId = crypto.randomUUID();
          await execute(
            "INSERT INTO tags (id, name, color, count) VALUES ($1, $2, $3, $4)",
            [tagId, tagName, "bg-gray-500/10 text-gray-500", 1]
          );
        } else {
          tagId = tagRows[0].id;
          await execute("UPDATE tags SET count = count + 1 WHERE id = $1", [tagId]);
        }

        // Link bookmark to tag
        await execute(
          "INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES ($1, $2)",
          [id, tagId]
        );
      }
    }

    // Update collection count
    if (collectionId) {
      await execute("UPDATE collections SET count = count + 1 WHERE id = $1", [collectionId]);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json({ error: "Failed to create bookmark" }, { status: 500 });
  }
}

// PUT update a bookmark
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { id?: string; [key: string]: unknown };
    const { id, ...updates } = body;

    const now = new Date().toISOString();

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex}`);
      values.push(updates.title);
      paramIndex++;
    }
    if (updates.url !== undefined) {
      fields.push(`url = $${paramIndex}`);
      values.push(updates.url);
      paramIndex++;
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      values.push(updates.description);
      paramIndex++;
    }
    if (updates.favicon !== undefined) {
      fields.push(`favicon = $${paramIndex}`);
      values.push(updates.favicon);
      paramIndex++;
    }
    if (updates.collectionId !== undefined) {
      fields.push(`collection_id = $${paramIndex}`);
      values.push(updates.collectionId);
      paramIndex++;
    }
    if (updates.isFavorite !== undefined) {
      fields.push(`is_favorite = $${paramIndex}`);
      values.push(updates.isFavorite);
      paramIndex++;
    }
    if (updates.hasDarkIcon !== undefined) {
      fields.push(`has_dark_icon = $${paramIndex}`);
      values.push(updates.hasDarkIcon);
      paramIndex++;
    }

    fields.push(`updated_at = $${paramIndex}`);
    values.push(now);
    paramIndex++;
    values.push(id);

    await execute(
      `UPDATE bookmarks SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating bookmark:", error);
    return NextResponse.json({ error: "Failed to update bookmark" }, { status: 500 });
  }
}

// DELETE a bookmark
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action") || "delete"; // delete, archive, trash, restore

    if (!id) {
      return NextResponse.json({ error: "Bookmark ID is required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === "delete") {
      // Permanently delete
      await execute("DELETE FROM bookmark_tags WHERE bookmark_id = $1", [id]);
      await execute("DELETE FROM bookmarks WHERE id = $1", [id]);
    } else if (action === "archive") {
      await execute(
        "UPDATE bookmarks SET status = 'archived', updated_at = $1 WHERE id = $2",
        [now, id]
      );
    } else if (action === "trash") {
      await execute(
        "UPDATE bookmarks SET status = 'trashed', updated_at = $1 WHERE id = $2",
        [now, id]
      );
    } else if (action === "restore") {
      await execute(
        "UPDATE bookmarks SET status = 'active', updated_at = $1 WHERE id = $2",
        [now, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json({ error: "Failed to delete bookmark" }, { status: 500 });
  }
}
