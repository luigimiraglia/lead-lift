import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export default function GET(req: NextRequest) {
  return new NextResponse();
}
