import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateReservationSchema } from "@/lib/validations/reservation";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  const upcoming = searchParams.get("upcoming") === "true";
  const past = searchParams.get("past") === "true";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reservations = await prisma.reservation.findMany({
    where: {
      ...(isManager ? {} : { reservedById: session.user.id }),
      ...(upcoming ? { endDate: { gte: today }, status: "CONFIRMED" } : {}),
      ...(past ? { endDate: { lt: today } } : {}),
    },
    include: {
      availability: {
        include: { spot: { include: { owner: { select: { id: true, name: true, unitNumber: true } } } } },
      },
      reservedBy: { select: { id: true, name: true, email: true, unitNumber: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ data: reservations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { availabilityId, startDate, endDate, visitorName, visitorVehicle, notes } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);

  const reservation = await prisma.$transaction(async (tx) => {
    const availability = await tx.spotAvailability.findUnique({
      where: { id: availabilityId },
      include: { spot: { include: { owner: true } } },
    });

    if (!availability || availability.status === "CANCELLED") {
      throw new Error("AVAILABILITY_NOT_FOUND");
    }

    // Verify dates fall within availability window
    if (start < availability.startDate || end > availability.endDate) {
      throw new Error("DATES_OUTSIDE_WINDOW");
    }

    // Prevent owner from reserving their own spot
    if (availability.spot.ownerId === session.user.id) {
      throw new Error("OWN_SPOT");
    }

    // Check double-booking
    const conflict = await tx.reservation.findFirst({
      where: {
        availabilityId,
        status: "CONFIRMED",
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (conflict) {
      throw new Error("DOUBLE_BOOKING");
    }

    const newReservation = await tx.reservation.create({
      data: {
        availabilityId,
        reservedById: session.user.id,
        startDate: start,
        endDate: end,
        visitorName,
        visitorVehicle,
        notes,
      },
      include: { availability: { include: { spot: true } } },
    });

    return { newReservation, availability };
  });

  await logActivity({
    action: "RESERVATION_CREATED",
    actorId: session.user.id,
    spotId: reservation.newReservation.availability.spotId,
    targetId: reservation.newReservation.id,
    targetType: "Reservation",
  });

  // Notify spot owner
  const ownerId = reservation.availability.spot.ownerId;
  if (ownerId) {
    await createNotification({
      userId: ownerId,
      type: "reservation_confirmed",
      title: "Your spot has been reserved",
      body: `${session.user.name} reserved spot ${reservation.availability.spot.spotNumber} for ${startDate} – ${endDate}`,
      linkHref: `/my-spot`,
    });
  }

  // Notify reserver
  await createNotification({
    userId: session.user.id,
    type: "reservation_confirmed",
    title: "Reservation confirmed!",
    body: `Spot ${reservation.newReservation.availability.spot.spotNumber} reserved for ${startDate} – ${endDate}`,
    linkHref: `/reservations/${reservation.newReservation.id}`,
  });

  return NextResponse.json({ data: reservation.newReservation }, { status: 201 });
}
