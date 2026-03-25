import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MagicLinkPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">✉️</span>
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a magic link to your inbox. Click it to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <Link href="/login" className="text-[#1e4d8c] hover:underline">
              try again
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
