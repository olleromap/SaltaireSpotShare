"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";

interface DisputeData {
  id: string;
  status: string;
  description: string;
  resolution: string | null;
  createdAt: string;
  openedBy: { name: string; email: string; unitNumber: string | null };
  managedBy: { name: string } | null;
  reservation: {
    startDate: string;
    endDate: string;
    visitorName: string | null;
    availability: { spot: { spotNumber: string; floor: number } };
    reservedBy: { name: string; email: string };
  };
}

export default function DisputeDetailPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const router = useRouter();
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [resolution, setResolution] = useState("");
  const [status, setStatus] = useState("UNDER_REVIEW");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/disputes/${disputeId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setDispute(d.data);
          setResolution(d.data.resolution ?? "");
          setStatus(d.data.status);
        }
      });
  }, [disputeId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/disputes/${disputeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution, status }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Dispute updated");
      router.push("/manager/disputes");
    } else {
      toast.error("Failed to update");
    }
  }

  if (!dispute) return <div className="h-40 bg-slate-100 rounded-xl animate-pulse max-w-2xl" />;

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-700",
    UNDER_REVIEW: "bg-orange-100 text-orange-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
    CLOSED: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/manager/disputes" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm">
        <ChevronLeft size={16} /> Back to disputes
      </Link>

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dispute</h1>
        <Badge className={`border-0 ${statusColors[dispute.status]}`}>{dispute.status.replace("_", " ")}</Badge>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Complaint</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Opened by</span>
            <span>{dispute.openedBy.name}{dispute.openedBy.unitNumber ? ` · Unit ${dispute.openedBy.unitNumber}` : ""}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Date</span>
            <span>{format(new Date(dispute.createdAt), "MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Spot</span>
            <span>Spot {dispute.reservation.availability.spot.spotNumber} · Floor {dispute.reservation.availability.spot.floor}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Reservation</span>
            <span>{format(new Date(dispute.reservation.startDate), "MMM d")} – {format(new Date(dispute.reservation.endDate), "MMM d")}</span>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-sm text-slate-400 mb-1">Description</p>
            <p className="text-slate-700 text-sm">{dispute.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Resolution</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Resolution notes</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this was resolved…"
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="bg-[#1e4d8c] hover:bg-[#163a6a]" disabled={loading}>
                {loading ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
