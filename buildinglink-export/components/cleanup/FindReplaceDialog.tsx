"use client"

import { useState } from "react"
import { toast } from "sonner"
import { X, Loader2 } from "lucide-react"

interface Props {
  snapshotId: string
  headers: string[]
  onClose: () => void
  onComplete: () => void
}

export function FindReplaceDialog({ snapshotId, headers, onClose, onComplete }: Props) {
  const [column, setColumn] = useState(headers[0] ?? "")
  const [find, setFind] = useState("")
  const [replace, setReplace] = useState("")
  const [useRegex, setUseRegex] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  async function run() {
    if (!find && !column) return
    setIsRunning(true)
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}/bulk-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "find_replace", column, find, replace, useRegex }),
      })
      const data = await res.json() as { updatedCount: number }
      toast.success(`Updated ${data.updatedCount} cells`)
      onComplete()
      onClose()
    } finally {
      setIsRunning(false)
    }
  }

  async function fillColumn() {
    setIsRunning(true)
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}/bulk-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "fill_column", column, value: replace }),
      })
      const data = await res.json() as { updatedCount: number }
      toast.success(`Filled ${data.updatedCount} empty cells`)
      onComplete()
      onClose()
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Find & Replace</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Column</label>
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {headers.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Find</label>
            <input
              type="text"
              value={find}
              onChange={(e) => setFind(e.target.value)}
              placeholder="Text to find"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Replace with</label>
            <input
              type="text"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="Replacement text (blank to delete)"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
              className="accent-blue-600"
            />
            Use regex
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={run}
            disabled={isRunning || !find}
            className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? <Loader2 size={13} className="inline animate-spin mr-1" /> : null}
            Replace
          </button>
          <button
            onClick={fillColumn}
            disabled={isRunning || !replace}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Fill empty cells in this column with the Replace value"
          >
            Fill empty
          </button>
        </div>
      </div>
    </div>
  )
}
