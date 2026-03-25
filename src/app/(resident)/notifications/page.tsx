"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  linkHref: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: Notification[] }>({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
  });

  const markAllRead = useMutation({
    mutationFn: () => fetch("/api/notifications", { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.data ?? [];
  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unread.length > 0 && (
            <p className="text-slate-500 text-sm mt-1">{unread.length} unread</p>
          )}
        </div>
        {unread.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[#1e4d8c] text-sm gap-1"
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck size={14} />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Bell size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const content = (
              <Card
                className={`transition-shadow hover:shadow-sm ${!n.isRead ? "border-[#1e4d8c]/30 bg-blue-50/30" : ""}`}
              >
                <CardContent className="p-4 flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? "bg-[#1e4d8c]" : "bg-transparent"}`} />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-sm">{n.title}</div>
                    <div className="text-slate-600 text-sm mt-0.5">{n.body}</div>
                    <div className="text-slate-400 text-xs mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            return n.linkHref ? (
              <Link key={n.id} href={n.linkHref}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
