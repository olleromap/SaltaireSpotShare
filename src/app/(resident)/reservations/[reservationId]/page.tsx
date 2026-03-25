import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, Calendar, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import CancelReservationButton from "@/components/reservations/CancelReservationButton";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      availability: {
        include: { spot: { include: { owner: { select: { name: true, unitNumber: true } } } } },
      },
      reservedBy: { select: { name: true, email: true } },
    },
  });

  if (!reservation || reservation.reservedById !== session.user.id) {
    redirect("/reservations");
  }

  const spot = reservation.availability.spot;
  const isActive = reservation.status === "CONFIRMED" && reservation.endDate >= new Date();

  return (
    <div className="px-4 py-6 space-y-5">
      <Link href="/reservations" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm">
        <ChevronLeft size={16} /> Back to reservations
      </Link>

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Reservation</h1>
        <Badge
          className={`border-0 ${
            reservation.status === "CONFIRMED"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {reservation.status === "CONFIRMED" ? "Confirmed" : reservation.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Car size={16} /> Parking spot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Spot number</span>
            <span className="font-medium">{spot.spotNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Location</span>
            <span className="font-medium flex items-center gap-1">
              <MapPin size={12} /> Floor {spot.floor}{spot.section ? `, Section ${spot.section}` : ""}
            </span>
          </div>
          {spot.owner && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Shared by</span>
              <span className="font-medium">{spot.owner.name}{spot.owner.unitNumber ? ` · Unit ${spot.owner.unitNumber}` : ""}</span>
            </div>
          )}
          {spot.notes && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Notes</span>
              <span className="font-medium">{spot.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Calendar size={16} /> Reservation dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">From</span>
            <span className="font-medium">{format(reservation.startDate, "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Until</span>
            <span className="font-medium">{format(reservation.endDate, "EEEE, MMMM d, yyyy")}</span>
          </div>
        </CardContent>
      </Card>

      {(reservation.visitorName || reservation.visitorVehicle) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Visitor info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reservation.visitorName && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Name</span>
                <span className="font-medium">{reservation.visitorName}</span>
              </div>
            )}
            {reservation.visitorVehicle && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-medium">{reservation.visitorVehicle}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isActive && (
        <CancelReservationButton reservationId={reservation.id} />
      )}
    </div>
  );
}
