"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Car, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface NotificationData {
  data: { isRead: boolean }[];
}

export default function MobileNav() {
  const pathname = usePathname();

  const { data } = useQuery<NotificationData>({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const unread = data?.data?.filter((n) => !n.isRead).length ?? 0;

  const tabs = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/reserve", label: "Find Spot", icon: Search },
    { href: "/my-spot", label: "My Spot", icon: Car },
    { href: "/notifications", label: "Alerts", icon: Bell, badge: unread },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50">
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 min-h-[56px] transition-colors ${
                active ? "text-[#1e4d8c]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
