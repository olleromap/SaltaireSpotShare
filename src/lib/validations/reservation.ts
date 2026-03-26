import { z } from "zod";
import { differenceInHours } from "date-fns";

const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const CreateReservationSchema = z
  .object({
    availabilityId: z.string().cuid(),
    startDate: z.string().regex(datetimeRegex, "Use YYYY-MM-DDTHH:MM format"),
    endDate: z.string().regex(datetimeRegex, "Use YYYY-MM-DDTHH:MM format"),
    visitorName: z.string().max(100).optional(),
    visitorVehicle: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: "End must be after start",
    path: ["endDate"],
  })
  .refine((d) => differenceInHours(new Date(d.endDate), new Date(d.startDate)) >= 8, {
    message: "Minimum booking duration is 8 hours",
    path: ["endDate"],
  });

export const CancelReservationSchema = z.object({
  cancelReason: z.string().max(500).optional(),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
