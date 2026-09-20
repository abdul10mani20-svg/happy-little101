import { z } from "zod";

export const durationSchema = z.object({
  days: z.coerce.number().int().min(0).max(3650).default(0),
  hours: z.coerce.number().int().min(0).max(23).default(0),
  minutes: z.coerce.number().int().min(0).max(59).default(0),
  seconds: z.coerce.number().int().min(0).max(59).default(0),
}).refine((value) => value.days + value.hours + value.minutes + value.seconds > 0, {
  message: "Enter a duration greater than zero",
});

export const createLicenseSchema = z.object({
  customerName: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(50).default(""),
  email: z.union([z.string().trim().email(), z.literal("")]).default(""),
  handle: z.string().trim().max(80).default(""),
  customerNotes: z.string().trim().max(2000).default(""),
  licenseNotes: z.string().trim().max(2000).default(""),
  licenseType: z.enum(["trial", "paid", "custom"]),
  duration: durationSchema,
  amountPaid: z.coerce.number().min(0).max(9999999999).default(0),
  paymentReference: z.string().trim().max(120).default(""),
  deviceLimit: z.coerce.number().int().min(1).max(100).default(1),
});

export const updateCustomerSchema = createLicenseSchema
  .omit({ licenseType: true, duration: true, deviceLimit: true })
  .extend({ licenseId: z.string().uuid() });

export const licenseActionSchema = z.object({
  licenseId: z.string().uuid(),
  action: z.enum(["extend", "revoke", "reactivate", "reset_device", "archive"]),
  seconds: z.coerce.number().int().positive().optional(),
});

export const deviceLimitSchema = z.object({
  licenseId: z.string().uuid(),
  deviceLimit: z.coerce.number().int().min(1).max(100),
});

export const licenseIdSchema = z.object({ licenseId: z.string().uuid() });

export const bulkDeleteSchema = z.object({ scope: z.enum(["expired", "revoked"]) });

export const validationRequestSchema = z.object({
  operation: z.enum(["activate", "check", "deactivate"]),
  licenseKey: z.string().trim().min(16).max(100),
  productIdentifier: z.string().trim().min(3).max(64),
  deviceIdentifier: z.string().trim().min(8).max(512),
});

export type CreateLicenseInput = z.infer<typeof createLicenseSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export function durationToSeconds(duration: z.infer<typeof durationSchema>) {
  return duration.days * 86400 + duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
}