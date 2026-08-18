import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, modelHash } = await req.json();

    if (!name || !modelHash) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const provider = await prisma.provider.create({
      data: {
        name,
        modelHash
      }
    });

    return NextResponse.json({ providerId: provider.id }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
