import Link from "next/link";
import type { FloorGrid } from "@/lib/floor-layouts";

type Spot = {
  id: string;
  spotNumber: string;
  type: string;
  hasEV: boolean;
  ownerId: string | null;
  owner: { unitNumber: string | null } | null;
};

type Props = {
  floor: number;
  grid: FloorGrid;
  spots: Spot[];
};

export default function FloorMap({ floor, grid, spots }: Props) {
  const byNumber = new Map(
    spots.map((s) => {
      const n = parseInt(s.spotNumber.split("-")[1] ?? "0", 10);
      return [n, s];
    })
  );

  const cols = grid[0]?.length ?? 0;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-block">
        {grid.map((row, ri) => (
          <div key={ri} className="flex gap-1 mb-1">
            {/* pad short rows to full width */}
            {Array.from({ length: cols }, (_, ci) => {
              const cell = row[ci] ?? null;
              if (cell === null) {
                return <div key={ci} className="w-9 h-9 shrink-0" />;
              }
              const spot = byNumber.get(cell);
              const assigned = !!spot?.ownerId;
              const handicapped = spot?.type === "HANDICAPPED";
              const ev = spot?.hasEV;

              return (
                <Link
                  key={ci}
                  href={spot ? `/manager/spots/${spot.id}` : "#"}
                  title={`R${floor}-${cell}${spot?.owner?.unitNumber ? ` · ${spot.owner.unitNumber}` : ""}`}
                >
                  <div
                    className={`w-9 h-9 shrink-0 rounded flex flex-col items-center justify-center text-[9px] font-semibold cursor-pointer transition-all hover:scale-110 hover:shadow-md border ${
                      handicapped
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : assigned
                        ? "bg-[#1e4d8c]/10 text-[#1e4d8c] border-[#1e4d8c]/20"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}
                  >
                    <span>{cell}</span>
                    {ev && <span className="text-[7px] leading-none">⚡</span>}
                    {assigned && spot?.owner?.unitNumber && (
                      <span className="text-[7px] leading-none opacity-60 truncate max-w-[2rem]">
                        {spot.owner.unitNumber}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#1e4d8c]/10 border border-[#1e4d8c]/20 inline-block" /> Assigned
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" /> Handicapped
        </span>
      </div>
    </div>
  );
}
