import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

const ImportRowSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name required"),
  unit_number: z.string().optional(),
  phone: z.string().optional(),
  spot_number: z.string().optional(),
  floor: z.coerce.number().int().min(1).max(6).optional(),
  section: z.string().optional(),
  notes: z.string().optional(),
});

export type ImportRow = z.infer<typeof ImportRowSchema>;

export interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

function bufferToRows(buffer: Buffer, mimeType: string): Record<string, string>[] {
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("xlsx") ||
    mimeType.includes("xls")
  ) {
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
  }
  return parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
}

export async function processBulkImport(
  buffer: Buffer,
  mimeType: string,
  actorId: string
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, errors: [] };

  await logActivity({ action: "BULK_IMPORT_STARTED", actorId });

  let rawRows: Record<string, string>[];
  try {
    rawRows = bufferToRows(buffer, mimeType);
  } catch (err) {
    await logActivity({ action: "BULK_IMPORT_FAILED", actorId, meta: { error: String(err) } });
    throw new Error("Failed to parse file. Ensure it is a valid CSV or Excel file.");
  }

  for (let i = 0; i < rawRows.length; i++) {
    const parsed = ImportRowSchema.safeParse(rawRows[i]);
    if (!parsed.success) {
      result.errors.push({
        row: i + 2,
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
      continue;
    }

    const row = parsed.data;
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { email: row.email } });
        if (existing) {
          await tx.user.update({
            where: { email: row.email },
            data: {
              name: row.name,
              phone: row.phone ?? existing.phone,
              unitNumber: row.unit_number ?? existing.unitNumber,
            },
          });
          result.updated++;
        } else {
          await tx.user.create({
            data: {
              email: row.email,
              name: row.name,
              phone: row.phone,
              unitNumber: row.unit_number,
              role: "RESIDENT",
            },
          });
          result.created++;
        }

        if (row.spot_number) {
          const user = await tx.user.findUnique({ where: { email: row.email } });
          if (user) {
            await tx.parkingSpot.upsert({
              where: { spotNumber: row.spot_number },
              update: { ownerId: user.id, floor: row.floor ?? 1, section: row.section },
              create: {
                spotNumber: row.spot_number,
                floor: row.floor ?? 1,
                section: row.section,
                notes: row.notes,
                ownerId: user.id,
              },
            });
          }
        }
      });
    } catch (err) {
      result.errors.push({ row: i + 2, message: `DB error: ${String(err)}` });
    }
  }

  await logActivity({
    action: "BULK_IMPORT_COMPLETED",
    actorId,
    meta: { created: result.created, updated: result.updated, errors: result.errors.length },
  });

  return result;
}
