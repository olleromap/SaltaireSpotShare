"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, CheckCircle2 } from "lucide-react";

export default function InviteResidentPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error?.message ?? "Failed to send invite");
    } else {
      setInviteToken(data.data.token);
      toast.success("Invite created!");
    }
  }

  const inviteUrl = inviteToken
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/register?token=${inviteToken}`
    : null;

  return (
    <div className="max-w-lg space-y-5">
      <Link href="/manager/residents" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm">
        <ChevronLeft size={16} /> Back to residents
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invite resident</h1>
        <p className="text-slate-500 text-sm mt-1">Send an invitation to a new resident</p>
      </div>

      {inviteUrl ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="text-emerald-600" size={20} />
              <span className="font-semibold text-emerald-800">Invite created!</span>
            </div>
            <p className="text-sm text-emerald-700 mb-3">
              Share this link with the resident (expires in 7 days):
            </p>
            <div className="bg-white rounded-lg p-3 text-sm font-mono text-slate-700 break-all border border-emerald-200">
              {inviteUrl}
            </div>
            <Button
              className="mt-3 w-full"
              variant="outline"
              onClick={() => { navigator.clipboard?.writeText(inviteUrl); toast.success("Copied to clipboard"); }}
            >
              Copy link
            </Button>
            <Button className="mt-2 w-full bg-[#1e4d8c] hover:bg-[#163a6a]" onClick={() => router.push("/manager/residents")}>
              Back to residents
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">New resident invite</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Resident email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="resident@example.com"
                />
                <p className="text-xs text-slate-400">
                  An invite link will be generated that expires in 7 days.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" className="bg-[#1e4d8c] hover:bg-[#163a6a]" disabled={loading}>
                  {loading ? "Creating…" : "Create invite"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
