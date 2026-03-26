"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  spotId: string;
  onSuccess?: () => void;
}

export default function AvailabilityForm({ spotId, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const nowLocal = new Date().toLocaleString("sv").slice(0, 16).replace(" ", "T");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(endDate) <= new Date(startDate)) { toast.error("End must be after start"); return; }
    setLoading(true);
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotId, startDate, endDate, notes }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error?.message ?? "Failed to share spot");
    } else {
      toast.success("Spot shared! Residents can now reserve it.");
      setStartDate(""); setEndDate(""); setNotes("");
      queryClient.invalidateQueries({ queryKey: ["my-spot"] });
      onSuccess?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">From</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={startDate}
            min={nowLocal}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Until</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={endDate}
            min={startDate || nowLocal}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Back-in only, please keep clean"
          className="resize-none"
          rows={2}
          maxLength={500}
        />
      </div>
      <Button type="submit" className="w-full bg-[#1e4d8c] hover:bg-[#163a6a]" disabled={loading}>
        {loading ? "Sharing…" : "Share my spot"}
      </Button>
    </form>
  );
}
