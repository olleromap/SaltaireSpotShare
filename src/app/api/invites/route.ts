import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createInvite } from "@/lib/invite";
import { logActivity } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { InviteSchema } from "@/lib/validations/user";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: { sentBy: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ data: invites });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const body = await req.json();
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const invite = await createInvite(parsed.data.email, session.user.id);

  await logActivity({
    action: "USER_INVITED",
    actorId: session.user.id,
    meta: { email: parsed.data.email, inviteId: invite.id },
  });

  return NextResponse.json({ data: invite }, { status: 201 });
}
