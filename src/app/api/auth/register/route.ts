import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateInviteToken } from "@/lib/invite";
import { RegisterSchema } from "@/lib/validations/user";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { token, name, password, phone, unitNumber } = parsed.data;

  const validation = await validateInviteToken(token);
  if (!validation.valid) {
    return NextResponse.json(
      { error: { code: "INVITE_INVALID", message: `Invite is ${validation.reason}` } },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email: validation.invite.email } });
  if (existingUser) {
    return NextResponse.json(
      { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" } },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: validation.invite.email,
        name,
        phone,
        unitNumber,
        passwordHash,
        role: "RESIDENT",
      },
    });

    await tx.invite.update({
      where: { token },
      data: { status: "ACCEPTED", acceptedById: newUser.id },
    });

    return newUser;
  });

  await logActivity({
    action: "USER_REGISTERED",
    actorId: user.id,
    targetId: user.id,
    targetType: "User",
  });

  return NextResponse.json({ data: { id: user.id, email: user.email } }, { status: 201 });
}
