"use client"

import { useCallback, useState } from "react"
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  onSnapshotCreated: (snapshotId: string) => void
}

export function UploadZone({ onSnapshotCreated }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [notes, setNotes] = useState("")

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
        toast.error("Only CSV, XLS, or XLSX files are supported")
        return
      }

      setIsUploading(true)
      try {
        const fd = new FormData()
        fd.append("file", file)
        if (notes) fd.append("notes", notes)

        const res = await fetch("/api/snapshots", { method: "POST", body: fd })
        const data = await res.json() as { id?: string; error?: string; recordCount?: number }

        if (!res.ok || !data.id) {
          toast.error(data.error ?? "Upload failed")
          return
        }

        toast.success(`Imported ${data.recordCount} records`)
        onSnapshotCreated(data.id)
      } catch {
        toast.error("Network error — please try again")
      } finally {
        setIsUploading(false)
      }
    },
    [notes, onSnapshotCreated]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
      >
        {isUploading ? (
          <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
        ) : (
          <FileSpreadsheet size={32} className="text-gray-400 mb-3" />
        )}
        <p className="text-sm font-medium text-gray-700 mb-1">
          {isUploading ? "Uploading…" : "Drop your BuildingLink export here"}
        </p>
        <p className="text-xs text-gray-400 mb-4">CSV, XLS, or XLSX · max 10MB</p>

        {!isUploading && (
          <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Upload size={14} />
            Browse file
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </label>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Notes (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Q1 2026 resident roster"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500">
        <strong>How to export from BuildingLink:</strong>
        <ol className="mt-1 ml-3 list-decimal space-y-0.5">
          <li>Go to Residents → Resident Directory</li>
          <li>Set Page Size to "All"</li>
          <li>Click the Excel export button</li>
          <li>Upload the downloaded file here</li>
        </ol>
      </div>
    </div>
  )
}
