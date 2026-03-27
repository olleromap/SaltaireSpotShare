import { Suspense } from "react"
import { FieldMappingEditor } from "@/components/mapping/FieldMappingEditor"

export default async function MappingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Mapping Profile</h1>
      <p className="text-sm text-gray-500 mb-6">
        Map source fields from BuildingLink to target columns. Drag rows to reorder.
        Double-click any source chip to auto-map.
      </p>
      <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
        <FieldMappingEditor profileId={id} />
      </Suspense>
    </div>
  )
}
