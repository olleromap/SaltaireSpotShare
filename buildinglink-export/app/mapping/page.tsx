"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, ArrowRight, Copy, Trash2, Download } from "lucide-react"
import { toast } from "sonner"
import { formatDateShort } from "@/lib/utils"

interface Profile {
  id: string
  name: string
  description: string | null
  targetSystem: string | null
  isTemplate: boolean
  targetSchema: { field: string; hint?: string }[]
  mappings: { sourceField: string | null; targetField: string; transform: string; staticValue?: string }[]
  createdAt: string
  updatedAt: string
}

const SYSTEM_ICONS: Record<string, string> = {
  pdk_io: "🔑",
  evite: "✉️",
  event_generic: "🎉",
  contact_directory: "📋",
  access_generic: "🚪",
}

const SYSTEM_LABELS: Record<string, string> = {
  pdk_io: "PDK.io",
  evite: "Evite",
  event_generic: "Event Planning",
  contact_directory: "Contact Directory",
  access_generic: "Access Control",
}

export default function MappingPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/mapping-profiles")
      .then((r) => r.json())
      .then((data: Profile[]) => setProfiles(data))
      .finally(() => setIsLoading(false))
  }, [])

  async function useTemplate(template: Profile) {
    // Create a new editable copy from the template, with mappings pre-populated
    const res = await fetch("/api/mapping-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: template.name,
        description: template.description,
        targetSystem: template.targetSystem,
        targetSchema: template.targetSchema,
        mappings: template.mappings,
      }),
    })
    const data = await res.json() as Profile & { id: string }
    toast.success("Profile created — update field names to match your export")
    window.location.href = `/mapping/${data.id}`
  }

  async function duplicate(p: Profile) {
    const res = await fetch("/api/mapping-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${p.name} (copy)`,
        description: p.description,
        targetSystem: p.targetSystem,
        targetSchema: p.targetSchema,
        mappings: p.mappings,
      }),
    })
    const data = await res.json() as Profile
    setProfiles((prev) => [data, ...prev.filter((x) => !x.isTemplate), ...prev.filter((x) => x.isTemplate)])
    toast.success("Profile duplicated — you can now edit it")
  }

  async function remove(id: string) {
    if (!confirm("Delete this profile? This cannot be undone.")) return
    await fetch(`/api/mapping-profiles/${id}`, { method: "DELETE" })
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    toast.success("Deleted")
  }

  async function createBlank() {
    const res = await fetch("/api/mapping-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New target system", targetSchema: [], mappings: [] }),
    })
    const data = await res.json() as Profile & { id: string }
    window.location.href = `/mapping/${data.id}`
  }

  const templates = profiles.filter((p) => p.isTemplate)
  const custom = profiles.filter((p) => !p.isTemplate)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Target System Profiles</h1>
        <p className="text-sm text-gray-500">
          Each profile maps BuildingLink fields to one target system. Configure once, reuse for
          every export. Transforms (split name, format date, set static values) are saved in the profile.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 mb-6 text-xs text-blue-800 leading-5">
        <strong>How profiles work:</strong> Start from a template below → adjust the field mapping
        to match your BuildingLink column names → save. That profile is now reusable — every future
        export to that system takes one click.
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Templates */}
          {templates.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Start from a template
              </p>
              <div className="space-y-2">
                {templates.map((p) => (
                  <TemplateCard key={p.id} profile={p} onUse={useTemplate} />
                ))}
              </div>
            </section>
          )}

          {/* Custom profiles */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Your profiles {custom.length > 0 && `(${custom.length})`}
              </p>
              <button
                onClick={createBlank}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={11} /> New blank
              </button>
            </div>

            {custom.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">
                No profiles yet. Use a template above to get started quickly.
              </p>
            ) : (
              <div className="space-y-2">
                {custom.map((p) => (
                  <ProfileCard key={p.id} profile={p} onDuplicate={duplicate} onDelete={remove} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function TemplateCard({ profile, onUse }: { profile: Profile; onUse: (p: Profile) => void }) {
  const icon = profile.targetSystem ? (SYSTEM_ICONS[profile.targetSystem] ?? "📄") : "📄"
  const mappedCount = profile.mappings.filter((m) => m.sourceField).length
  const staticCount = profile.mappings.filter((m) => !m.sourceField && m.staticValue).length

  return (
    <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 transition-colors">
      <span className="text-xl shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{profile.name}</p>
        {profile.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{profile.description}</p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-400">
          <span>{profile.targetSchema.length} output columns</span>
          {mappedCount > 0 && <span>{mappedCount} fields pre-mapped</span>}
          {staticCount > 0 && <span>{staticCount} static defaults</span>}
        </div>
        {/* Field preview chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {profile.targetSchema.slice(0, 5).map((f) => (
            <span
              key={f.field}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
            >
              {f.field}
              {f.hint && <span className="text-gray-400 ml-1">— {f.hint}</span>}
            </span>
          ))}
          {profile.targetSchema.length > 5 && (
            <span className="text-xs text-gray-400">+{profile.targetSchema.length - 5} more</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onUse(profile)}
        className="shrink-0 flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Use template <ArrowRight size={11} />
      </button>
    </div>
  )
}

function ProfileCard({
  profile,
  onDuplicate,
  onDelete,
}: {
  profile: Profile
  onDuplicate: (p: Profile) => void
  onDelete: (id: string) => void
}) {
  const icon = profile.targetSystem ? (SYSTEM_ICONS[profile.targetSystem] ?? "📄") : "📄"
  const systemLabel = profile.targetSystem
    ? (SYSTEM_LABELS[profile.targetSystem] ?? profile.targetSystem)
    : null
  const mappedCount = profile.mappings.filter((m) => m.sourceField).length

  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
          {systemLabel && (
            <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
              {systemLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {profile.targetSchema.length} columns · {mappedCount} mapped · updated{" "}
          {formatDateShort(profile.updatedAt)}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/export?profileId=${profile.id}`}
          className="p-1.5 text-gray-400 hover:text-green-600 rounded"
          title="Export with this profile"
        >
          <Download size={13} />
        </Link>
        <button
          onClick={() => onDuplicate(profile)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
          title="Duplicate"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={() => onDelete(profile.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
        <Link
          href={`/mapping/${profile.id}`}
          className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  )
}
