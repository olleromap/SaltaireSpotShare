"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

interface SpotData {
  id: string;
  spotNumber: string;
  floor: number;
  section: string | null;
  notes: string | null;
  isActive: boolean;
  owner: { id: string; name: string; email: string } | null;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  unitNumber: string | null;
}

export default function EditSpotPage() {
  const { spotId } = useParams<{ spotId: string }>();
  const router = useRouter();
  const [spot, setSpot] = useState<SpotData | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [ownerId, setOwnerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/spots/${spotId}`).then((r) => r.json()),
      fetch("/api/users?pageSize=500").then((r) => r.json()),
    ]).then(([spotData, userData]) => {
      if (spotData.data) {
        setSpot(spotData.data);
        setOwnerId(spotData.data.owner?.id ?? "");
        setNotes(spotData.data.notes ?? "");
      }
      if (userData.data) setUsers(userData.data);
    });
  }, [spotId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/spots/${spotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: ownerId || null, notes: notes || null }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Spot updated");
      router.push("/manager/spots");
    } else {
      toast.error("Failed to save");
    }
  }

  if (!spot) return <div className="h-40 bg-slate-100 rounded-xl animate-pulse max-w-lg" />;

  return (
    <div className="max-w-lg space-y-5">
      <Link href="/manager/spots" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm">
        <ChevronLeft size={16} /> Back to spots
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Spot {spot.spotNumber}</h1>
        <p className="text-slate-500 text-sm">Floor {spot.floor}{spot.section ? `, Section ${spot.section}` : ""}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Assignment</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Assigned to</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              >
                <option value="">— Unassigned —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}{u.unitNumber ? ` · Unit ${u.unitNumber}` : ""} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. EV charger, compact only" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="bg-[#1e4d8c] hover:bg-[#163a6a]" disabled={loading}>
                {loading ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
