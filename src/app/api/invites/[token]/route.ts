import { NextRequest, NextResponse } from "next/server";
import { validateInviteToken, revokeInvite } from "@/lib/invite";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await validateInviteToken(token);
  if (!result.valid) {
    return NextResponse.json(
      { error: { code: "INVITE_INVALID", message: result.reason } },
      { status: 400 }
    );
  }
  return NextResponse.json({ data: { email: result.invite.email, token: result.invite.token } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  const { token } = await params;
  await revokeInvite(token);
  return new NextResponse(null, { status: 204 });
}
