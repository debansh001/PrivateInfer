import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const query = await prisma.query.findUnique({
      where: { id },
      include: { result: true },
    });

    if (!query) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: query.id,
      status: query.status,
      commitmentHash: query.commitmentHash,
      result: query.result ? {
        decryptedData: query.result.decryptedData,
        proofHash: query.result.proofHash
      } : null
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
