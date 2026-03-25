import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ManagerSidebar from "@/components/layout/ManagerSidebar";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["MANAGER", "ADMIN"].includes(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-100">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
