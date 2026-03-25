import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Search, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedSpots: {
        include: {
          availabilities: {
            where: { status: { in: ["ACTIVE", "RESERVED"] } },
            orderBy: { startDate: "asc" },
            take: 1,
          },
        },
      },
      reservations: {
        where: { status: "CONFIRMED", endDate: { gte: new Date() } },
        include: { availability: { include: { spot: true } } },
        orderBy: { startDate: "asc" },
        take: 3,
      },
    },
  });

  const today = new Date();
  const availableCount = await prisma.spotAvailability.count({
    where: { status: "ACTIVE", startDate: { lte: today }, endDate: { gte: today } },
  });

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <p className="text-slate-500 text-sm">Welcome back</p>
        <h1 className="text-2xl font-bold text-slate-900">{session.user.name.split(" ")[0]} 👋</h1>
        {user?.unitNumber && (
          <p className="text-slate-500 text-sm">Unit {user.unitNumber}</p>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#1e4d8c] text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{availableCount}</div>
            <div className="text-sm opacity-80">spots available today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-900">{user?.reservations.length ?? 0}</div>
            <div className="text-sm text-slate-500">upcoming reservations</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/reserve">
          <Button className="w-full h-16 flex flex-col gap-1 bg-emerald-600 hover:bg-emerald-700">
            <Search size={20} />
            <span className="text-sm">Find a Spot</span>
          </Button>
        </Link>
        <Link href="/my-spot">
          <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
            <Plus size={20} />
            <span className="text-sm">Share My Spot</span>
          </Button>
        </Link>
      </div>

      {/* My spots */}
      {user?.ownedSpots && user.ownedSpots.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">My Parking Spot{user.ownedSpots.length > 1 ? "s" : ""}</h2>
          <div className="space-y-2">
            {user.ownedSpots.map((spot) => {
              const nextAvail = spot.availabilities[0];
              return (
                <Link key={spot.id} href="/my-spot">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center">
                        <Car size={18} className="text-slate-600" />
                        <span className="text-[10px] text-slate-500 font-medium">FL {spot.floor}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">Spot {spot.spotNumber}</div>
                        {nextAvail ? (
                          <div className="text-sm text-emerald-600">
                            Shared {format(nextAvail.startDate, "MMM d")} – {format(nextAvail.endDate, "MMM d")}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400">Not currently shared</div>
                        )}
                      </div>
                      {nextAvail ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Idle</Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming reservations */}
      {user?.reservations && user.reservations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Upcoming Reservations</h2>
            <Link href="/reservations" className="text-sm text-[#1e4d8c] hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {user.reservations.map((res) => (
              <Link key={res.id} href={`/reservations/${res.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Calendar size={18} className="text-[#1e4d8c]" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        Spot {res.availability.spot.spotNumber}
                      </div>
                      <div className="text-sm text-slate-500">
                        {format(res.startDate, "MMM d")} – {format(res.endDate, "MMM d")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
