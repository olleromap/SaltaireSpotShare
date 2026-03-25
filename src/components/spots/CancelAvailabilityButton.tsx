"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CancelAvailabilityButton({ availabilityId }: { availabilityId: string }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  async function handleCancel() {
    if (!confirm("Cancel this availability window? Existing confirmed reservations will be notified.")) return;
    setLoading(true);
    const res = await fetch(`/api/availability/${availabilityId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      toast.success("Availability cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-spot"] });
      router.refresh();
    } else {
      toast.error("Failed to cancel");
    }
  }

  return (
    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleCancel} disabled={loading}>
      <X size={14} />
    </Button>
  );
}
