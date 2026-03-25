import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50");
  const action = searchParams.get("action");

  const where = action ? { action: action as never } : {};

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, email: true } }, spot: { select: { spotNumber: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return NextResponse.json({ data: logs, meta: { total, page, pageSize } });
}
