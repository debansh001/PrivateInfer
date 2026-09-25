/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/queries?wallet=<walletAddress>
// Returns all queries submitted by a given wallet address (via the Provider record)
// If no wallet param, returns all queries (admin use)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    if (wallet) {
      // Find all provider IDs whose modelHash matches this wallet's coin public key
      // The query maker's wallet is stored as the providerId (via /api/query POST — upserts provider with walletAddress as modelHash)
      const queries = await sql`
        SELECT q.id, q.status, q."commitmentHash", q.reward, q."createdAt", q."updatedAt",
               r."decryptedData", r."proofHash"
        FROM "Query" q
        LEFT JOIN "Result" r ON r."queryId" = q.id
        WHERE q."providerId" IN (
          SELECT id FROM "Provider" WHERE "modelHash" = ${wallet}
        )
        ORDER BY q."createdAt" DESC
      `;
      return NextResponse.json(queries);
    }

    // No wallet filter — return all (admin)
    const queries = await sql`SELECT * FROM "Query" ORDER BY "createdAt" DESC`;
    return NextResponse.json(queries);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message || String(error) }, { status: 500 });
  }
}
