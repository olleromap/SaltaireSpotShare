import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"

export const runtime = "nodejs"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.credential.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as {
    label?: string
    username?: string
    password?: string
    loginUrl?: string
  }

  const updateData: Record<string, unknown> = {}
  if (body.label) updateData.label = body.label
  if (body.username) updateData.username = body.username
  if (body.loginUrl !== undefined) updateData.loginUrl = body.loginUrl
  if (body.password) {
    const { encrypted, iv, authTag } = encrypt(body.password)
    updateData.password = encrypted
    updateData.iv = iv
    updateData.authTag = authTag
  }

  const cred = await prisma.credential.update({
    where: { id },
    data: updateData,
    select: { id: true, service: true, label: true, username: true, loginUrl: true, updatedAt: true },
  })
  return NextResponse.json(cred)
}
