/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { providerId, queryId } = await req.json();

    if (!providerId || !queryId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Upsert provider so foreign key is satisfied
    await sql`
      INSERT INTO "Provider" (id, name, "modelHash", "createdAt")
      VALUES (${providerId}, 'Default Provider', ${providerId}, NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    // Write query to DB
    const rows = await sql`
      INSERT INTO "Query" (id, "providerId", status, reward, "commitmentHash", "createdAt", "updatedAt")
      VALUES (${queryId}, ${providerId}, 'PROCESSING', '5 tDUST', ${queryId}, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;

    return NextResponse.json({ queryId: rows[0]?.id || queryId }, { status: 201 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message }, { status: 500 });
  }
}
