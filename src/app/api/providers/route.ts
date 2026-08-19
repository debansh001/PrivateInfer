import { NextResponse } from "next/server";
import { sql } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await sql`SELECT id, name, "modelHash" FROM "Provider" WHERE name != 'Query Maker' ORDER BY "createdAt" DESC LIMIT 1`;
    return NextResponse.json(rows[0] || null);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
