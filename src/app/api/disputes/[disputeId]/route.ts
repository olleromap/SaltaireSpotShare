import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

type Params = { params: Promise<{ disputeId: string }> };

const UpdateDisputeSchema = z.object({
  resolution: z.string().min(5).optional(),
  status: z.enum(["UNDER_REVIEW", "RESOLVED", "CLOSED"]).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { disputeId } = await params;
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      openedBy: { select: { id: true, name: true, email: true, unitNumber: true } },
      managedBy: { select: { id: true, name: true } },
      reservation: {
        include: {
          availability: { include: { spot: true } },
          reservedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!dispute) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Dispute not found" } }, { status: 404 });
  }
  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  if (!isManager && dispute.openedById !== session.user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  return NextResponse.json({ data: dispute });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  const { disputeId } = await params;

  const body = await req.json();
  const parsed = UpdateDisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const dispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      ...parsed.data,
      managedById: session.user.id,
    },
  });

  if (dispute.status === "RESOLVED") {
    await logActivity({ action: "DISPUTE_RESOLVED", actorId: session.user.id, targetId: disputeId, targetType: "Dispute" });
  }

  return NextResponse.json({ data: dispute });
}
