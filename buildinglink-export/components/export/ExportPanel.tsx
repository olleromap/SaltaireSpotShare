"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Download, Eye, Loader2, AlertCircle } from "lucide-react"

interface Snapshot { id: string; fileName: string | null; recordCount: number; status: string; createdAt: string }
interface Profile { id: string; name: string; targetSchema: { field: string }[] }

interface PreviewData {
  rows: Record<string, string>[]
  totalRows: number
}

export function ExportPanel() {
  const searchParams = useSearchParams()

  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [snapshotId, setSnapshotId] = useState(searchParams.get("snapshotId") ?? "")
  const [profileId, setProfileId] = useState(searchParams.get("profileId") ?? "")
  const [exportType, setExportType] = useState<"full" | "delta">("full")
  const [format, setFormat] = useState<"csv" | "xlsx">("csv")
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [diffSummary, setDiffSummary] = useState<{ added: number; modified: number; removed: number } | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/snapshots").then((r) => r.json()) as Promise<Snapshot[]>,
      fetch("/api/mapping-profiles").then((r) => r.json()) as Promise<Profile[]>,
    ]).then(([s, p]) => {
      setSnapshots(s)
      setProfiles(p)
      if (!snapshotId && s[0]) setSnapshotId(s[0].id)
      if (!profileId && p[0]) setProfileId(p[0].id)
    })
  }, [snapshotId, profileId])

  // Load diff summary when snapshotId changes
  useEffect(() => {
    if (!snapshotId) return
    fetch(`/api/snapshots/${snapshotId}/diff`)
      .then((r) => r.json())
      .then((d: { added: number; modified: number; removed: number }) => setDiffSummary(d))
      .catch(() => {})
  }, [snapshotId])

  async function loadPreview() {
    if (!snapshotId || !profileId) return
    setIsPreviewing(true)
    setPreview(null)
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotId, mappingProfileId: profileId, exportType, format, preview: true }),
      })
      const data = await res.json() as PreviewData & { error?: string }
      if (!res.ok) { toast.error(data.error ?? "Preview failed"); return }
      setPreview(data)
    } finally {
      setIsPreviewing(false)
    }
  }

  async function runExport() {
    if (!snapshotId || !profileId) return
    setIsExporting(true)
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotId, mappingProfileId: profileId, exportType, format }),
      })
      if (!res.ok) {
        const err = await res.json() as { error: string }
        toast.error(err.error ?? "Export failed")
        return
      }
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] ?? `export.${format}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${filename}`)
    } finally {
      setIsExporting(false)
    }
  }

  const selectedProfile = profiles.find((p) => p.id === profileId)
  const selectedSnapshot = snapshots.find((s) => s.id === snapshotId)

  return (
    <div className="space-y-5">
      {/* Snapshot selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Snapshot</label>
        <select
          value={snapshotId}
          onChange={(e) => { setSnapshotId(e.target.value); setPreview(null) }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {snapshots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fileName ?? s.id.slice(-8)} — {s.recordCount} records · {new Date(s.createdAt).toLocaleDateString()}
            </option>
          ))}
        </select>
        {selectedSnapshot && selectedSnapshot.status !== "ready" && (
          <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle size={11} /> This snapshot is still in &quot;{selectedSnapshot.status}&quot; status. Consider cleaning it up first.
          </p>
        )}
      </div>

      {/* Mapping profile selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mapping profile</label>
        <select
          value={profileId}
          onChange={(e) => { setProfileId(e.target.value); setPreview(null) }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.targetSchema.length} columns)</option>
          ))}
        </select>
      </div>

      {/* Export type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Export scope</label>
        <div className="flex gap-3">
          {(["full", "delta"] as const).map((t) => (
            <label key={t} className="flex items-start gap-2 flex-1 cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2.5">
              <input
                type="radio"
                name="exportType"
                value={t}
                checked={exportType === t}
                onChange={() => { setExportType(t); setPreview(null) }}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">{t}</p>
                <p className="text-xs text-gray-500">
                  {t === "full" ? "All records in snapshot" : "Only added, modified, or removed since last extract"}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Delta summary */}
      {exportType === "delta" && diffSummary && (
        <div className="flex gap-4 rounded-md bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm">
          <span className="text-green-600 font-medium">+{diffSummary.added} added</span>
          <span className="text-amber-600 font-medium">~{diffSummary.modified} modified</span>
          <span className="text-red-500 font-medium">−{diffSummary.removed} removed</span>
        </div>
      )}

      {/* Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Format</label>
        <div className="flex gap-3">
          {(["csv", "xlsx"] as const).map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer rounded-md border border-gray-200 bg-white px-4 py-2">
              <input
                type="radio"
                name="format"
                value={f}
                checked={format === f}
                onChange={() => setFormat(f)}
                className="accent-blue-600"
              />
              <span className="text-sm font-medium text-gray-700 uppercase">{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={loadPreview}
          disabled={!snapshotId || !profileId || isPreviewing}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {isPreviewing ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
          Preview
        </button>
        <button
          onClick={runExport}
          disabled={!snapshotId || !profileId || isExporting}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {isExporting ? "Generating…" : "Download"}
        </button>
      </div>

      {/* Preview table */}
      {preview && (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Preview — first {preview.rows.length} of {preview.totalRows} rows
          </p>
          <div className="overflow-auto rounded-md border border-gray-200 bg-white max-h-64">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  {selectedProfile?.targetSchema.map((f) => (
                    <th key={f.field} className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                      {f.field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    {selectedProfile?.targetSchema.map((f) => (
                      <td key={f.field} className="px-3 py-1.5 text-gray-700 max-w-[180px] truncate">
                        {row[f.field] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
