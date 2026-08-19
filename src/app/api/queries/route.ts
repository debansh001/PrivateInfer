import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const queries = await prisma.query.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(queries);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message || String(error) }, { status: 500 });
  }
}
