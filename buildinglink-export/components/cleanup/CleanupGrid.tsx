"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { Save, Search, ChevronRight, SkipForward, Loader2, EyeOff, Eye } from "lucide-react"
import { FindReplaceDialog } from "./FindReplaceDialog"

interface DataRecord {
  id: string
  rowIndex: number
  data: Record<string, string>
  isEdited: boolean
  isExcluded: boolean
}

interface Snapshot { id: string; fileName: string | null; recordCount: number; status: string }

// Cell that can be clicked to edit
function EditableCell({
  value,
  onSave,
}: {
  value: string
  onSave: (newValue: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => { setDraft(value) }, [value])

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); if (draft !== value) onSave(draft) }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { setEditing(false); if (draft !== value) onSave(draft) }
          if (e.key === "Escape") { setEditing(false); setDraft(value) }
        }}
        className="w-full border-0 outline-none bg-blue-50 px-1 text-xs"
      />
    )
  }
  return (
    <span
      className="cursor-text block w-full px-1 text-xs truncate"
      onDoubleClick={() => setEditing(true)}
      title={value}
    >
      {value || <span className="text-gray-300 italic">empty</span>}
    </span>
  )
}

export function CleanupGrid() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const snapshotIdParam = searchParams.get("snapshotId")

  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [snapshotId, setSnapshotId] = useState(snapshotIdParam ?? "")
  const [records, setRecords] = useState<DataRecord[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set())

  const PAGE_SIZE = 100

  // Load snapshots for selector
  useEffect(() => {
    fetch("/api/snapshots")
      .then((r) => r.json())
      .then((data: Snapshot[]) => {
        setSnapshots(data)
        if (!snapshotId && data[0]) setSnapshotId(data[0].id)
      })
  }, [snapshotId])

  // Load records
  const loadRecords = useCallback(async () => {
    if (!snapshotId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}/records?page=${page}&limit=${PAGE_SIZE}`)
      const data = await res.json() as { records: DataRecord[]; total: number }
      setRecords(data.records)
      setTotal(data.total)
      if (data.records[0]) {
        setHeaders(Object.keys(data.records[0].data))
      }
    } finally {
      setIsLoading(false)
    }
  }, [snapshotId, page])

  useEffect(() => { loadRecords() }, [loadRecords])

  async function saveCell(recordId: string, field: string, value: string) {
    setPendingSaves((s) => new Set(s).add(recordId))
    const record = records.find((r) => r.id === recordId)
    if (!record) return
    const newData = { ...record.data, [field]: value }
    try {
      await fetch(`/api/snapshots/${snapshotId}/records/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: newData }),
      })
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, data: newData, isEdited: true } : r))
      )
    } catch {
      toast.error("Failed to save change")
    } finally {
      setPendingSaves((s) => { const n = new Set(s); n.delete(recordId); return n })
    }
  }

  async function toggleExclude(recordId: string, exclude: boolean) {
    await fetch(`/api/snapshots/${snapshotId}/records/${recordId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isExcluded: exclude }),
    })
    setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, isExcluded: exclude } : r)))
  }

  async function markReady() {
    await fetch(`/api/snapshots/${snapshotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ready" }),
    })
    toast.success("Snapshot marked as ready — proceed to mapping")
    router.push(`/mapping?snapshotId=${snapshotId}`)
  }

  const columns = useMemo<ColumnDef<DataRecord>[]>(() => {
    const colDefs: ColumnDef<DataRecord>[] = [
      {
        id: "exclude",
        header: "",
        size: 32,
        cell: ({ row }) => (
          <button
            onClick={() => toggleExclude(row.original.id, !row.original.isExcluded)}
            className="p-1 text-gray-300 hover:text-gray-600"
            title={row.original.isExcluded ? "Include row" : "Exclude from export"}
          >
            {row.original.isExcluded ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        ),
      },
      {
        id: "edited",
        header: "",
        size: 20,
        cell: ({ row }) =>
          row.original.isEdited ? (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" title="Edited" />
          ) : null,
      },
    ]

    for (const h of headers) {
      colDefs.push({
        id: h,
        header: h,
        accessorFn: (row) => row.data[h] ?? "",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.data[h] ?? ""}
            onSave={(v) => saveCell(row.original.id, h, v)}
          />
        ),
      })
    }
    return colDefs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, snapshotId])

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const selectedSnapshot = snapshots.find((s) => s.id === snapshotId)
  const editedCount = records.filter((r) => r.isEdited).length
  const excludedCount = records.filter((r) => r.isExcluded).length

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        <select
          value={snapshotId}
          onChange={(e) => { setSnapshotId(e.target.value); setPage(1) }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {snapshots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fileName ?? s.id.slice(-8)} — {s.recordCount} records
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowFindReplace(true)}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          <Search size={13} /> Find & replace
        </button>

        <div className="flex-1" />

        <span className="text-xs text-gray-400">
          {editedCount > 0 && `${editedCount} edited · `}
          {excludedCount > 0 && `${excludedCount} excluded · `}
          {total} rows
        </span>

        {pendingSaves.size > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <Loader2 size={11} className="animate-spin" /> Saving…
          </span>
        )}

        <button
          onClick={markReady}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <ChevronRight size={14} /> Done — go to mapping
        </button>
      </div>

      {/* Stats */}
      {selectedSnapshot && (
        <div className="flex gap-3 text-xs text-gray-500 shrink-0">
          <span>Snapshot: {selectedSnapshot.fileName}</span>
          <span className={`font-medium ${selectedSnapshot.status === "ready" ? "text-green-600" : "text-amber-600"}`}>
            {selectedSnapshot.status === "ready" ? "Ready" : "Pending cleanup"}
          </span>
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-gray-400 shrink-0">
        Double-click any cell to edit · Click <EyeOff size={10} className="inline" /> to exclude a row from export
      </p>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-md border border-gray-200 bg-white text-xs">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <Loader2 size={16} className="animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-gray-200">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="px-2 py-1.5 text-left font-semibold text-gray-600 whitespace-nowrap border-r border-gray-100 last:border-r-0"
                      style={{ width: h.getSize() === 150 ? undefined : h.getSize() }}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${row.original.isExcluded ? "opacity-40" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="py-0.5 border-r border-gray-100 last:border-r-0 max-w-[200px]"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 shrink-0 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {showFindReplace && (
        <FindReplaceDialog
          snapshotId={snapshotId}
          headers={headers}
          onClose={() => setShowFindReplace(false)}
          onComplete={loadRecords}
        />
      )}
    </div>
  )
}
