import { z } from "zod";

export const RegisterSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  unitNumber: z.string().optional(),
});

export const InviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2).optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  unitNumber: z.string().optional(),
  role: z.enum(["RESIDENT", "MANAGER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type InviteInput = z.infer<typeof InviteSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
