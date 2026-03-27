import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { FileDown, Layers } from "lucide-react"

export default async function HistoryPage() {
  let snapshots: Awaited<ReturnType<typeof getHistory>>["snapshots"] = []
  let exports_: Awaited<ReturnType<typeof getHistory>>["exports"] = []

  try {
    const data = await getHistory()
    snapshots = data.snapshots
    exports_ = data.exports
  } catch {
    return <p className="text-sm text-gray-500">Database not yet ready. Run migrations first.</p>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">History</h1>

      <div className="space-y-8">
        {/* Extracts */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Layers size={14} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Snapshots ({snapshots.length})</h2>
          </div>
          {snapshots.length === 0 ? (
            <p className="text-sm text-gray-400">No snapshots yet.</p>
          ) : (
            <div className="space-y-2">
              {snapshots.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {s.fileName ?? `Snapshot ${s.id.slice(-6)}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.recordCount} records · {s.source} · {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    s.status === "ready" ? "bg-green-50 text-green-700" :
                    s.status === "exported" ? "bg-blue-50 text-blue-700" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {s.status}
                  </span>
                  <Link
                    href={`/export?snapshotId=${s.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
                  >
                    Export →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Exports */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileDown size={14} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Exports ({exports_.length})</h2>
          </div>
          {exports_.length === 0 ? (
            <p className="text-sm text-gray-400">No exports yet.</p>
          ) : (
            <div className="space-y-2">
              {exports_.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {e.mappingProfile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {e.recordCount} rows · {e.exportType} · {e.format.toUpperCase()} · {formatDate(e.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium uppercase ${
                    e.exportType === "delta" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {e.exportType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

async function getHistory() {
  const [snapshots, exports] = await Promise.all([
    prisma.snapshot.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, fileName: true, recordCount: true, source: true, status: true, createdAt: true },
    }),
    prisma.export.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        exportType: true,
        format: true,
        recordCount: true,
        createdAt: true,
        mappingProfile: { select: { name: true } },
      },
    }),
  ])
  return { snapshots, exports }
}
