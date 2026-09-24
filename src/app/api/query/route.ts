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
    const { providerId, queryId, rawQuery, encryptedBlob, providerName } = await req.json();

    if (!providerId || !queryId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Reward amount: configurable via env, defaults to the testnet demo value
    const reward = process.env.NEXT_PUBLIC_QUERY_REWARD || '5 tDUST';

    // Upsert provider using the actual name supplied, not a placeholder
    const name = providerName || 'AI Provider';
    await sql`
      INSERT INTO "Provider" (id, name, "modelHash", "createdAt")
      VALUES (${providerId}, ${name}, ${providerId}, NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    // Write query to DB — store encryptedBlob as the commitmentHash for traceability
    const commitmentHash = encryptedBlob || queryId;
    const rows = await sql`
      INSERT INTO "Query" (id, "providerId", status, reward, "commitmentHash", "createdAt", "updatedAt")
      VALUES (${queryId}, ${providerId}, 'PROCESSING', ${reward}, ${commitmentHash}, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;

    // Push the inference job to the Redis queue so the worker picks it up.
    await redis.lpush("inference_queue", JSON.stringify({ queryId, rawQuery, encryptedBlob: commitmentHash }));

    return NextResponse.json({ queryId: rows[0]?.id || queryId }, { status: 201 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message }, { status: 500 });
  }
}
