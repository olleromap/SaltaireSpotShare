import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseBuffer } from "@/lib/snapshot-parser"
import { audit } from "@/lib/audit"

export const runtime = "nodejs"

// GET /api/snapshots - list all snapshots
export async function GET() {
  const snapshots = await prisma.snapshot.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      source: true,
      fileName: true,
      recordCount: true,
      status: true,
      notes: true,
      _count: { select: { exports: true } },
    },
  })
  return NextResponse.json(snapshots)
}

// POST /api/snapshots - create snapshot from uploaded file
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const notes = (formData.get("notes") as string) || null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let parsed
  try {
    parsed = parseBuffer(buffer, file.name)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse file" },
      { status: 422 }
    )
  }

  const snapshot = await prisma.snapshot.create({
    data: {
      source: "manual_upload",
      fileName: file.name,
      recordCount: parsed.rows.length,
      status: "pending_cleanup",
      notes,
      records: {
        create: parsed.rows.map((row) => ({
          rowIndex: row.rowIndex,
          data: row.data,
        })),
      },
    },
  })

  await audit("snapshot_created", {
    snapshotId: snapshot.id,
    source: "manual_upload",
    fileName: file.name,
    recordCount: parsed.rows.length,
  })

  return NextResponse.json(
    { id: snapshot.id, recordCount: snapshot.recordCount, headers: parsed.rows[0] ? Object.keys(parsed.rows[0].data) : [] },
    { status: 201 }
  )
}
