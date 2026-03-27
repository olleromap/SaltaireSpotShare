import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNextRun } from "@/lib/scheduler"

export const runtime = "nodejs"

// GET /api/schedule
export async function GET() {
  let job = await prisma.scheduledJob.findFirst({ orderBy: { createdAt: "asc" } })
  if (!job) {
    job = await prisma.scheduledJob.create({
      data: { enabled: false, cronPattern: "0 2 * * *" },
    })
  }
  return NextResponse.json(job)
}

// PUT /api/schedule
export async function PUT(req: NextRequest) {
  const body = await req.json() as {
    enabled?: boolean
    cronPattern?: string
    credentialId?: string
  }

  let job = await prisma.scheduledJob.findFirst({ orderBy: { createdAt: "asc" } })
  if (!job) {
    job = await prisma.scheduledJob.create({ data: { enabled: false, cronPattern: "0 2 * * *" } })
  }

  const updated = await prisma.scheduledJob.update({
    where: { id: job.id },
    data: {
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.cronPattern && { cronPattern: body.cronPattern }),
      ...(body.credentialId !== undefined && { credentialId: body.credentialId }),
      nextRunAt: body.cronPattern ? getNextRun(body.cronPattern) : undefined,
    },
  })

  return NextResponse.json(updated)
}
