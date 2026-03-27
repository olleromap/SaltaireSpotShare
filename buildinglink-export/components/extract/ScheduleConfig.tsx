"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Job {
  id: string
  enabled: boolean
  cronPattern: string
  lastRunAt: string | null
  nextRunAt: string | null
  lastStatus: string | null
  lastMessage: string | null
  credentialId: string | null
}

interface Credential { id: string; label: string }

const PRESETS = [
  { label: "Daily at 2am", value: "0 2 * * *" },
  { label: "Daily at 6am", value: "0 6 * * *" },
  { label: "Every Monday at 8am", value: "0 8 * * 1" },
  { label: "Twice daily (6am & 6pm)", value: "0 6,18 * * *" },
  { label: "Custom", value: "custom" },
]

export function ScheduleConfig() {
  const [job, setJob] = useState<Job | null>(null)
  const [creds, setCreds] = useState<Credential[]>([])
  const [preset, setPreset] = useState("0 2 * * *")
  const [customCron, setCustomCron] = useState("")
  const [credentialId, setCredentialId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/schedule").then((r) => r.json()) as Promise<Job>,
      fetch("/api/credentials").then((r) => r.json()) as Promise<Credential[]>,
    ]).then(([j, c]) => {
      setJob(j)
      setCreds(c)
      setPreset(j.cronPattern)
      setCredentialId(j.credentialId ?? c[0]?.id ?? "")
    })
  }, [])

  async function save(enabled: boolean) {
    const cronPattern = preset === "custom" ? customCron : preset
    if (!cronPattern) { toast.error("Select a schedule"); return }

    setIsSaving(true)
    try {
      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, cronPattern, credentialId: credentialId || undefined }),
      })
      const data = await res.json() as Job
      setJob(data)
      toast.success(enabled ? "Schedule enabled" : "Schedule disabled")
    } finally {
      setIsSaving(false)
    }
  }

  if (!job) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="space-y-5 max-w-md">
      <div className="rounded-md border border-gray-200 bg-white p-4 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${job.enabled ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="font-medium">{job.enabled ? "Enabled" : "Disabled"}</span>
        </div>
        {job.lastRunAt && (
          <p className="text-gray-500">Last run: {formatDate(job.lastRunAt)} — {job.lastStatus}</p>
        )}
        {job.nextRunAt && job.enabled && (
          <p className="text-gray-500">Next run: {formatDate(job.nextRunAt)}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
        <div className="space-y-2">
          {PRESETS.map((p) => (
            <label key={p.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="preset"
                value={p.value}
                checked={preset === p.value}
                onChange={() => setPreset(p.value)}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">{p.label}</span>
              {p.value !== "custom" && (
                <code className="text-xs text-gray-400 font-mono">{p.value}</code>
              )}
            </label>
          ))}
        </div>
        {preset === "custom" && (
          <input
            type="text"
            value={customCron}
            onChange={(e) => setCustomCron(e.target.value)}
            placeholder="* * * * *"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {creds.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Use credentials
          </label>
          <select
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {creds.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => save(true)}
          disabled={isSaving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="inline animate-spin mr-1" /> : null}
          Save & enable
        </button>
        {job.enabled && (
          <button
            onClick={() => save(false)}
            disabled={isSaving}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Disable
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Note: Scheduled runs require the app to be deployed on Railway or Render (not Vercel).
        A background worker process manages the cron schedule.
      </p>
    </div>
  )
}
