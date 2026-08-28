/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await sql`
      SELECT q.*, r.id as result_id, r."decryptedData", r."proofHash"
      FROM "Query" q
      LEFT JOIN "Result" r ON r."queryId" = q.id
      WHERE q.id = ${id}
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      status: row.status,
      commitmentHash: row.commitmentHash,
      result: row.result_id ? {
        decryptedData: row.decryptedData,
        proofHash: row.proofHash,
      } : null,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validate status transitions — only allow forward movement in the lifecycle
    const VALID_STATUSES = ['PROCESSING', 'RESULT_READY', 'PAID', 'FAILED'];
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    if (body.status) {
      await sql`UPDATE "Query" SET status = ${body.status}::"QueryStatus", "updatedAt" = NOW() WHERE id = ${id}`;
      
      // Only insert a Result record if we're moving to RESULT_READY AND no result exists yet
      if (body.status === "RESULT_READY" && body.proofHash) {
        const existing = await sql`SELECT id FROM "Result" WHERE "queryId" = ${id} LIMIT 1`;
        if (existing.length === 0) {
          const resultId = Math.random().toString(36).substring(2, 15);
          await sql`
            INSERT INTO "Result" (id, "queryId", "decryptedData", "proofHash", "createdAt")
            VALUES (${resultId}, ${id}, ${body.decryptedData || 'Inference complete.'}, ${body.proofHash}, NOW())
            ON CONFLICT ("queryId") DO NOTHING
          `;
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
