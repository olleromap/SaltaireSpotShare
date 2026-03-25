import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

const CreateSpotSchema = z.object({
  spotNumber: z.string().min(1),
  floor: z.number().int().min(1).max(6),
  section: z.string().optional(),
  notes: z.string().optional(),
  ownerId: z.string().cuid().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const floor = searchParams.get("floor");
  const unassigned = searchParams.get("unassigned") === "true";

  const spots = await prisma.parkingSpot.findMany({
    where: {
      isActive: true,
      ...(floor ? { floor: parseInt(floor) } : {}),
      ...(unassigned ? { ownerId: null } : {}),
    },
    include: { owner: { select: { id: true, name: true, email: true, unitNumber: true } } },
    orderBy: [{ floor: "asc" }, { spotNumber: "asc" }],
  });

  return NextResponse.json({ data: spots });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateSpotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const spot = await prisma.parkingSpot.create({ data: parsed.data });

  await logActivity({
    action: "SPOT_CREATED",
    actorId: session.user.id,
    spotId: spot.id,
  });

  return NextResponse.json({ data: spot }, { status: 201 });
}
