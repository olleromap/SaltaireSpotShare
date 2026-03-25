import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import MobileNav from "@/components/layout/MobileNav";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen pb-16 bg-slate-50">
      <main className="max-w-md mx-auto">{children}</main>
      <MobileNav />
    </div>
  );
}
