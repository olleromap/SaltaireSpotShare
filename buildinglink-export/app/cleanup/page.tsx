"use client"

import { Suspense } from "react"
import { CleanupGrid } from "@/components/cleanup/CleanupGrid"

export default function CleanupPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Clean Up Data</h1>
        <p className="text-sm text-gray-500">
          Review and edit the extracted data before mapping and exporting. Changes are saved per-cell.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
        <CleanupGrid />
      </Suspense>
    </div>
  )
}
