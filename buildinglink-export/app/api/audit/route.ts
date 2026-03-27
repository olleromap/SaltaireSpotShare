import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// GET /api/audit?limit=50&offset=0
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(200, Number(searchParams.get("limit") ?? 50))
  const offset = Number(searchParams.get("offset") ?? 0)

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count(),
  ])

  return NextResponse.json({ logs, total })
}
