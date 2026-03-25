import { prisma } from "@/lib/prisma";

type NotificationType =
  | "reservation_confirmed"
  | "reservation_cancelled"
  | "spot_available"
  | "dispute_opened"
  | "dispute_resolved"
  | "invite_sent";

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkHref?: string;
}

export async function createNotification(opts: CreateNotificationOptions) {
  try {
    await prisma.notification.create({ data: opts });
  } catch {
    console.error("[notifications] Failed to create notification for user:", opts.userId);
  }
}
