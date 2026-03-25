import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  UNDER_REVIEW: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const disputes = await prisma.dispute.findMany({
    where: status ? { status: status as never } : {},
    include: {
      openedBy: { select: { name: true, unitNumber: true } },
      managedBy: { select: { name: true } },
      reservation: {
        include: { availability: { include: { spot: { select: { spotNumber: true, floor: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const openCount = await prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Disputes</h1>
        <p className="text-slate-500 text-sm mt-1">{openCount} open</p>
      </div>

      <div className="flex gap-2">
        {[["all", "All"], ["OPEN", "Open"], ["UNDER_REVIEW", "Under Review"], ["RESOLVED", "Resolved"]].map(([val, label]) => (
          <Link key={val} href={val === "all" ? "/manager/disputes" : `?status=${val}`}>
            <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${(!status && val === "all") || status === val ? "bg-[#1e4d8c] text-white" : "bg-white text-slate-600 border hover:bg-slate-50"}`}>
              {label}
            </button>
          </Link>
        ))}
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <AlertTriangle size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No disputes found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <Link key={d.id} href={`/manager/disputes/${d.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-4">
                  <AlertTriangle size={18} className={d.status === "OPEN" ? "text-red-500" : "text-slate-400"} />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      Spot {d.reservation.availability.spot.spotNumber} — {d.openedBy.name}
                      {d.openedBy.unitNumber ? ` · Unit ${d.openedBy.unitNumber}` : ""}
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{d.description}</p>
                    <div className="text-xs text-slate-400 mt-1">
                      {format(d.createdAt, "MMM d, yyyy")} {d.managedBy ? `· Assigned to ${d.managedBy.name}` : ""}
                    </div>
                  </div>
                  <Badge className={`border-0 text-xs ${statusColors[d.status]}`}>{d.status.replace("_", " ")}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
