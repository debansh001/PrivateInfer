/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { sql } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch the most recently registered provider node.
    // Real provider nodes self-register via the /provider dashboard with name 'Provider Node'.
    // Query submitter stubs are upserted with name 'AI Provider' and are excluded here.
    const rows = await sql`
      SELECT id, name, "modelHash" 
      FROM "Provider" 
      WHERE name = 'Provider Node'
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `;
    return NextResponse.json(rows[0] || null);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
