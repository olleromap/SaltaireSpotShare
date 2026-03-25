import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin } from "lucide-react";
import { format } from "date-fns";
import AvailabilityForm from "@/components/spots/AvailabilityForm";
import CancelAvailabilityButton from "@/components/spots/CancelAvailabilityButton";

export default async function MySpotPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const spots = await prisma.parkingSpot.findMany({
    where: { ownerId: session.user.id, isActive: true },
    include: {
      availabilities: {
        where: { status: { in: ["ACTIVE", "RESERVED"] } },
        include: {
          reservations: {
            where: { status: "CONFIRMED" },
            include: { reservedBy: { select: { name: true, unitNumber: true } } },
            orderBy: { startDate: "asc" },
          },
        },
        orderBy: { startDate: "asc" },
      },
    },
  });

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Spot</h1>
        <p className="text-slate-500 text-sm mt-1">Share your spot when you&apos;re away</p>
      </div>

      {spots.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Car size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No parking spot assigned to your account.</p>
            <p className="text-slate-400 text-sm mt-1">Contact the property manager to get assigned a spot.</p>
          </CardContent>
        </Card>
      ) : (
        spots.map((spot) => (
          <div key={spot.id} className="space-y-4">
            {/* Spot info */}
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-[#1e4d8c]/10 rounded-2xl flex flex-col items-center justify-center">
                  <Car size={20} className="text-[#1e4d8c]" />
                  <span className="text-xs text-[#1e4d8c] font-semibold">FL {spot.floor}</span>
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">Spot {spot.spotNumber}</div>
                  <div className="flex items-center gap-1 text-slate-500 text-sm">
                    <MapPin size={13} />
                    <span>Floor {spot.floor}{spot.section ? `, Section ${spot.section}` : ""}</span>
                  </div>
                  {spot.notes && <p className="text-sm text-slate-400 mt-1">{spot.notes}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Share spot */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Share this spot</CardTitle>
              </CardHeader>
              <CardContent>
                <AvailabilityForm spotId={spot.id} />
              </CardContent>
            </Card>

            {/* Active availability windows */}
            {spot.availabilities.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-900 mb-3">Currently shared</h2>
                <div className="space-y-3">
                  {spot.availabilities.map((avail) => (
                    <Card key={avail.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-slate-900">
                              {format(avail.startDate, "MMM d")} – {format(avail.endDate, "MMM d, yyyy")}
                            </div>
                            {avail.notes && <p className="text-sm text-slate-500 mt-1">{avail.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                avail.status === "RESERVED"
                                  ? "bg-blue-100 text-blue-700 border-0"
                                  : "bg-emerald-100 text-emerald-700 border-0"
                              }
                            >
                              {avail.status === "RESERVED" ? "Reserved" : "Available"}
                            </Badge>
                            <CancelAvailabilityButton availabilityId={avail.id} />
                          </div>
                        </div>
                        {avail.reservations.length > 0 && (
                          <div className="border-t border-slate-100 pt-3 space-y-2">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Reservations</p>
                            {avail.reservations.map((res) => (
                              <div key={res.id} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">
                                  {res.reservedBy.name}
                                  {res.reservedBy.unitNumber ? ` · Unit ${res.reservedBy.unitNumber}` : ""}
                                </span>
                                <span className="text-slate-500">
                                  {format(res.startDate, "MMM d")} – {format(res.endDate, "d")}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
