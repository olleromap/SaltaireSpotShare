import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// Seed templates for common target systems
const BUILT_IN_TEMPLATES = [
  {
    name: "PDK.io Import",
    description: "Format for importing people into PDK.io access control",
    isTemplate: true,
    targetSchema: [
      { field: "First Name", required: true },
      { field: "Last Name", required: true },
      { field: "Email", required: false },
      { field: "Groups", required: false, description: "e.g. Residents" },
      { field: "Enabled", required: false, description: "1 or 0" },
      { field: "Active Date", required: false },
      { field: "Expire Date", required: false },
    ],
    mappings: [],
  },
  {
    name: "Generic Access Control",
    description: "Common fields for most access control systems",
    isTemplate: true,
    targetSchema: [
      { field: "First Name", required: true },
      { field: "Last Name", required: true },
      { field: "Unit", required: false },
      { field: "Email", required: false },
      { field: "Phone", required: false },
      { field: "Status", required: false },
    ],
    mappings: [],
  },
]

// GET /api/mapping-profiles
export async function GET() {
  const profiles = await prisma.mappingProfile.findMany({
    orderBy: [{ isTemplate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isTemplate: true,
      targetSchema: true,
      mappings: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // Inject built-in templates if no templates exist yet
  const hasTemplates = profiles.some((p) => p.isTemplate)
  if (!hasTemplates) {
    await prisma.mappingProfile.createMany({ data: BUILT_IN_TEMPLATES })
    return GET()
  }

  return NextResponse.json(profiles)
}

// POST /api/mapping-profiles
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    name: string
    description?: string
    targetSchema: unknown[]
    mappings: unknown[]
  }

  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 })

  const profile = await prisma.mappingProfile.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      targetSchema: (body.targetSchema ?? []) as object[],
      mappings: (body.mappings ?? []) as object[],
    },
  })
  return NextResponse.json(profile, { status: 201 })
}
