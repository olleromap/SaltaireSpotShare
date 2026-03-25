import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ notificationId: string }> };

export async function PATCH(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { notificationId } = await params;

  const notification = await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true },
  });

  if (notification.count === 0) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Notification not found" } }, { status: 404 });
  }

  return NextResponse.json({ data: { success: true } });
}
