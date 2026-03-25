import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, CalendarCheck, AlertTriangle, TrendingUp } from "lucide-react";

export default async function ManagerOverviewPage() {
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

  const recentActivity = await prisma.activityLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } }, spot: { select: { spotNumber: true } } },
  });

  const stats = [
    { label: "Total Spots", value: totalSpots, sub: `${assignedSpots} assigned`, icon: Car, color: "text-[#1e4d8c]", bg: "bg-blue-50" },
    { label: "Residents", value: totalResidents, sub: "Active accounts", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Available Now", value: activeAvailabilities, sub: "Open windows", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Active Reservations", value: activeReservations, sub: "Upcoming", icon: CalendarCheck, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Open Disputes", value: openDisputes, sub: "Need attention", icon: AlertTriangle, color: openDisputes > 0 ? "text-red-600" : "text-slate-400", bg: openDisputes > 0 ? "bg-red-50" : "bg-slate-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manager Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Saltaire · 301 1st Street S, St. Petersburg, FL 33701</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-sm font-medium text-slate-600">{label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-[#1e4d8c] rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-slate-700">{log.action.replace(/_/g, " ")}</span>
                    {log.actor && <span className="text-slate-500"> by {log.actor.name}</span>}
                    {log.spot && <span className="text-slate-500"> · Spot {log.spot.spotNumber}</span>}
                  </div>
                  <span className="text-slate-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
