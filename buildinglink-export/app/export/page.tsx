"use client"

import { Suspense } from "react"
import { ExportPanel } from "@/components/export/ExportPanel"

export default function ExportPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Export</h1>
      <p className="text-sm text-gray-500 mb-6">
        Choose a snapshot, mapping profile, and format. Preview before downloading.
      </p>
      <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
        <ExportPanel />
      </Suspense>
    </div>
  )
}
