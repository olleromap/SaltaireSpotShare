import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search = "", page = "1" } = await searchParams;
  const pageNum = parseInt(page);
  const pageSize = 50;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { unitNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, unitNumber: true, phone: true,
        role: true, isActive: true, createdAt: true,
        ownedSpots: { select: { spotNumber: true } },
      },
      orderBy: { name: "asc" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Residents</h1>
          <p className="text-slate-500 text-sm mt-1">{total} registered</p>
        </div>
        <Link href="/manager/residents/new">
          <Button className="bg-[#1e4d8c] hover:bg-[#163a6a] gap-2">
            <UserPlus size={16} />
            Invite resident
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <form className="flex-1">
              <input
                name="search"
                defaultValue={search}
                placeholder="Search by name, email, or unit…"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-[#1e4d8c]"
              />
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Unit</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Spots</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {user.name}
                      {user.role !== "RESIDENT" && (
                        <Badge className="ml-2 bg-purple-100 text-purple-700 border-0 text-xs">{user.role}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-slate-600">{user.unitNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.ownedSpots.map((s) => s.spotNumber).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`border-0 text-xs ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/manager/residents/${user.id}`} className="text-[#1e4d8c] hover:underline text-xs">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      {search ? "No residents match your search" : "No residents yet. Invite your first resident."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
