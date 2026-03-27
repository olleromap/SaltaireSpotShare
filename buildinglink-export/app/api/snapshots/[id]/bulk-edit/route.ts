import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

interface BulkEditBody {
  operation: "find_replace" | "fill_column" | "restore_all"
  column?: string
  find?: string
  replace?: string
  value?: string
  useRegex?: boolean
}

// POST /api/snapshots/:id/bulk-edit
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as BulkEditBody

  const records = await prisma.record.findMany({ where: { snapshotId: id } })

  let updatedCount = 0

  if (body.operation === "find_replace" && body.column && body.find !== undefined) {
    const regex = body.useRegex
      ? new RegExp(body.find, "gi")
      : null
    const findStr = body.find.toLowerCase()
    const replaceStr = body.replace ?? ""

    for (const record of records) {
      const data = record.data as Record<string, string>
      const curr = data[body.column] ?? ""
      let updated: string

      if (regex) {
        updated = curr.replace(regex, replaceStr)
      } else {
        updated = curr.toLowerCase() === findStr ? replaceStr : curr
      }

      if (updated !== curr) {
        data[body.column] = updated
        await prisma.record.update({
          where: { id: record.id },
          data: { data, isEdited: true },
        })
        updatedCount++
      }
    }
  } else if (body.operation === "fill_column" && body.column && body.value !== undefined) {
    for (const record of records) {
      const data = record.data as Record<string, string>
      if (!data[body.column]) {
        data[body.column] = body.value
        await prisma.record.update({
          where: { id: record.id },
          data: { data, isEdited: true },
        })
        updatedCount++
      }
    }
  } else if (body.operation === "restore_all") {
    // Mark all as not edited — in a real app you'd restore from original data
    // For now just clear the isEdited flag
    const result = await prisma.record.updateMany({
      where: { snapshotId: id },
      data: { isEdited: false },
    })
    updatedCount = result.count
  }

  return NextResponse.json({ updatedCount })
}
