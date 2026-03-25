import { z } from "zod";

export const CreateAvailabilitySchema = z
  .object({
    spotId: z.string().cuid(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const UpdateAvailabilitySchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().max(500).optional(),
    status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
  });

export type CreateAvailabilityInput = z.infer<typeof CreateAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilitySchema>;
