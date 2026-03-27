import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { Upload, ArrowRight, CheckCircle, Clock, AlertCircle } from "lucide-react"

async function getStats() {
  const [snapshotCount, latestSnapshot, exportCount, auditCount] = await Promise.all([
    prisma.snapshot.count(),
    prisma.snapshot.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.export.count(),
    prisma.auditLog.count(),
  ])
  return { snapshotCount, latestSnapshot, exportCount, auditCount }
}

export default async function DashboardPage() {
  let stats
  try {
    stats = await getStats()
  } catch {
    // DB not yet migrated — show a setup message
    return <SetupMessage />
  }

  const { snapshotCount, latestSnapshot, exportCount } = stats

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">SaltaireSync</h1>
        <p className="text-sm text-gray-500">
          Extract resident data from BuildingLink, clean it up, map it, and export to any system.
        </p>
      </div>

      {/* Workflow steps */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { step: "1", label: "Extract", href: "/extract", color: "bg-blue-50 border-blue-200 text-blue-700" },
          { step: "2", label: "Clean Up", href: "/cleanup", color: "bg-amber-50 border-amber-200 text-amber-700" },
          { step: "3", label: "Map", href: "/mapping", color: "bg-purple-50 border-purple-200 text-purple-700" },
          { step: "4", label: "Export", href: "/export", color: "bg-green-50 border-green-200 text-green-700" },
        ].map((s, i, arr) => (
          <div key={s.step} className="flex items-center gap-1">
            <Link
              href={s.href}
              className={`flex-1 flex flex-col items-center rounded-md border px-2 py-3 text-center transition-opacity hover:opacity-80 ${s.color}`}
            >
              <span className="text-xs font-bold mb-0.5">{s.step}</span>
              <span className="text-xs font-medium">{s.label}</span>
            </Link>
            {i < arr.length - 1 && <ArrowRight size={12} className="text-gray-300 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Total snapshots" value={snapshotCount} />
        <StatCard label="Total exports" value={exportCount} />
        <StatCard label="Workflow step" value={snapshotCount === 0 ? "Start" : "Ready"} isText />
      </div>

      {/* Latest snapshot */}
      {latestSnapshot ? (
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Latest snapshot</p>
            <StatusBadge status={latestSnapshot.status} />
          </div>
          <p className="text-sm text-gray-700 mb-0.5">
            {latestSnapshot.fileName ?? "Unknown file"}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            {latestSnapshot.recordCount} records · {formatDate(latestSnapshot.createdAt)}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/cleanup?snapshotId=${latestSnapshot.id}`}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Clean up
            </Link>
            <Link
              href={`/export?snapshotId=${latestSnapshot.id}`}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Export
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-md border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500 mb-3">No snapshots yet. Start by uploading a BuildingLink export.</p>
          <Link
            href="/extract"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Upload size={14} /> Upload first export
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold text-gray-900 ${isText ? "text-base" : "text-2xl"}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 rounded px-2 py-0.5">
      <CheckCircle size={10} /> Ready
    </span>
  )
  if (status === "exported") return (
    <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 rounded px-2 py-0.5">
      <CheckCircle size={10} /> Exported
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 rounded px-2 py-0.5">
      <Clock size={10} /> Pending cleanup
    </span>
  )
}

function SetupMessage() {
  return (
    <div className="max-w-lg rounded-md border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle size={16} className="text-amber-600" />
        <p className="text-sm font-semibold text-amber-800">Database not yet set up</p>
      </div>
      <p className="text-sm text-amber-700 mb-3">
        Run the database migration before starting the app:
      </p>
      <pre className="rounded bg-white border border-amber-200 px-3 py-2 text-xs font-mono text-gray-700">
        npx prisma migrate dev --name init
      </pre>
    </div>
  )
}
