import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;

  const url = new URL(req.url);
  const to = url.searchParams.get("to") || "https://example.com";
  let campaignId = url.searchParams.get("c") || null;

  console.log("[CLICK] token:", token);
  console.log("[CLICK] query.c (raw):", url.searchParams.get("c"));
  console.log("[CLICK] campaignId (init):", campaignId);

  try {
    const lead = await prisma.lead.findUnique({ where: { token } });

    if (!lead) {
      return NextResponse.redirect(to, { status: 302 });
    }

    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign || campaign.userId !== lead.userId) {
        campaignId = null;
      }
    } else {
      console.log("[CLICK] no campaignId provided (null/empty)");
    }

    await prisma.event.create({
      data: {
        userId: lead.userId,
        leadId: lead.id,
        type: "CLICK",
        campaignId, // può essere null
      },
    });
  } catch (e) {
    console.error("[CLICK] EVENT CREATE ERROR:", e);
  }

  return NextResponse.redirect(to, { status: 302 });
}
