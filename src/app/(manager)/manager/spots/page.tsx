import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function SpotsPage({
  searchParams,
}: {
  searchParams: Promise<{ floor?: string; search?: string }>;
}) {
  const { floor: floorParam, search = "" } = await searchParams;

  const spots = await prisma.parkingSpot.findMany({
    where: {
      isActive: true,
      ...(floorParam ? { floor: parseInt(floorParam) } : {}),
      ...(search ? { spotNumber: { contains: search, mode: "insensitive" } } : {}),
    },
    include: { owner: { select: { id: true, name: true, unitNumber: true } } },
    orderBy: [{ floor: "asc" }, { spotNumber: "asc" }],
  });

  const byFloor = [1,2,3,4,5,6].map((f) => ({
    floor: f,
    spots: spots.filter((s) => s.floor === f),
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Parking Spots</h1>
        <p className="text-slate-500 text-sm mt-1">{spots.length} spots · {spots.filter((s) => s.ownerId).length} assigned</p>
      </div>

      <div className="flex gap-3">
        <form className="flex-1">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search spot number…"
            className="w-full max-w-xs h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-[#1e4d8c]"
          />
        </form>
        <div className="flex gap-1">
          <Link href="/manager/spots" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!floorParam ? "bg-[#1e4d8c] text-white" : "bg-white text-slate-600 border hover:bg-slate-50"}`}>All</Link>
          {[1,2,3,4,5,6].map((f) => (
            <Link key={f} href={`/manager/spots?floor=${f}`} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${floorParam === String(f) ? "bg-[#1e4d8c] text-white" : "bg-white text-slate-600 border hover:bg-slate-50"}`}>
              FL{f}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {byFloor.map(({ floor, spots: floorSpots }) => {
          if (floorParam && floor !== parseInt(floorParam)) return null;
          if (floorSpots.length === 0 && !search) return null;
          return (
            <Card key={floor}>
              <CardHeader className="pb-2">
                <div className="font-semibold text-slate-700">Floor {floor} <span className="text-slate-400 font-normal text-sm">({floorSpots.length} spots)</span></div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {floorSpots.map((spot) => (
                    <Link key={spot.id} href={`/manager/spots/${spot.id}`}>
                      <div className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-105 hover:shadow-md ${spot.ownerId ? "bg-[#1e4d8c]/10 text-[#1e4d8c] border border-[#1e4d8c]/20" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                        <span className="text-[10px] truncate px-1">{spot.spotNumber}</span>
                        {spot.owner && <span className="text-[9px] truncate px-1 opacity-70">{spot.owner.unitNumber ?? "✓"}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
