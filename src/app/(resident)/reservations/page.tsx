import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Car } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  CANCELLED_BY_RESIDENT: "bg-red-100 text-red-600",
  CANCELLED_BY_OWNER: "bg-red-100 text-red-600",
  CANCELLED_BY_MANAGER: "bg-red-100 text-red-600",
};

const statusLabels: Record<string, string> = {
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED_BY_RESIDENT: "Cancelled",
  CANCELLED_BY_OWNER: "Cancelled by owner",
  CANCELLED_BY_MANAGER: "Cancelled",
};

export default async function ReservationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const reservations = await prisma.reservation.findMany({
    where: { reservedById: session.user.id },
    include: { availability: { include: { spot: true } } },
    orderBy: { startDate: "desc" },
  });

  const upcoming = reservations.filter((r) => r.status === "CONFIRMED" && r.endDate >= new Date());
  const past = reservations.filter((r) => r.status !== "CONFIRMED" || r.endDate < new Date());

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Reservations</h1>
        <p className="text-slate-500 text-sm mt-1">Your parking history</p>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((r) => (
              <Link key={r.id} href={`/reservations/${r.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1e4d8c]/10 rounded-xl flex items-center justify-center">
                      <Car size={20} className="text-[#1e4d8c]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Spot {r.availability.spot.spotNumber}</div>
                      <div className="text-sm text-slate-500">
                        Floor {r.availability.spot.floor} · {format(r.startDate, "MMM d")} – {format(r.endDate, "MMM d")}
                      </div>
                      {r.visitorName && <p className="text-sm text-slate-400 mt-0.5">{r.visitorName}</p>}
                    </div>
                    <Badge className={`${statusColors[r.status]} border-0 text-xs`}>
                      {statusLabels[r.status]}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Past</h2>
          <div className="space-y-2">
            {past.map((r) => (
              <Link key={r.id} href={`/reservations/${r.id}`}>
                <Card className="hover:shadow-sm transition-shadow opacity-75">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Calendar size={16} className="text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-700 text-sm">Spot {r.availability.spot.spotNumber}</div>
                      <div className="text-xs text-slate-400">{format(r.startDate, "MMM d")} – {format(r.endDate, "MMM d, yyyy")}</div>
                    </div>
                    <Badge className={`${statusColors[r.status]} border-0 text-xs`}>
                      {statusLabels[r.status]}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {reservations.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No reservations yet</p>
            <p className="text-slate-400 text-sm mt-1">
              <Link href="/reserve" className="text-[#1e4d8c] hover:underline">Find an available spot</Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
