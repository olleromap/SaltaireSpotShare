import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await prisma.mappingProfile.findUnique({ where: { id } })
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(profile)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as {
    name?: string
    description?: string
    targetSystem?: string | null
    targetSchema?: unknown[]
    mappings?: unknown[]
  }

  const profile = await prisma.mappingProfile.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.targetSystem !== undefined && { targetSystem: body.targetSystem }),
      ...(body.targetSchema && { targetSchema: body.targetSchema as object[] }),
      ...(body.mappings && { mappings: body.mappings as object[] }),
    },
  })
  return NextResponse.json(profile)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.mappingProfile.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
