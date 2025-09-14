import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Query params
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");
    const leadId = searchParams.get("leadId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // 2. Qui prenderai l'userId (es. da auth middleware o token)
    // Per ora stub:
    const userId = "demo-user"; // TODO: sostituire con auth reale

    const where: any = { userId };
    if (campaignId) where.campaignId = campaignId;
    if (leadId) where.leadId = leadId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // 4. Query Prisma
    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(events);
  } catch (err) {
    console.error("GET /api/events error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
