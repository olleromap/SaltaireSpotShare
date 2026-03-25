"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  unitNumber: string | null;
  role: string;
  isActive: boolean;
  ownedSpots: { id: string; spotNumber: string; floor: number }[];
}

export default function EditResidentPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [role, setRole] = useState("RESIDENT");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setUser(d.data);
          setName(d.data.name);
          setPhone(d.data.phone ?? "");
          setUnitNumber(d.data.unitNumber ?? "");
          setRole(d.data.role);
          setIsActive(d.data.isActive);
        }
      });
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, unitNumber, role, isActive }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Resident updated");
      router.push("/manager/residents");
    } else {
      toast.error("Failed to save changes");
    }
  }

  if (!user) return <div className="h-40 bg-slate-100 rounded-xl animate-pulse max-w-lg" />;

  return (
    <div className="max-w-lg space-y-5">
      <Link href="/manager/residents" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm">
        <ChevronLeft size={16} /> Back to residents
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
        <p className="text-slate-500 text-sm">{user.email}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Unit #</Label>
                <Input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="e.g. 4B" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="RESIDENT">Resident</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                  value={isActive ? "active" : "inactive"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
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

      {user.ownedSpots.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Assigned spots</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.ownedSpots.map((s) => (
                <Badge key={s.id} variant="secondary">
                  Spot {s.spotNumber} · Floor {s.floor}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
