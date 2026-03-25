import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateAvailabilitySchema } from "@/lib/validations/availability";
import { logActivity } from "@/lib/activity-log";

type Params = { params: Promise<{ availabilityId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { availabilityId } = await params;
  const availability = await prisma.spotAvailability.findUnique({
    where: { id: availabilityId },
    include: {
      spot: { include: { owner: { select: { id: true, name: true, unitNumber: true } } } },
      reservations: { where: { status: "CONFIRMED" }, include: { reservedBy: { select: { id: true, name: true } } } },
    },
  });
  if (!availability) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Availability not found" } }, { status: 404 });
  }
  return NextResponse.json({ data: availability });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { availabilityId } = await params;

  const availability = await prisma.spotAvailability.findUnique({
    where: { id: availabilityId },
    include: { spot: true },
  });
  if (!availability) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Availability not found" } }, { status: 404 });
  }

  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  if (!isManager && availability.createdById !== session.user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateAvailabilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const updated = await prisma.spotAvailability.update({
    where: { id: availabilityId },
    data: {
      ...(parsed.data.startDate ? { startDate: new Date(parsed.data.startDate) } : {}),
      ...(parsed.data.endDate ? { endDate: new Date(parsed.data.endDate) } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    },
  });

  await logActivity({
    action: "AVAILABILITY_UPDATED",
    actorId: session.user.id,
    targetId: availabilityId,
    targetType: "SpotAvailability",
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { availabilityId } = await params;

  const availability = await prisma.spotAvailability.findUnique({ where: { id: availabilityId } });
  if (!availability) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Availability not found" } }, { status: 404 });
  }

  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  if (!isManager && availability.createdById !== session.user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  await prisma.spotAvailability.update({
    where: { id: availabilityId },
    data: { status: "CANCELLED" },
  });

  await logActivity({
    action: "AVAILABILITY_CANCELLED",
    actorId: session.user.id,
    targetId: availabilityId,
    targetType: "SpotAvailability",
  });

  return new NextResponse(null, { status: 204 });
}
