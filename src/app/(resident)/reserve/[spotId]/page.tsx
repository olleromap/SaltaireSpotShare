"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Car, MapPin, ChevronLeft, Calendar } from "lucide-react";
import { format } from "date-fns";

interface SpotData {
  id: string;
  spotNumber: string;
  floor: number;
  section: string | null;
  notes: string | null;
  owner: { name: string; unitNumber: string | null } | null;
}

export default function SpotDetailPage({ params }: { params: Promise<{ spotId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const availabilityId = searchParams.get("availabilityId") ?? "";
  const nowLocal = new Date().toLocaleString("sv").slice(0, 16).replace(" ", "T");
  const defaultStart = searchParams.get("startDate") ?? nowLocal;
  const defaultEnd = searchParams.get("endDate") ?? defaultStart;

  const [spot, setSpot] = useState<SpotData | null>(null);
  const [spotId, setSpotId] = useState("");
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [visitorName, setVisitorName] = useState("");
  const [visitorVehicle, setVisitorVehicle] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ spotId: id }) => {
      setSpotId(id);
      fetch(`/api/spots/${id}`).then(r => r.json()).then(d => setSpot(d.data));
    });
  }, [params]);

  async function handleReserve() {
    setLoading(true);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availabilityId, startDate, endDate, visitorName, visitorVehicle }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error?.message ?? "Reservation failed");
    } else {
      toast.success("Reservation confirmed!");
      router.push(`/reservations/${data.data.id}`);
    }
  }

  if (!spot) {
    return (
      <div className="px-4 py-6">
        <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm">
        <ChevronLeft size={16} /> Back
      </button>

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
              <MapPin size={12} />
              Floor {spot.floor}{spot.section ? `, Section ${spot.section}` : ""}
            </div>
            {spot.owner && (
              <div className="text-sm text-slate-400">
                Shared by {spot.owner.name}{spot.owner.unitNumber ? ` · Unit ${spot.owner.unitNumber}` : ""}
              </div>
            )}
            {spot.notes && <p className="text-sm text-slate-400 mt-1">{spot.notes}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1,2,3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-[#1e4d8c]" : "bg-slate-200"}`} />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calendar size={16} /> Choose date &amp; time</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>From</Label>
                <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={new Date().toLocaleString("sv").slice(0, 16).replace(" ", "T")} />
              </div>
              <div className="space-y-2">
                <Label>Until</Label>
                <Input type="datetime-local" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-slate-400">Minimum booking duration is 8 hours.</p>
            <Button className="w-full bg-[#1e4d8c] hover:bg-[#163a6a]" onClick={() => setStep(2)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Visitor info (optional)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Visitor name</Label>
              <Input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Your guest's name" />
            </div>
            <div className="space-y-2">
              <Label>Vehicle description</Label>
              <Input value={visitorVehicle} onChange={(e) => setVisitorVehicle(e.target.value)} placeholder="Make, model, color, plate (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="bg-[#1e4d8c] hover:bg-[#163a6a]" onClick={() => setStep(3)}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Confirm reservation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Spot</span>
                <span className="font-medium">Spot {spot.spotNumber}, Floor {spot.floor}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Dates</span>
                <span className="font-medium">{format(new Date(startDate), "MMM d, h:mm a")} – {format(new Date(endDate), "MMM d, h:mm a")}</span>
              </div>
              {visitorName && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Visitor</span>
                  <span className="font-medium">{visitorName}</span>
                </div>
              )}
              {visitorVehicle && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Vehicle</span>
                  <span className="font-medium">{visitorVehicle}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2 mt-2">
                <span>Cost</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-0">Free</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleReserve} disabled={loading}>
                {loading ? "Reserving…" : "Reserve spot"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
