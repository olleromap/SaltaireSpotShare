"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return (
    <Button
      variant="outline"
      className="w-full text-red-600 border-red-200 hover:bg-red-50"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut size={16} className="mr-2" />
      Sign out
    </Button>
  );
}
