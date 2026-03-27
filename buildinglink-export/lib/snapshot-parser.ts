import * as XLSX from "xlsx"
import { parse as csvParse } from "csv-parse/sync"

export interface ParsedRow {
  rowIndex: number
  data: Record<string, string>
}

export interface ParseResult {
  headers: string[]
  rows: ParsedRow[]
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function parseBuffer(buffer: Buffer, filename: string): ParseResult {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("File too large (max 10MB)")
  }

  const ext = filename.split(".").pop()?.toLowerCase()

  if (ext === "csv") {
    return parseCsv(buffer)
  } else if (ext === "xlsx" || ext === "xls") {
    return parseExcel(buffer)
  } else {
    throw new Error("Unsupported file format. Use CSV, XLS, or XLSX.")
  }
}

function parseCsv(buffer: Buffer): ParseResult {
  const records = csvParse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[]

  if (records.length === 0) {
    throw new Error("File is empty or has no data rows")
  }

  const headers = Object.keys(records[0]!)

  const rows: ParsedRow[] = records.map((record, i) => ({
    rowIndex: i,
    data: Object.fromEntries(
      Object.entries(record).map(([k, v]) => [k.trim(), String(v ?? "").trim()])
    ),
  }))

  return { headers, rows }
}

function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error("Excel file has no sheets")

  const sheet = workbook.Sheets[sheetName]!
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  })

  if (raw.length === 0) {
    throw new Error("Sheet is empty or has no data rows")
  }

  const headers = Object.keys(raw[0]!)

  const rows: ParsedRow[] = raw.map((record, i) => ({
    rowIndex: i,
    data: Object.fromEntries(
      Object.entries(record).map(([k, v]) => [k.trim(), String(v ?? "").trim()])
    ),
  }))

  return { headers, rows }
}
