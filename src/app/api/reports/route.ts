import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "overview";
  const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
  const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

  if (type === "overview") {
    const [totalSpots, assignedSpots, totalResidents, activeAvailabilities, activeReservations, openDisputes] =
      await Promise.all([
        prisma.parkingSpot.count({ where: { isActive: true } }),
        prisma.parkingSpot.count({ where: { isActive: true, ownerId: { not: null } } }),
        prisma.user.count({ where: { role: "RESIDENT", isActive: true } }),
        prisma.spotAvailability.count({ where: { status: "ACTIVE" } }),
        prisma.reservation.count({ where: { status: "CONFIRMED", endDate: { gte: new Date() } } }),
        prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      ]);

    return NextResponse.json({
      data: { totalSpots, assignedSpots, totalResidents, activeAvailabilities, activeReservations, openDisputes },
    });
  }

  if (type === "reservations_over_time") {
    const reservations = await prisma.reservation.groupBy({
      by: ["startDate"],
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        ...(startDate ? { startDate: { gte: startDate } } : {}),
        ...(endDate ? { startDate: { lte: endDate } } : {}),
      },
      _count: { id: true },
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json({ data: reservations.map((r) => ({ date: r.startDate, count: r._count.id })) });
  }

  if (type === "utilization_by_floor") {
    const floors = await Promise.all(
      [1, 2, 3, 4, 5, 6].map(async (floor) => {
        const total = await prisma.parkingSpot.count({ where: { floor, isActive: true } });
        const withAvailability = await prisma.spotAvailability.count({
          where: { status: "ACTIVE", spot: { floor } },
        });
        return { floor, total, withAvailability };
      })
    );
    return NextResponse.json({ data: floors });
  }

  return NextResponse.json({ error: { code: "INVALID_TYPE", message: "Unknown report type" } }, { status: 400 });
}
