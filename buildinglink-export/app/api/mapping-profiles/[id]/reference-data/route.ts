import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// GET /api/mapping-profiles/:id/reference-data
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await prisma.mappingProfile.findUnique({
    where: { id },
    select: { referenceData: true },
  })
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rd = profile.referenceData as { groups?: string[] } | null
  return NextResponse.json({ groups: rd?.groups ?? [] })
}

// POST /api/mapping-profiles/:id/reference-data
// Accepts a JSON file upload containing PDK.io groups.
// Supported formats:
//   - string array:   ["Residents", "Building Access"]
//   - object array:   [{ "name": "Residents" }, { "name": "Building Access" }]
//   - wrapped object: { "groups": [...] }  (any of the above inside a key)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const profile = await prisma.mappingProfile.findUnique({ where: { id }, select: { id: true } })
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const text = await file.text()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: "Invalid JSON file" }, { status: 422 })
  }

  const groups = extractGroups(parsed)
  if (groups.length === 0) {
    return NextResponse.json(
      { error: "Could not find any group names in the JSON. Expected an array of strings or objects with a 'name' field." },
      { status: 422 }
    )
  }

  await prisma.mappingProfile.update({
    where: { id },
    data: { referenceData: { groups } },
  })

  return NextResponse.json({ groups })
}

// DELETE /api/mapping-profiles/:id/reference-data
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.mappingProfile.update({
    where: { id },
    data: { referenceData: Prisma.JsonNull },
  })
  return NextResponse.json({ ok: true })
}

/**
 * Flexibly extract an array of group name strings from various PDK.io JSON formats.
 */
function extractGroups(data: unknown): string[] {
  // Wrapped object: { "groups": [...], "data": [...], etc. }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>
    // Try common wrapper keys
    for (const key of ["groups", "data", "items", "results", "records"]) {
      if (Array.isArray(obj[key])) {
        const result = extractFromArray(obj[key] as unknown[])
        if (result.length > 0) return result
      }
    }
    // If object has a "name" field itself, treat as single group
    if (typeof obj["name"] === "string") return [obj["name"]]
  }

  // Top-level array
  if (Array.isArray(data)) {
    return extractFromArray(data)
  }

  return []
}

function extractFromArray(arr: unknown[]): string[] {
  const names: string[] = []
  for (const item of arr) {
    if (typeof item === "string" && item.trim()) {
      names.push(item.trim())
    } else if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>
      // Try common name fields
      const name = obj["name"] ?? obj["groupName"] ?? obj["group_name"] ?? obj["title"] ?? obj["label"]
      if (typeof name === "string" && name.trim()) {
        names.push(name.trim())
      }
    }
  }
  return names
}
