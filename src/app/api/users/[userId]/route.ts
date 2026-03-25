import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateUserSchema } from "@/lib/validations/user";
import { logActivity } from "@/lib/activity-log";

type Params = { params: Promise<{ userId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { userId } = await params;
  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  if (!isManager && session.user.id !== userId) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, unitNumber: true, role: true,
      isActive: true, createdAt: true,
      ownedSpots: { select: { id: true, spotNumber: true, floor: true, section: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  }
  return NextResponse.json({ data: user });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { userId } = await params;
  const isManager = ["MANAGER", "ADMIN"].includes(session.user.role);
  const isSelf = session.user.id === userId;

  if (!isManager && !isSelf) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  // Non-managers can only update their own name/phone/unitNumber
  const data = isManager
    ? parsed.data
    : { name: parsed.data.name, phone: parsed.data.phone, unitNumber: parsed.data.unitNumber };

  const user = await prisma.user.update({ where: { id: userId }, data });

  if (!user.isActive) {
    await logActivity({ action: "USER_DEACTIVATED", actorId: session.user.id, targetId: userId, targetType: "User" });
  }

  return NextResponse.json({ data: user });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  const { userId } = await params;

  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  await logActivity({ action: "USER_DEACTIVATED", actorId: session.user.id, targetId: userId, targetType: "User" });

  return new NextResponse(null, { status: 204 });
}
