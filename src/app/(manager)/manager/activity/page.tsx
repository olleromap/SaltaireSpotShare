import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const { page = "1", action } = await searchParams;
  const pageNum = parseInt(page);
  const pageSize = 50;

  const where = action ? { action: action as never } : {};

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        actor: { select: { name: true, email: true } },
        spot: { select: { spotNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  const actionColors: Record<string, string> = {
    USER_REGISTERED: "bg-emerald-100 text-emerald-700",
    USER_INVITED: "bg-blue-100 text-blue-700",
    USER_DEACTIVATED: "bg-red-100 text-red-700",
    RESERVATION_CREATED: "bg-purple-100 text-purple-700",
    RESERVATION_CANCELLED: "bg-orange-100 text-orange-700",
    AVAILABILITY_CREATED: "bg-teal-100 text-teal-700",
    AVAILABILITY_CANCELLED: "bg-amber-100 text-amber-700",
    DISPUTE_OPENED: "bg-red-100 text-red-700",
    DISPUTE_RESOLVED: "bg-emerald-100 text-emerald-700",
    BULK_IMPORT_COMPLETED: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-slate-500 text-sm mt-1">{total} events</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Actor</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Spot</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Badge className={`border-0 text-xs ${actionColors[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.actor?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{log.spot?.spotNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {format(log.createdAt, "MMM d, yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No activity yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {total > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-sm text-slate-400">
                Showing {(pageNum - 1) * pageSize + 1}–{Math.min(pageNum * pageSize, total)} of {total}
              </span>
              <div className="flex gap-2">
                {pageNum > 1 && (
                  <a href={`?page=${pageNum - 1}${action ? `&action=${action}` : ""}`} className="px-3 py-1 text-sm border rounded-md hover:bg-slate-50">
                    Previous
                  </a>
                )}
                {pageNum * pageSize < total && (
                  <a href={`?page=${pageNum + 1}${action ? `&action=${action}` : ""}`} className="px-3 py-1 text-sm border rounded-md hover:bg-slate-50">
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
