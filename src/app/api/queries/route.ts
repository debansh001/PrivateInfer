import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const queries = await prisma.query.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(queries);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
