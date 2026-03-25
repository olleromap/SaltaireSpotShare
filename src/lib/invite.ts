import { prisma } from "@/lib/prisma";
import type { InviteStatus } from "@prisma/client";

export type InviteValidationResult =
  | { valid: true; invite: { id: string; email: string; token: string } }
  | { valid: false; reason: "not_found" | "expired" | "already_used" | "revoked" };

export async function validateInviteToken(
  token: string
): Promise<InviteValidationResult> {
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: { id: true, email: true, token: true, status: true, expiresAt: true },
  });

  if (!invite) return { valid: false, reason: "not_found" };

  if (invite.status === "REVOKED") return { valid: false, reason: "revoked" };
  if (invite.status === "ACCEPTED") return { valid: false, reason: "already_used" };
  if (invite.expiresAt < new Date()) return { valid: false, reason: "expired" };

  return { valid: true, invite };
}

export async function createInvite(email: string, sentById: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Expire any pending invites for this email
  await prisma.invite.updateMany({
    where: { email, status: "PENDING" },
    data: { status: "EXPIRED" },
  });

  return prisma.invite.create({
    data: { email, sentById, expiresAt },
  });
}

export async function revokeInvite(token: string) {
  return prisma.invite.update({
    where: { token },
    data: { status: "REVOKED" },
  });
}
