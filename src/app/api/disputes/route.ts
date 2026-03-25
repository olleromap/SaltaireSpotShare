import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

const CreateDisputeSchema = z.object({
  reservationId: z.string().cuid(),
  description: z.string().min(10, "Please describe the issue in detail"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const disputes = await prisma.dispute.findMany({
    where: {
      ...(isManager ? {} : { openedById: session.user.id }),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      openedBy: { select: { id: true, name: true, email: true } },
      managedBy: { select: { id: true, name: true } },
      reservation: {
        include: { availability: { include: { spot: { select: { spotNumber: true, floor: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: disputes });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateDisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const dispute = await prisma.dispute.create({
    data: {
      reservationId: parsed.data.reservationId,
      openedById: session.user.id,
      description: parsed.data.description,
    },
  });

  await logActivity({ action: "DISPUTE_OPENED", actorId: session.user.id, targetId: dispute.id, targetType: "Dispute" });

  return NextResponse.json({ data: dispute }, { status: 201 });
}
