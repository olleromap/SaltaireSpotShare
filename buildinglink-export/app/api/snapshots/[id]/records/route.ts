import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// GET /api/snapshots/:id/records?page=1&limit=100
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") ?? 100)))
  const skip = (page - 1) * limit

  const [records, total] = await Promise.all([
    prisma.record.findMany({
      where: { snapshotId: id },
      orderBy: { rowIndex: "asc" },
      skip,
      take: limit,
    }),
    prisma.record.count({ where: { snapshotId: id } }),
  ])

  return NextResponse.json({ records, total, page, limit })
}
