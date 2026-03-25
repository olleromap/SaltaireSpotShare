import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (["MANAGER", "ADMIN"].includes(session.user.role)) redirect("/manager");
  redirect("/dashboard");
}
