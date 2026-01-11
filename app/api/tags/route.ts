import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// GET all tags
export async function GET() {
  try {
    const { rows } = await query("SELECT * FROM tags ORDER BY name");

    const tags = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      count: row.count,
    }));

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

// POST create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; color?: string };
    const { name, color } = body;

    const id = crypto.randomUUID();

    await execute(
      "INSERT INTO tags (id, name, color, count) VALUES ($1, $2, $3, 0)",
      [id, name, color || "bg-gray-500/10 text-gray-500"]
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
