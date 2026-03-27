"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Upload, Bot, Clock, AlertTriangle } from "lucide-react"
import { UploadZone } from "@/components/extract/UploadZone"
import { AutomationForm } from "@/components/extract/AutomationForm"
import { ScheduleConfig } from "@/components/extract/ScheduleConfig"

type Tab = "upload" | "automation" | "schedule"

export default function ExtractPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload")
  const router = useRouter()

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "upload", label: "Manual Upload", icon: <Upload size={14} /> },
    { id: "automation", label: "Browser Automation", icon: <Bot size={14} /> },
    { id: "schedule", label: "Schedule", icon: <Clock size={14} /> },
  ]

  function handleSnapshotCreated(snapshotId: string) {
    toast.success("Snapshot created — review and clean up your data")
    router.push(`/cleanup?snapshotId=${snapshotId}`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Extract from BuildingLink</h1>
      <p className="text-sm text-gray-500 mb-6">
        Import resident data by uploading a BuildingLink export, or run browser automation to
        fetch it automatically.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "upload" && (
        <UploadZone onSnapshotCreated={handleSnapshotCreated} />
      )}

      {activeTab === "automation" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Terms of Service notice:</strong> Browser automation logs into BuildingLink on
              your behalf. Review BuildingLink&apos;s ToS before using this feature. Manual upload
              is always safe.
            </p>
          </div>
          <AutomationForm onSnapshotCreated={handleSnapshotCreated} />
        </div>
      )}

      {activeTab === "schedule" && <ScheduleConfig />}
    </div>
  )
}
