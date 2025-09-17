// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TODO: rimpiazza con la tua auth reale (NextAuth/session/JWT/org)
function getUserIdFromRequest(req: NextRequest): string | null {
  // Per test locale: usa header x-user-id oppure hardcode temporaneo.
  const h = req.headers.get("x-user-id");
  if (h && h.trim()) return h.trim();
  // return "test-user"; // <-- sblocca velocemente in locale se vuoi
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    // --- Query params ---
    const campaignId = sp.get("campaignId") ?? undefined;
    const leadId = sp.get("leadId") ?? undefined;

    const pageNum = Number(sp.get("page") ?? "1");
    const sizeNum = Number(sp.get("pageSize") ?? "50");
    if (!Number.isFinite(pageNum) || pageNum < 1) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }
    if (!Number.isFinite(sizeNum) || sizeNum < 1) {
      return NextResponse.json({ error: "Invalid pageSize" }, { status: 400 });
    }
    const take = Math.min(Math.max(sizeNum, 1), 100);
    const skip = (pageNum - 1) * take;

    const dateFromStr = sp.get("dateFrom");
    const dateToStr = sp.get("dateTo");
    const fromDateObj = dateFromStr ? new Date(dateFromStr) : undefined;
    const toDateObj = dateToStr ? new Date(dateToStr) : undefined;
    if (fromDateObj && isNaN(fromDateObj.getTime())) {
      return NextResponse.json({ error: "Invalid dateFrom" }, { status: 400 });
    }
    if (toDateObj && isNaN(toDateObj.getTime())) {
      return NextResponse.json({ error: "Invalid dateTo" }, { status: 400 });
    }

    // --- Auth / Tenancy ---
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Filtro Prisma ---
    const where: any = { userId };
    if (campaignId) where.campaignId = campaignId;
    if (leadId) where.leadId = leadId;
    if (fromDateObj || toDateObj) {
      where.ts = {};
      if (fromDateObj) where.ts.gte = fromDateObj;
      if (toDateObj) where.ts.lte = toDateObj;
    }

    // --- Query + Count in parallelo ---
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { ts: "desc" }, // NB: il campo temporale nel tuo schema è "ts"
        skip,
        take,
        select: {
          id: true,
          type: true, // "SENT" | "OPEN" | "CLICK" | ...
          campaignId: true,
          leadId: true,
          ts: true, // timestamp
        },
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      data: events,
      page: pageNum,
      pageSize: take,
      total,
    });
  } catch (err) {
    console.error("GET /api/events error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
