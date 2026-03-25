import { prisma } from "@/lib/prisma";
import type { ActivityAction } from "@prisma/client";

interface LogActivityOptions {
  action: ActivityAction;
  actorId?: string;
  spotId?: string;
  targetId?: string;
  targetType?: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(opts: LogActivityOptions) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.activityLog.create as any)({
      data: {
        action: opts.action,
        actorId: opts.actorId ?? null,
        spotId: opts.spotId ?? null,
        targetId: opts.targetId ?? null,
        targetType: opts.targetType ?? null,
        meta: opts.meta ?? null,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch {
    // Non-fatal — never block the main operation
    console.error("[activity-log] Failed to log activity:", opts.action);
  }
}
