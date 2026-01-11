import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// GET all collections
export async function GET() {
  try {
    const { rows } = await query("SELECT * FROM collections ORDER BY name");

    const collections = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      count: row.count,
    }));

    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

// POST create a new collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; icon?: string; color?: string };
    const { name, icon, color } = body;

    const id = crypto.randomUUID();

    await execute(
      "INSERT INTO collections (id, name, icon, color, count) VALUES ($1, $2, $3, $4, 0)",
      [id, name, icon || "folder", color || "neutral"]
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
