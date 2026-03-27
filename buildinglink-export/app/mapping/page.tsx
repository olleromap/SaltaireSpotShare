"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, ArrowRight, Copy, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDateShort } from "@/lib/utils"

interface Profile {
  id: string
  name: string
  description: string | null
  isTemplate: boolean
  targetSchema: { field: string }[]
  createdAt: string
  updatedAt: string
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

  async function duplicate(p: Profile) {
    const res = await fetch("/api/mapping-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${p.name} (copy)`,
        description: p.description,
        targetSchema: p.targetSchema,
        mappings: [],
      }),
    })
    const data = await res.json() as Profile
    setProfiles((prev) => [data, ...prev])
    toast.success("Profile duplicated")
  }

  async function remove(id: string) {
    if (!confirm("Delete this mapping profile?")) return
    await fetch(`/api/mapping-profiles/${id}`, { method: "DELETE" })
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    toast.success("Deleted")
  }

  async function createNew() {
    const res = await fetch("/api/mapping-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New mapping", targetSchema: [], mappings: [] }),
    })
    const data = await res.json() as Profile & { id: string }
    window.location.href = `/mapping/${data.id}`
  }

  const templates = profiles.filter((p) => p.isTemplate)
  const custom = profiles.filter((p) => !p.isTemplate)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Field Mapping</h1>
          <p className="text-sm text-gray-500">
            Map BuildingLink fields to target system columns. Each profile can be reused across exports.
          </p>
        </div>
        <button
          onClick={createNew}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={14} /> New profile
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-6">
          {templates.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Templates</p>
              <div className="space-y-2">
                {templates.map((p) => (
                  <ProfileCard key={p.id} profile={p} onDuplicate={duplicate} onDelete={remove} />
                ))}
              </div>
            </div>
          )}

          {custom.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Your profiles</p>
              <div className="space-y-2">
                {custom.map((p) => (
                  <ProfileCard key={p.id} profile={p} onDuplicate={duplicate} onDelete={remove} />
                ))}
              </div>
            </div>
          )}

          {profiles.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              No profiles yet. Create one to get started.
            </div>
          )}
        </div>
      )}
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
  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
        {profile.description && (
          <p className="text-xs text-gray-500 truncate">{profile.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {profile.targetSchema.length} columns · updated {formatDateShort(profile.updatedAt)}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onDuplicate(profile)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
          title="Duplicate"
        >
          <Copy size={13} />
        </button>
        {!profile.isTemplate && (
          <button
            onClick={() => onDelete(profile.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        )}
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
