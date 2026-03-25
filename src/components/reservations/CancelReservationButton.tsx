"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!confirm("Cancel this reservation?")) return;
    setLoading(true);
    const res = await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Reservation cancelled");
      router.push("/reservations");
      router.refresh();
    } else {
      toast.error("Failed to cancel reservation");
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? "Cancelling…" : "Cancel reservation"}
    </Button>
  );
}
