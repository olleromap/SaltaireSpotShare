import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { scrapeResidentDirectory } from "@/lib/buildinglink-scraper"
import { parseBuffer } from "@/lib/snapshot-parser"
import { audit } from "@/lib/audit"

export const runtime = "nodejs"
// Playwright may take a while — allow up to 5 min on Railway/Render
export const maxDuration = 300

// POST /api/extract/run - trigger automated BuildingLink extraction
export async function POST(req: NextRequest) {
  const body = await req.json() as { credentialId: string }

  if (!body.credentialId) {
    return NextResponse.json({ error: "credentialId required" }, { status: 400 })
  }

  const cred = await prisma.credential.findUnique({ where: { id: body.credentialId } })
  if (!cred) return NextResponse.json({ error: "Credential not found" }, { status: 404 })

  const password = decrypt(cred.password, cred.iv, cred.authTag)

  await audit("extract_started", { source: "automation", credentialId: cred.id })

  let scrapeResult
  try {
    scrapeResult = await scrapeResidentDirectory({
      loginUrl: cred.loginUrl ?? "https://www.buildinglink.com",
      username: cred.username,
      password,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown scrape error"
    await audit("extract_failed", { error: message })
    return NextResponse.json({ error: message }, { status: 502 })
  }

  let parsed
  try {
    parsed = parseBuffer(scrapeResult.buffer, scrapeResult.filename)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse error"
    await audit("extract_failed", { error: message })
    return NextResponse.json({ error: message }, { status: 422 })
  }

  const snapshot = await prisma.snapshot.create({
    data: {
      source: "automation",
      fileName: scrapeResult.filename,
      recordCount: parsed.rows.length,
      status: "pending_cleanup",
      records: {
        create: parsed.rows.map((row) => ({
          rowIndex: row.rowIndex,
          data: row.data,
        })),
      },
    },
  })

  await audit("extract_completed", {
    snapshotId: snapshot.id,
    source: "automation",
    recordCount: parsed.rows.length,
  })

  return NextResponse.json({ snapshotId: snapshot.id, recordCount: snapshot.recordCount })
}
