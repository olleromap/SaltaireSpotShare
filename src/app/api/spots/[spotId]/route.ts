import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

type Params = { params: Promise<{ spotId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { spotId } = await params;
  const spot = await prisma.parkingSpot.findUnique({
    where: { id: spotId },
    include: {
      owner: { select: { id: true, name: true, email: true, unitNumber: true } },
      availabilities: {
        where: { status: { in: ["ACTIVE", "RESERVED"] } },
        include: { reservations: { where: { status: "CONFIRMED" }, select: { startDate: true, endDate: true } } },
        orderBy: { startDate: "asc" },
      },
    },
  });
  if (!spot) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Spot not found" } }, { status: 404 });
  }
  return NextResponse.json({ data: spot });
}

const UpdateSpotSchema = z.object({
  spotNumber: z.string().optional(),
  floor: z.number().int().min(1).optional(),
  section: z.string().optional().nullable(),
  type: z.enum(["REGULAR", "TANDEM", "HANDICAPPED"]).optional(),
  hasEV: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  ownerId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  const { spotId } = await params;

  const body = await req.json();
  const parsed = UpdateSpotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const spot = await prisma.parkingSpot.update({
    where: { id: spotId },
    data: parsed.data,
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  await logActivity({
    action: parsed.data.ownerId ? "SPOT_REASSIGNED" : "SPOT_ASSIGNED",
    actorId: session.user.id,
    spotId,
  });

  return NextResponse.json({ data: spot });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  const { spotId } = await params;

  await prisma.parkingSpot.update({ where: { id: spotId }, data: { isActive: false } });

  return new NextResponse(null, { status: 204 });
}
