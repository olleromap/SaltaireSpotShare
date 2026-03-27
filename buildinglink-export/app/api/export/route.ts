import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateExport, generatePreview } from "@/lib/export-engine"
import { computeDiff } from "@/lib/diff-engine"
import { audit } from "@/lib/audit"
import type { MappingRule, TargetField } from "@/lib/export-engine"

export const runtime = "nodejs"

interface ExportBody {
  snapshotId: string
  mappingProfileId: string
  exportType: "full" | "delta"
  format: "csv" | "xlsx"
  preview?: boolean
  deltaBaseId?: string
}

// POST /api/export
export async function POST(req: NextRequest) {
  const body = await req.json() as ExportBody
  const { snapshotId, mappingProfileId, exportType, format, preview, deltaBaseId } = body

  const [snapshot, profile] = await Promise.all([
    prisma.snapshot.findUnique({ where: { id: snapshotId } }),
    prisma.mappingProfile.findUnique({ where: { id: mappingProfileId } }),
  ])

  if (!snapshot) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 })
  if (!profile) return NextResponse.json({ error: "Mapping profile not found" }, { status: 404 })

  const allRecords = await prisma.record.findMany({
    where: { snapshotId, isExcluded: false },
    orderBy: { rowIndex: "asc" },
  })

  const targetSchema = profile.targetSchema as unknown as TargetField[]
  const mappings = profile.mappings as unknown as MappingRule[]

  let exportRows: { data: Record<string, string>; changeType?: string | null }[]

  if (exportType === "delta") {
    // Find base snapshot
    let baseRecords: typeof allRecords = []
    let resolvedBaseId = deltaBaseId

    if (deltaBaseId) {
      baseRecords = await prisma.record.findMany({
        where: { snapshotId: deltaBaseId, isExcluded: false },
        orderBy: { rowIndex: "asc" },
      })
    } else {
      const prev = await prisma.snapshot.findFirst({
        where: { createdAt: { lt: snapshot.createdAt }, id: { not: snapshotId } },
        orderBy: { createdAt: "desc" },
      })
      if (prev) {
        resolvedBaseId = prev.id
        baseRecords = await prisma.record.findMany({
          where: { snapshotId: prev.id, isExcluded: false },
          orderBy: { rowIndex: "asc" },
        })
      }
    }

    const mapped = (recs: typeof allRecords) =>
      recs.map((r) => ({ ...r, data: r.data as Record<string, string> }))

    const { changeMap, removedRecords } = computeDiff(mapped(baseRecords), mapped(allRecords))

    exportRows = allRecords
      .filter((r) => changeMap.has(r.id))
      .map((r) => ({
        data: r.data as Record<string, string>,
        changeType: changeMap.get(r.id)?.changeType ?? null,
      }))

    // Include removed records with changeType = "removed"
    for (const removed of removedRecords) {
      exportRows.push({ data: removed.data, changeType: "removed" })
    }

    if (!preview) {
      await prisma.export.create({
        data: {
          snapshotId,
          mappingProfileId,
          exportType: "delta",
          format,
          recordCount: exportRows.length,
          deltaBaseId: resolvedBaseId ?? null,
        },
      })
    }
  } else {
    exportRows = allRecords.map((r) => ({ data: r.data as Record<string, string> }))
    if (!preview) {
      await prisma.export.create({
        data: { snapshotId, mappingProfileId, exportType: "full", format, recordCount: exportRows.length },
      })
      await prisma.snapshot.update({ where: { id: snapshotId }, data: { status: "exported" } })
    }
  }

  if (preview) {
    const rows = generatePreview({ targetSchema, mappings, rows: exportRows, format }, 25)
    return NextResponse.json({ rows, totalRows: exportRows.length })
  }

  const buffer = generateExport({
    targetSchema,
    mappings,
    rows: exportRows,
    format,
    includeChangeType: exportType === "delta",
  })

  await audit("export_downloaded", {
    snapshotId,
    mappingProfileId,
    exportType,
    format,
    recordCount: exportRows.length,
  })

  const contentType =
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv"
  const filename = `export-${new Date().toISOString().slice(0, 10)}-${exportType}.${format}`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
