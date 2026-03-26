import { z } from "zod";

const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const CreateAvailabilitySchema = z
  .object({
    spotId: z.string().cuid(),
    startDate: z.string().regex(datetimeRegex, "Use YYYY-MM-DDTHH:MM format"),
    endDate: z.string().regex(datetimeRegex, "Use YYYY-MM-DDTHH:MM format"),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: "End must be after start",
    path: ["endDate"],
  });

export const UpdateAvailabilitySchema = z.object({
  startDate: z.string().regex(datetimeRegex).optional(),
  endDate: z.string().regex(datetimeRegex).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
});

export type CreateAvailabilityInput = z.infer<typeof CreateAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilitySchema>;
