import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  const today = new Date();

  const [totalSpots, assignedSpots, totalResidents, activeAvailabilities, activeReservations, openDisputes] =
    await Promise.all([
      prisma.parkingSpot.count({ where: { isActive: true } }),
      prisma.parkingSpot.count({ where: { isActive: true, ownerId: { not: null } } }),
      prisma.user.count({ where: { role: "RESIDENT", isActive: true } }),
      prisma.spotAvailability.count({ where: { status: "ACTIVE" } }),
      prisma.reservation.count({ where: { status: "CONFIRMED", endDate: { gte: today } } }),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    ]);

  const floorStats = await Promise.all(
    [1,2,3,4,5,6].map(async (floor) => {
      const total = await prisma.parkingSpot.count({ where: { floor, isActive: true } });
      const assigned = await prisma.parkingSpot.count({ where: { floor, isActive: true, ownerId: { not: null } } });
      const active = await prisma.spotAvailability.count({ where: { status: "ACTIVE", spot: { floor } } });
      return { floor, total, assigned, active, utilization: total > 0 ? Math.round((active / total) * 100) : 0 };
    })
  );

  const recentReservations = await prisma.reservation.groupBy({
    by: ["startDate"],
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      startDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    _count: { id: true },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Parking utilization and activity</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Spot utilization", value: `${Math.round((assignedSpots / Math.max(totalSpots, 1)) * 100)}%`, sub: `${assignedSpots}/${totalSpots} assigned` },
          { label: "Active sharing", value: activeAvailabilities, sub: "Open availability windows" },
          { label: "Active reservations", value: activeReservations, sub: "Confirmed upcoming" },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-sm font-medium text-slate-600">{label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Floor breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Utilization by floor</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {floorStats.map(({ floor, total, assigned, active, utilization }) => (
              <div key={floor} className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600 w-14">Floor {floor}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-[#1e4d8c] h-2 rounded-full transition-all"
                    style={{ width: `${utilization}%` }}
                  />
                </div>
                <span className="text-sm text-slate-500 w-32 text-right">
                  {active} sharing / {assigned} owned / {total} total
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent reservations */}
      <Card>
        <CardHeader><CardTitle className="text-base">Reservations (last 30 days)</CardTitle></CardHeader>
        <CardContent>
          {recentReservations.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No reservations in this period</p>
          ) : (
            <div className="space-y-2">
              {recentReservations.map((r) => (
                <div key={r.startDate.toISOString()} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">{new Date(r.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#1e4d8c]/10 rounded-full h-2" style={{ width: `${Math.min(r._count.id * 20, 120)}px` }} />
                    <span className="font-medium text-slate-900 w-8 text-right">{r._count.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
