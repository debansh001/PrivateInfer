import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { providerId, queryId } = await req.json();

    if (!providerId || !queryId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Write to DB so the Provider Dashboard can find the query
    const query = await prisma.query.create({
      data: {
        id: queryId, // Use queryId as the ID
        providerId,
        status: "PROCESSING",
        reward: "5 tDUST",
        commitmentHash: queryId, // Just a placeholder
      },
    });

    return NextResponse.json({ queryId: query.id }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
