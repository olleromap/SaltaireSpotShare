import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/layout/SignOutButton";
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-900 pt-4">Account</h1>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <UserCircle size={40} className="text-slate-400 shrink-0" />
          <div>
            <p className="font-semibold text-slate-900">{session.user.name}</p>
            <p className="text-sm text-slate-500">{session.user.email}</p>
          </div>
        </CardContent>
      </Card>

      <SignOutButton />
    </div>
  );
}
