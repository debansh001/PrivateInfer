import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/provider/check?walletKey=xxx → { isProvider: boolean }
export async function GET(req: NextRequest) {
  try {
    const walletKey = req.nextUrl.searchParams.get("walletKey");
    if (!walletKey) return NextResponse.json({ isProvider: false });
    const rows = await sql`SELECT id FROM "Provider" WHERE "modelHash" = ${walletKey} LIMIT 1`;
    return NextResponse.json({ isProvider: rows.length > 0, providerId: rows[0]?.id || null });
  } catch (error: any) {
    console.error("Provider check error:", error);
    return NextResponse.json({ isProvider: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, modelHash } = await req.json();

    if (!name || !modelHash) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO "Provider" (id, name, "modelHash", "createdAt")
      VALUES (gen_random_uuid()::text, ${name}, ${modelHash}, NOW())
      ON CONFLICT ("modelHash") DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;

    return NextResponse.json({ providerId: rows[0].id }, { status: 201 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message }, { status: 500 });
  }
}
