import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// GET /api/snapshots/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const snapshot = await prisma.snapshot.findUnique({
    where: { id },
    include: {
      _count: { select: { records: true, exports: true } },
    },
  })
  if (!snapshot) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(snapshot)
}

// PATCH /api/snapshots/:id - update status or notes
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as { status?: string; notes?: string }
  const snapshot = await prisma.snapshot.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })
  return NextResponse.json(snapshot)
}

// DELETE /api/snapshots/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.snapshot.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
