"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const error = searchParams.get("error");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      toast.error("Invalid email or password");
    } else {
      router.push("/");
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error("Enter your email first"); return; }
    setMagicLoading(true);
    const result = await signIn("email", { email, redirect: false });
    setMagicLoading(false);
    if (result?.error) {
      toast.error("Failed to send magic link");
    } else {
      toast.success("Check your email for a login link!");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1e4d8c] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SaltaireSpotShare</h1>
          <p className="text-slate-500 text-sm mt-1">Resident parking portal</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign in</CardTitle>
            <CardDescription>
              {error === "OAuthSignin" ? "Sign-in failed. Please try again." : "Welcome back, Saltaire resident"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full bg-[#1e4d8c] hover:bg-[#163a6a]" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs text-slate-400">
                <span className="bg-white px-2">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleMagicLink}
              disabled={magicLoading}
            >
              {magicLoading ? "Sending link…" : "Email me a magic link"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-4">
          Have an invite?{" "}
          <Link href="/register" className="text-[#1e4d8c] font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
