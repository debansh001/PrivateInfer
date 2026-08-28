/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/prisma";
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { providerId, queryId, encryptedBlob } = await req.json();

    if (!providerId || !queryId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Upsert provider so foreign key is satisfied
    await sql`
      INSERT INTO "Provider" (id, name, "modelHash", "createdAt")
      VALUES (${providerId}, 'Default Provider', ${providerId}, NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    // Write query to DB — store encryptedBlob as the commitmentHash for traceability
    const commitmentHash = encryptedBlob || queryId;
    const rows = await sql`
      INSERT INTO "Query" (id, "providerId", status, reward, "commitmentHash", "createdAt", "updatedAt")
      VALUES (${queryId}, ${providerId}, 'PROCESSING', '5 tDUST', ${commitmentHash}, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;

    // Push the inference job to the Redis queue so the worker picks it up.
    // The encryptedBlob (SHA-256 of the user's query) is passed so the worker
    // can generate a deterministic, content-bound result without seeing raw query text.
    await redis.lpush("inference_queue", JSON.stringify({ queryId, encryptedBlob: commitmentHash }));

    return NextResponse.json({ queryId: rows[0]?.id || queryId }, { status: 201 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message }, { status: 500 });
  }
}

