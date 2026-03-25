"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, Car, Upload, Activity, AlertTriangle, BarChart2, QrCode, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/manager", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/manager/residents", label: "Residents", icon: Users },
  { href: "/manager/spots", label: "Parking Spots", icon: Car },
  { href: "/manager/import", label: "Bulk Import", icon: Upload },
  { href: "/manager/activity", label: "Activity Log", icon: Activity },
  { href: "/manager/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/manager/reports", label: "Reports", icon: BarChart2 },
  { href: "/manager/qr-codes", label: "QR Codes", icon: QrCode },
];

export default function ManagerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1e4d8c] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <div className="font-semibold text-sm">SpotShare</div>
            <div className="text-slate-400 text-xs">Manager Portal</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[#1e4d8c] text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
