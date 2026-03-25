import { z } from "zod";

export const CreateReservationSchema = z
  .object({
    availabilityId: z.string().cuid(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    visitorName: z.string().max(100).optional(),
    visitorVehicle: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const CancelReservationSchema = z.object({
  cancelReason: z.string().max(500).optional(),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
