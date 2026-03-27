import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { scrapeResidentDirectory } from "@/lib/buildinglink-scraper"

export const runtime = "nodejs"
export const maxDuration = 60

// POST /api/credentials/test - test BuildingLink login
export async function POST(req: NextRequest) {
  const body = await req.json() as { credentialId?: string; username?: string; password?: string; loginUrl?: string }

  let username: string
  let password: string
  let loginUrl: string | undefined

  if (body.credentialId) {
    const cred = await prisma.credential.findUnique({ where: { id: body.credentialId } })
    if (!cred) return NextResponse.json({ error: "Credential not found" }, { status: 404 })
    username = cred.username
    password = decrypt(cred.password, cred.iv, cred.authTag)
    loginUrl = cred.loginUrl ?? undefined
  } else if (body.username && body.password) {
    username = body.username
    password = body.password
    loginUrl = body.loginUrl
  } else {
    return NextResponse.json({ error: "Provide credentialId or username+password" }, { status: 400 })
  }

  try {
    // Attempt scrape but just verify login
    await scrapeResidentDirectory({ loginUrl: loginUrl ?? "https://www.buildinglink.com", username, password })
    return NextResponse.json({ ok: true, message: "Login successful and export found" })
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Connection failed" },
      { status: 200 }
    )
  }
}
