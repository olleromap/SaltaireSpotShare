import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";

type Params = { params: Promise<{ reservationId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { reservationId } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      availability: { include: { spot: { include: { owner: { select: { id: true, name: true, unitNumber: true } } } } } },
      reservedBy: { select: { id: true, name: true, email: true, unitNumber: true } },
    },
  });
  if (!reservation) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Reservation not found" } }, { status: 404 });
  }
  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  const isOwner = reservation.reservedById === session.user.id;
  const isSpotOwner = reservation.availability.spot.ownerId === session.user.id;
  if (!isManager && !isOwner && !isSpotOwner) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  return NextResponse.json({ data: reservation });
}

const CancelSchema = z.object({
  cancelReason: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { reservationId } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { availability: { include: { spot: true } } },
  });

  if (!reservation) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Reservation not found" } }, { status: 404 });
  }

  if (reservation.status !== "CONFIRMED") {
    return NextResponse.json({ error: { code: "INVALID_STATE", message: "Reservation cannot be modified" } }, { status: 400 });
  }

  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  const isReserver = reservation.reservedById === session.user.id;
  const isSpotOwner = reservation.availability.spot.ownerId === session.user.id;

  if (!isManager && !isReserver && !isSpotOwner) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CancelSchema.safeParse(body);

  let cancelStatus: "CANCELLED_BY_RESIDENT" | "CANCELLED_BY_OWNER" | "CANCELLED_BY_MANAGER" = "CANCELLED_BY_RESIDENT";
  if (isManager) cancelStatus = "CANCELLED_BY_MANAGER";
  else if (isSpotOwner && !isReserver) cancelStatus = "CANCELLED_BY_OWNER";

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: cancelStatus, cancelReason: parsed.success ? parsed.data.cancelReason : undefined },
  });

  await logActivity({
    action: "RESERVATION_CANCELLED",
    actorId: session.user.id,
    targetId: reservationId,
    targetType: "Reservation",
    meta: { reason: cancelStatus },
  });

  // Notify affected parties
  const spot = reservation.availability.spot;
  if (isSpotOwner || isManager) {
    await createNotification({
      userId: reservation.reservedById,
      type: "reservation_cancelled",
      title: "Reservation cancelled",
      body: `Your reservation for spot ${spot.spotNumber} was cancelled`,
      linkHref: `/reservations`,
    });
  }

  return NextResponse.json({ data: updated });
}
