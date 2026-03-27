export type TransformKey =
  | "none"
  | "split_first"
  | "split_last"
  | "uppercase"
  | "lowercase"
  | "trim"
  | "date_iso"
  | "phone_digits"
  | "static_value"
  | "boolean_one_zero"

export interface TransformDefinition {
  key: TransformKey
  label: string
  description: string
  requiresInput?: boolean
}

export const TRANSFORMS: TransformDefinition[] = [
  { key: "none", label: "None", description: "Pass value through unchanged" },
  {
    key: "split_first",
    label: "First name (split)",
    description: 'Extract first word from "Jane Smith" → "Jane"',
  },
  {
    key: "split_last",
    label: "Last name (split)",
    description: 'Extract last word from "Jane Smith" → "Smith"',
  },
  { key: "uppercase", label: "Uppercase", description: '"jane" → "JANE"' },
  { key: "lowercase", label: "Lowercase", description: '"JANE" → "jane"' },
  { key: "trim", label: "Trim whitespace", description: '"  Jane  " → "Jane"' },
  {
    key: "date_iso",
    label: "Date → ISO (YYYY-MM-DD)",
    description: '"03/27/2026" → "2026-03-27"',
  },
  {
    key: "phone_digits",
    label: "Phone digits only",
    description: '"(555) 123-4567" → "5551234567"',
  },
  {
    key: "static_value",
    label: "Static value",
    description: "Always output a fixed string (set in mapping)",
    requiresInput: true,
  },
  {
    key: "boolean_one_zero",
    label: "Boolean → 1/0",
    description: '"Yes"/"True"/"Active" → "1", else "0"',
  },
]

export function applyTransform(
  value: string | null | undefined,
  transform: TransformKey,
  staticValue?: string
): string {
  const v = String(value ?? "").trim()

  switch (transform) {
    case "none":
      return v

    case "split_first": {
      const parts = v.trim().split(/\s+/)
      return parts[0] ?? v
    }

    case "split_last": {
      const parts = v.trim().split(/\s+/)
      return parts.length > 1 ? (parts[parts.length - 1] ?? v) : v
    }

    case "uppercase":
      return v.toUpperCase()

    case "lowercase":
      return v.toLowerCase()

    case "trim":
      return v.trim()

    case "date_iso": {
      // Handle MM/DD/YYYY or M/D/YYYY
      const match = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (match) {
        const [, m, d, y] = match
        return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`
      }
      // Already ISO or unknown
      return v
    }

    case "phone_digits":
      return v.replace(/\D/g, "")

    case "static_value":
      return staticValue ?? ""

    case "boolean_one_zero": {
      const truthy = ["yes", "true", "active", "1", "y"]
      return truthy.includes(v.toLowerCase()) ? "1" : "0"
    }

    default:
      return v
  }
}
