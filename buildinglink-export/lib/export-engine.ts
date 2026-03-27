import * as XLSX from "xlsx"
import { stringify as csvStringify } from "csv-stringify/sync"
import { applyTransform, type TransformKey } from "./transforms"

export interface TargetField {
  field: string
  required?: boolean
  description?: string
}

export interface MappingRule {
  sourceField: string | null // null = use staticValue
  targetField: string
  transform: TransformKey
  staticValue?: string
}

export interface ExportRow {
  data: Record<string, string>
  changeType?: string | null
}

export interface ExportOptions {
  targetSchema: TargetField[]
  mappings: MappingRule[]
  rows: ExportRow[]
  format: "csv" | "xlsx"
  includeChangeType?: boolean // for delta exports
}

export function generateExport(options: ExportOptions): Buffer {
  const { targetSchema, mappings, rows, format, includeChangeType } = options

  const targetFields = targetSchema.map((f) => f.field)
  const mappingIndex = new Map(mappings.map((m) => [m.targetField, m]))

  const outputRows = rows.map((row) => {
    const out: Record<string, string> = {}
    for (const field of targetFields) {
      const rule = mappingIndex.get(field)
      if (!rule) {
        out[field] = ""
        continue
      }
      const rawValue = rule.sourceField ? (row.data[rule.sourceField] ?? "") : ""
      out[field] = applyTransform(rawValue, rule.transform, rule.staticValue)
    }
    if (includeChangeType) {
      out["_change_type"] = row.changeType ?? "unchanged"
    }
    return out
  })

  const headers = includeChangeType ? [...targetFields, "_change_type"] : targetFields

  if (format === "csv") {
    const csv = csvStringify(outputRows, { header: true, columns: headers })
    return Buffer.from(csv, "utf-8")
  } else {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(outputRows, { header: headers })
    XLSX.utils.book_append_sheet(wb, ws, "Export")
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
  }
}

export function generatePreview(
  options: ExportOptions,
  maxRows = 20
): Record<string, string>[] {
  const { targetSchema, mappings, rows } = options
  const targetFields = targetSchema.map((f) => f.field)
  const mappingIndex = new Map(mappings.map((m) => [m.targetField, m]))

  return rows.slice(0, maxRows).map((row) => {
    const out: Record<string, string> = {}
    for (const field of targetFields) {
      const rule = mappingIndex.get(field)
      if (!rule) {
        out[field] = ""
        continue
      }
      const rawValue = rule.sourceField ? (row.data[rule.sourceField] ?? "") : ""
      out[field] = applyTransform(rawValue, rule.transform, rule.staticValue)
    }
    return out
  })
}
