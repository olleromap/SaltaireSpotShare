import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { computeDiff } from "@/lib/diff-engine"

export const runtime = "nodejs"

// GET /api/snapshots/:id/diff?baseId=xxx
// Computes what changed between baseId snapshot and this snapshot
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const baseId = searchParams.get("baseId")

  // Current snapshot records
  const currRecords = await prisma.record.findMany({
    where: { snapshotId: id },
    orderBy: { rowIndex: "asc" },
  })

  // If no baseId, find the most recent prior snapshot
  let prevRecords: typeof currRecords = []
  let resolvedBaseId = baseId

  if (baseId) {
    prevRecords = await prisma.record.findMany({
      where: { snapshotId: baseId },
      orderBy: { rowIndex: "asc" },
    })
  } else {
    const curr = await prisma.snapshot.findUnique({ where: { id } })
    if (curr) {
      const prev = await prisma.snapshot.findFirst({
        where: { createdAt: { lt: curr.createdAt }, id: { not: id } },
        orderBy: { createdAt: "desc" },
      })
      if (prev) {
        resolvedBaseId = prev.id
        prevRecords = await prisma.record.findMany({
          where: { snapshotId: prev.id },
          orderBy: { rowIndex: "asc" },
        })
      }
    }
  }

  if (prevRecords.length === 0) {
    return NextResponse.json({
      baseId: null,
      added: currRecords.length,
      modified: 0,
      removed: 0,
      unchanged: 0,
      records: currRecords.map((r) => ({ ...r, changeType: "added" })),
    })
  }

  const mapped = (recs: typeof currRecords) =>
    recs.map((r) => ({ ...r, data: r.data as Record<string, string> }))

  const { changeMap, removedRecords } = computeDiff(mapped(prevRecords), mapped(currRecords))

  const annotated = currRecords.map((r) => {
    const change = changeMap.get(r.id)
    return { ...r, changeType: change?.changeType ?? null, changedFields: change?.changedFields }
  })

  const summary = {
    baseId: resolvedBaseId,
    added: annotated.filter((r) => r.changeType === "added").length,
    modified: annotated.filter((r) => r.changeType === "modified").length,
    removed: removedRecords.length,
    unchanged: annotated.filter((r) => r.changeType === null).length,
  }

  return NextResponse.json({ ...summary, records: annotated, removedRecords })
}
