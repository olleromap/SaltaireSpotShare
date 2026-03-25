"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, Search } from "lucide-react";
import { format } from "date-fns";

interface AvailabilityItem {
  id: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  spot: {
    id: string;
    spotNumber: string;
    floor: number;
    section: string | null;
    owner: { name: string; unitNumber: string | null } | null;
  };
  reservations: { startDate: string; endDate: string }[];
}

export default function ReservePage() {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [floor, setFloor] = useState("");

  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (floor) params.set("floor", floor);

  const { data, isLoading } = useQuery<{ data: AvailabilityItem[] }>({
    queryKey: ["availability", startDate, endDate, floor],
    queryFn: () => fetch(`/api/availability?${params}`).then((r) => r.json()),
  });

  const items = data?.data ?? [];

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Find a Spot</h1>
        <p className="text-slate-500 text-sm mt-1">Browse available parking spots</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">From</Label>
            <Input type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Until</Label>
            <Input type="date" value={endDate} min={startDate || today} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Floor (optional)</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          >
            <option value="">Any floor</option>
            {[1,2,3,4,5,6].map((f) => <option key={f} value={f}>Floor {f}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Search size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            {isLoading ? "Searching…" : `${items.length} spot${items.length !== 1 ? "s" : ""} available`}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Car size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No spots available for these dates.</p>
              <p className="text-slate-400 text-sm mt-1">Try different dates or check back later.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const reservedDates = item.reservations.length;
              return (
                <Link key={item.id} href={`/reserve/${item.spot.id}?availabilityId=${item.id}&startDate=${startDate}&endDate=${endDate}`}>
                  <Card className="hover:shadow-md transition-shadow active:scale-[0.99]">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center shrink-0">
                        <Car size={18} className="text-emerald-600" />
                        <span className="text-[10px] text-emerald-600 font-semibold">FL {item.spot.floor}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900">Spot {item.spot.spotNumber}</div>
                        <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
                          <MapPin size={12} />
                          <span>Floor {item.spot.floor}{item.spot.section ? `, Section ${item.spot.section}` : ""}</span>
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          Available {format(new Date(item.startDate), "MMM d")} – {format(new Date(item.endDate), "MMM d")}
                        </div>
                        {item.notes && <p className="text-xs text-slate-400 truncate mt-1">{item.notes}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs whitespace-nowrap">
                          Free
                        </Badge>
                        {reservedDates > 0 && (
                          <span className="text-[10px] text-orange-500">{reservedDates} booked</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
