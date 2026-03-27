import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"

export const runtime = "nodejs"

// GET /api/credentials - list (never returns decrypted password)
export async function GET() {
  const creds = await prisma.credential.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      service: true,
      label: true,
      username: true,
      loginUrl: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return NextResponse.json(creds)
}

// POST /api/credentials
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    service: string
    label: string
    username: string
    password: string
    loginUrl?: string
    metadata?: Record<string, unknown>
  }

  if (!body.username || !body.password || !body.label) {
    return NextResponse.json({ error: "label, username, and password required" }, { status: 400 })
  }

  const { encrypted, iv, authTag } = encrypt(body.password)

  const cred = await prisma.credential.create({
    data: {
      service: body.service ?? "buildinglink",
      label: body.label,
      username: body.username,
      password: encrypted,
      iv,
      authTag,
      loginUrl: body.loginUrl ?? null,
      metadata: (body.metadata ?? undefined) as object | undefined,
    },
    select: {
      id: true,
      service: true,
      label: true,
      username: true,
      loginUrl: true,
      createdAt: true,
    },
  })
  return NextResponse.json(cred, { status: 201 })
}
