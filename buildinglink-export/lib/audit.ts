import { prisma } from "./prisma"

export async function audit(action: string, details?: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: { action, details: details as object | undefined },
  })
}
