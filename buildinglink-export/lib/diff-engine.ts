export type ChangeType = "added" | "modified" | "removed"

export interface RecordLike {
  id: string
  rowIndex: number
  data: Record<string, string>
  isExcluded: boolean
}

export interface DiffResult {
  added: string[]    // ids in current snapshot
  modified: string[] // ids in current snapshot
  removed: RecordLike[] // records from previous snapshot not in current
  unchanged: string[]
}

/**
 * Normalize a value for comparison: lowercase + trimmed.
 * Prevents false positives from whitespace or casing differences.
 */
function normalize(v: unknown): string {
  return String(v ?? "").trim().toLowerCase()
}

/**
 * Generate a stable key for a record to match across snapshots.
 * Uses unit number + email as composite key if both are present.
 * Falls back to email only, then unit only, then rowIndex.
 */
function recordKey(data: Record<string, string>): string {
  const email = normalize(
    data["Email"] ?? data["email"] ?? data["E-mail"] ?? data["EMAIL"] ?? ""
  )
  const unit = normalize(
    data["Unit"] ?? data["Unit #"] ?? data["Unit Number"] ?? data["UNIT"] ?? ""
  )
  const name = normalize(
    data["Name"] ?? data["Full Name"] ?? data["Resident Name"] ?? ""
  )

  if (email) return `email:${email}`
  if (unit && name) return `unit+name:${unit}|${name}`
  if (unit) return `unit:${unit}`
  return `name:${name}`
}

/**
 * Compare two record data objects, returning changed field names.
 */
function changedFields(
  prev: Record<string, string>,
  curr: Record<string, string>
): string[] {
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)])
  return [...allKeys].filter((k) => normalize(prev[k]) !== normalize(curr[k]))
}

export function computeDiff(
  prevRecords: RecordLike[],
  currRecords: RecordLike[]
): {
  changeMap: Map<string, { changeType: ChangeType; changedFields?: string[] }>
  removedRecords: RecordLike[]
} {
  const prevMap = new Map<string, RecordLike>()
  for (const r of prevRecords) {
    if (!r.isExcluded) prevMap.set(recordKey(r.data), r)
  }

  const changeMap = new Map<string, { changeType: ChangeType; changedFields?: string[] }>()
  const matchedPrevKeys = new Set<string>()

  for (const curr of currRecords) {
    if (curr.isExcluded) continue
    const key = recordKey(curr.data)
    const prev = prevMap.get(key)

    if (!prev) {
      changeMap.set(curr.id, { changeType: "added" })
    } else {
      matchedPrevKeys.add(key)
      const changed = changedFields(prev.data, curr.data)
      if (changed.length > 0) {
        changeMap.set(curr.id, { changeType: "modified", changedFields: changed })
      }
    }
  }

  const removedRecords = prevRecords.filter(
    (r) => !r.isExcluded && !matchedPrevKeys.has(recordKey(r.data))
  )

  return { changeMap, removedRecords }
}
