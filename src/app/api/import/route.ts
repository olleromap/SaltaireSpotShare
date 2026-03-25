import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processBulkImport } from "@/lib/import-parser";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: { code: "NO_FILE", message: "No file uploaded" } }, { status: 400 });
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: { code: "FILE_TOO_LARGE", message: "File must be under 5MB" } }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || file.name;

  try {
    const result = await processBulkImport(buffer, mimeType, session.user.id);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: { code: "IMPORT_FAILED", message: err instanceof Error ? err.message : "Import failed" } },
      { status: 500 }
    );
  }
}
