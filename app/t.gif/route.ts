import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const GIF_1x1 = Buffer.from(
  "47494638396101000100800000ffffff00000021f90401000001002c00000000010001000002024401003b",
  "hex"
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const c = url.searchParams.get("c") || null;

  const respondGif = () =>
    new NextResponse(GIF_1x1, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store",
        "Content-Length": String(GIF_1x1.length),
      },
    });

  try {
    if (!token) {
      console.log("[OPEN] no token → gif only");
      return respondGif();
    }

    const lead = await prisma.lead.findUnique({ where: { token } });
    if (!lead) {
      console.log("[OPEN] lead not found → gif only");
      return respondGif();
    }

    let finalCampaignId = c;
    if (finalCampaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: finalCampaignId },
      });
      if (!campaign || campaign.userId !== lead.userId) {
        console.log("[OPEN] invalid campaign or owner mismatch → null");
        finalCampaignId = null;
      }
    } else {
      console.log("[OPEN] no campaignId provided (null/empty)");
    }

    await prisma.event.create({
      data: {
        userId: lead.userId,
        leadId: lead.id,
        type: "OPEN",
        campaignId: finalCampaignId, // può restare null
      },
    });
    console.log(
      "[OPEN] EVENT CREATED for leadId:",
      lead.id,
      "campaignId:",
      finalCampaignId
    );
  } catch (e) {
    console.error("[OPEN] EVENT CREATE ERROR:", e);
  }

  return respondGif();
}
