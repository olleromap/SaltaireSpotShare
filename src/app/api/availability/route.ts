import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateAvailabilitySchema } from "@/lib/validations/availability";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const floor = searchParams.get("floor");

  const availabilities = await prisma.spotAvailability.findMany({
    where: {
      status: "ACTIVE",
      ...(startDate && endDate
        ? {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          }
        : {}),
      spot: {
        isActive: true,
        ...(floor ? { floor: parseInt(floor) } : {}),
      },
    },
    include: {
      spot: {
        include: { owner: { select: { id: true, name: true, unitNumber: true } } },
      },
      reservations: {
        where: { status: "CONFIRMED" },
        select: { startDate: true, endDate: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ data: availabilities });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateAvailabilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { spotId, startDate, endDate, notes } = parsed.data;

  // Verify the caller owns this spot (or is a manager)
  const spot = await prisma.parkingSpot.findUnique({ where: { id: spotId } });
  if (!spot) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Spot not found" } }, { status: 404 });
  }

  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  if (!isManager && spot.ownerId !== session.user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "You do not own this spot" } }, { status: 403 });
  }

  // Check for overlapping availability windows
  const conflict = await prisma.spotAvailability.findFirst({
    where: {
      spotId,
      status: { in: ["ACTIVE", "RESERVED"] },
      startDate: { lte: new Date(endDate) },
      endDate: { gte: new Date(startDate) },
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "An availability window already exists for these dates" } },
      { status: 409 }
    );
  }

  const availability = await prisma.spotAvailability.create({
    data: {
      spotId,
      createdById: session.user.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes,
    },
    include: { spot: true },
  });

  await logActivity({
    action: "AVAILABILITY_CREATED",
    actorId: session.user.id,
    spotId,
    targetId: availability.id,
    targetType: "SpotAvailability",
  });

  // Notify other residents
  if (spot.ownerId) {
    const residents = await prisma.user.findMany({
      where: { role: "RESIDENT", isActive: true, id: { not: session.user.id } },
      select: { id: true },
    });
    for (const r of residents.slice(0, 50)) {
      await createNotification({
        userId: r.id,
        type: "spot_available",
        title: "Spot Available",
        body: `Spot ${spot.spotNumber} (Floor ${spot.floor}) is available ${startDate} – ${endDate}`,
        linkHref: `/reserve/${spotId}`,
      });
    }
  }

  return NextResponse.json({ data: availability }, { status: 201 });
}
