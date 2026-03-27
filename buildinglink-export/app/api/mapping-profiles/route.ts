import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

/**
 * Built-in target system templates.
 * Each template defines:
 *   - targetSystem: stable slug used to identify the system
 *   - targetSchema: the columns the target system expects (in order)
 *   - mappings: pre-wired suggestions — users can adjust before exporting
 *
 * Mappings use common BuildingLink export column names.
 * If a column name differs in the user's actual export, they edit the mapping
 * once and save — the profile remembers it forever.
 */
const BUILT_IN_TEMPLATES = [
  // ── PDK.io Access Control ───────────────────────────────────────────────────
  {
    name: "PDK.io — Access Control",
    description:
      "Import format for PDK.io (ProdataKey) access control system. " +
      "Controls door entry for residents based on unit status.",
    targetSystem: "pdk_io",
    isTemplate: true,
    targetSchema: [
      { field: "First Name", required: true, hint: "Resident first name" },
      { field: "Last Name", required: true, hint: "Resident last name" },
      { field: "Email", required: false, hint: "Used for Bluetooth / Mobile App credential invites" },
      { field: "Groups", required: false, hint: 'e.g. "Residents" — creates the group if it does not exist' },
      { field: "Enabled", required: false, hint: "1 = active, 0 = disabled" },
      { field: "Active Date", required: false, hint: "YYYY-MM-DD format" },
      { field: "Expire Date", required: false, hint: "YYYY-MM-DD — leave blank for no expiry" },
      { field: "Cards", required: false, hint: "Card numbers separated by commas" },
    ],
    mappings: [
      { sourceField: "First Name", targetField: "First Name", transform: "trim" },
      { sourceField: "Last Name", targetField: "Last Name", transform: "trim" },
      { sourceField: "Email", targetField: "Email", transform: "lowercase" },
      { sourceField: null, targetField: "Groups", transform: "static_value", staticValue: "Residents" },
      { sourceField: null, targetField: "Enabled", transform: "static_value", staticValue: "1" },
    ],
  },

  // ── Evite / Event Planning ──────────────────────────────────────────────────
  {
    name: "Evite — Guest List",
    description:
      "Guest import format for Evite.com and similar event planning platforms " +
      "(Paperless Post, Canva Invites, etc.). Email is the only required field.",
    targetSystem: "evite",
    isTemplate: true,
    targetSchema: [
      { field: "First Name", required: true, hint: "Appears on the invitation" },
      { field: "Last Name", required: false, hint: "Optional on most platforms" },
      { field: "Email", required: true, hint: "Invitation is sent here" },
    ],
    mappings: [
      { sourceField: "First Name", targetField: "First Name", transform: "trim" },
      { sourceField: "Last Name", targetField: "Last Name", transform: "trim" },
      { sourceField: "Email", targetField: "Email", transform: "lowercase" },
    ],
  },

  // ── Generic Event / Guest List ──────────────────────────────────────────────
  {
    name: "Event Planning — Full Guest List",
    description:
      "Broader guest list with unit number for building events. " +
      "Works with Eventbrite, Splash, Hopin, or any CSV-based invite platform.",
    targetSystem: "event_generic",
    isTemplate: true,
    targetSchema: [
      { field: "First Name", required: true },
      { field: "Last Name", required: false },
      { field: "Email", required: true },
      { field: "Phone", required: false },
      { field: "Unit", required: false, hint: "Useful for check-in at building events" },
      { field: "Notes", required: false },
    ],
    mappings: [
      { sourceField: "First Name", targetField: "First Name", transform: "trim" },
      { sourceField: "Last Name", targetField: "Last Name", transform: "trim" },
      { sourceField: "Email", targetField: "Email", transform: "lowercase" },
      { sourceField: "Phone", targetField: "Phone", transform: "phone_digits" },
      { sourceField: "Unit", targetField: "Unit", transform: "trim" },
    ],
  },

  // ── Emergency / Contact Directory ───────────────────────────────────────────
  {
    name: "Emergency Contact Directory",
    description:
      "Resident contact list for building emergencies, board communications, " +
      "or distribution to management staff.",
    targetSystem: "contact_directory",
    isTemplate: true,
    targetSchema: [
      { field: "Unit", required: true },
      { field: "Full Name", required: true },
      { field: "Phone", required: false },
      { field: "Email", required: false },
      { field: "Move-in Date", required: false },
    ],
    mappings: [
      { sourceField: "Unit", targetField: "Unit", transform: "trim" },
      { sourceField: "First Name", targetField: "Full Name", transform: "trim" },
      { sourceField: "Phone", targetField: "Phone", transform: "phone_digits" },
      { sourceField: "Email", targetField: "Email", transform: "lowercase" },
      { sourceField: "Move-in Date", targetField: "Move-in Date", transform: "date_iso" },
    ],
  },

  // ── Generic Access Control ──────────────────────────────────────────────────
  {
    name: "Generic Access Control",
    description:
      "Minimal resident import for Latch, ButterflyMX, Verkada, or any " +
      "access/intercom system that accepts a CSV of residents.",
    targetSystem: "access_generic",
    isTemplate: true,
    targetSchema: [
      { field: "First Name", required: true },
      { field: "Last Name", required: true },
      { field: "Unit", required: false },
      { field: "Email", required: false },
      { field: "Phone", required: false },
      { field: "Status", required: false, hint: "e.g. Active / Inactive" },
    ],
    mappings: [
      { sourceField: "First Name", targetField: "First Name", transform: "trim" },
      { sourceField: "Last Name", targetField: "Last Name", transform: "trim" },
      { sourceField: "Unit", targetField: "Unit", transform: "trim" },
      { sourceField: "Email", targetField: "Email", transform: "lowercase" },
      { sourceField: "Phone", targetField: "Phone", transform: "phone_digits" },
    ],
  },
]

// GET /api/mapping-profiles
export async function GET() {
  const profiles = await prisma.mappingProfile.findMany({
    orderBy: [{ isTemplate: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      targetSystem: true,
      isTemplate: true,
      targetSchema: true,
      mappings: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // Seed built-in templates on first run
  const hasTemplates = profiles.some((p) => p.isTemplate)
  if (!hasTemplates) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.mappingProfile.createMany({ data: BUILT_IN_TEMPLATES as any[] })
    return GET()
  }

  return NextResponse.json(profiles)
}

// POST /api/mapping-profiles
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    name: string
    description?: string
    targetSystem?: string
    targetSchema: unknown[]
    mappings: unknown[]
  }

  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 })

  const profile = await prisma.mappingProfile.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      targetSystem: body.targetSystem ?? null,
      targetSchema: (body.targetSchema ?? []) as object[],
      mappings: (body.mappings ?? []) as object[],
    },
  })
  return NextResponse.json(profile, { status: 201 })
}
