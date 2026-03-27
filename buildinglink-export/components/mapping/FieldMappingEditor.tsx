"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { GripVertical, Plus, Trash2, ChevronRight, Loader2 } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TRANSFORMS, type TransformKey } from "@/lib/transforms"
import type { MappingRule, TargetField } from "@/lib/export-engine"

interface Profile {
  id: string
  name: string
  targetSchema: TargetField[]
  mappings: MappingRule[]
}

interface TargetRow extends TargetField {
  _key: string // local stable id for dnd
}

function SortableTargetRow({
  row,
  sourceFields,
  mapping,
  onFieldChange,
  onMappingChange,
  onRemove,
}: {
  row: TargetRow
  sourceFields: string[]
  mapping: MappingRule | undefined
  onFieldChange: (key: string, field: string) => void
  onMappingChange: (targetField: string, rule: Partial<MappingRule>) => void
  onRemove: (key: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row._key,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2"
    >
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab">
        <GripVertical size={14} />
      </button>

      {/* Target field name */}
      <input
        value={row.field}
        onChange={(e) => onFieldChange(row._key, e.target.value)}
        placeholder="Target column name"
        className="w-36 rounded border border-gray-200 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <span className="text-gray-300 text-xs">←</span>

      {/* Source field */}
      <select
        value={mapping?.sourceField ?? ""}
        onChange={(e) =>
          onMappingChange(row.field, {
            sourceField: e.target.value || null,
            targetField: row.field,
            transform: mapping?.transform ?? "none",
          })
        }
        className="flex-1 rounded border border-gray-200 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">— static value —</option>
        {sourceFields.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* Transform */}
      <select
        value={mapping?.transform ?? "none"}
        onChange={(e) =>
          onMappingChange(row.field, { transform: e.target.value as TransformKey })
        }
        className="w-32 rounded border border-gray-200 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {TRANSFORMS.map((t) => (
          <option key={t.key} value={t.key}>{t.label}</option>
        ))}
      </select>

      {/* Static value (shown when no source field or transform = static_value) */}
      {(mapping?.transform === "static_value" || !mapping?.sourceField) && (
        <input
          value={mapping?.staticValue ?? ""}
          onChange={(e) =>
            onMappingChange(row.field, { staticValue: e.target.value })
          }
          placeholder="value"
          className="w-24 rounded border border-gray-200 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}

      {/* Required toggle */}
      <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
        <input
          type="checkbox"
          checked={row.required ?? false}
          onChange={() =>
            onFieldChange(row._key, row.field) // triggers re-render; required handled below
          }
          className="accent-blue-600"
        />
        req
      </label>

      <button onClick={() => onRemove(row._key)} className="text-gray-300 hover:text-red-500">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

export function FieldMappingEditor({ profileId }: { profileId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sourceFields, setSourceFields] = useState<string[]>([])
  const [targetRows, setTargetRows] = useState<TargetRow[]>([])
  const [mappings, setMappings] = useState<MappingRule[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const snapshotId = searchParams.get("snapshotId")

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    fetch(`/api/mapping-profiles/${profileId}`)
      .then((r) => r.json())
      .then((p: Profile) => {
        setProfile(p)
        setTargetRows(
          p.targetSchema.map((f, i) => ({ ...f, _key: `row-${i}-${f.field}` }))
        )
        setMappings(p.mappings)
      })
  }, [profileId])

  useEffect(() => {
    if (!snapshotId) return
    fetch(`/api/snapshots/${snapshotId}/records?page=1&limit=1`)
      .then((r) => r.json())
      .then((data: { records: { data: Record<string, string> }[] }) => {
        if (data.records[0]) setSourceFields(Object.keys(data.records[0].data))
      })
  }, [snapshotId])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setTargetRows((rows) => {
        const oldIndex = rows.findIndex((r) => r._key === active.id)
        const newIndex = rows.findIndex((r) => r._key === over.id)
        return arrayMove(rows, oldIndex, newIndex)
      })
    }
  }

  function addTargetRow() {
    const key = `row-${Date.now()}`
    setTargetRows((prev) => [...prev, { field: "", required: false, _key: key }])
  }

  function updateFieldName(key: string, field: string) {
    setTargetRows((prev) => prev.map((r) => (r._key === key ? { ...r, field } : r)))
    // Update mappings that referenced old field name
    setMappings((prev) =>
      prev.map((m) => {
        const row = targetRows.find((r) => r._key === key)
        if (row && m.targetField === row.field) return { ...m, targetField: field }
        return m
      })
    )
  }

  function updateMapping(targetField: string, partial: Partial<MappingRule>) {
    setMappings((prev) => {
      const exists = prev.find((m) => m.targetField === targetField)
      if (exists) return prev.map((m) => (m.targetField === targetField ? { ...m, ...partial } : m))
      return [
        ...prev,
        { sourceField: null, transform: "none", targetField, ...partial } as MappingRule,
      ]
    })
  }

  function removeRow(key: string) {
    const row = targetRows.find((r) => r._key === key)
    setTargetRows((prev) => prev.filter((r) => r._key !== key))
    if (row) setMappings((prev) => prev.filter((m) => m.targetField !== row.field))
  }

  async function save() {
    if (!profile) return
    setIsSaving(true)
    try {
      const targetSchema = targetRows
        .filter((r) => r.field.trim())
        .map(({ field, required }) => ({ field, required: !!required }))

      const cleanMappings = mappings.filter((m) => m.targetField.trim())

      await fetch(`/api/mapping-profiles/${profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSchema, mappings: cleanMappings }),
      })
      toast.success("Mapping profile saved")
      router.push(`/export?profileId=${profileId}${snapshotId ? `&snapshotId=${snapshotId}` : ""}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (!profile) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Profile name */}
      <input
        value={profile.name}
        onChange={(e) => setProfile((p) => p && { ...p, name: e.target.value })}
        className="w-full text-lg font-semibold text-gray-900 border-0 border-b border-gray-200 pb-1 focus:outline-none focus:border-blue-500 bg-transparent"
        placeholder="Profile name"
      />

      {/* Source fields reference */}
      {sourceFields.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            Available source fields (from BuildingLink export)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sourceFields.map((f) => (
              <span
                key={f}
                className="rounded bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Target column rows */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-3 text-xs font-medium text-gray-400 mb-1">
          <span className="w-4" />
          <span className="w-36">Target column</span>
          <span className="w-4" />
          <span className="flex-1">Source field</span>
          <span className="w-32">Transform</span>
          <span className="w-4" />
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={targetRows.map((r) => r._key)} strategy={verticalListSortingStrategy}>
            {targetRows.map((row) => (
              <SortableTargetRow
                key={row._key}
                row={row}
                sourceFields={sourceFields}
                mapping={mappings.find((m) => m.targetField === row.field)}
                onFieldChange={updateFieldName}
                onMappingChange={updateMapping}
                onRemove={removeRow}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          onClick={addTargetRow}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700"
        >
          <Plus size={12} /> Add target column
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={save}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
          {isSaving ? "Saving…" : "Save & go to export"}
        </button>
      </div>
    </div>
  )
}
