import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// PUT /api/snapshots/:id/records/:rid - update a single record
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rid: string }> }
) {
  const { rid } = await params
  const body = await req.json() as { data?: Record<string, string>; isExcluded?: boolean }

  const record = await prisma.record.update({
    where: { id: rid },
    data: {
      ...(body.data && { data: body.data, isEdited: true }),
      ...(body.isExcluded !== undefined && { isExcluded: body.isExcluded }),
    },
  })
  return NextResponse.json(record)
}
