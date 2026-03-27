import Link from "next/link"
import { Shield, Clock, Database, ExternalLink } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-4">
        <SettingsSection
          icon={<Shield size={15} />}
          title="Credentials"
          description="Manage encrypted BuildingLink login credentials for browser automation."
          href="/extract"
          linkLabel="Manage credentials →"
        />
        <SettingsSection
          icon={<Clock size={15} />}
          title="Schedule"
          description="Configure automated extract schedule (requires Railway/Render deployment)."
          href="/extract"
          linkLabel="Configure schedule →"
        />
        <SettingsSection
          icon={<Database size={15} />}
          title="Data retention"
          description="Snapshots accumulate PII. Configure auto-purge to keep only recent snapshots."
          comingSoon
        />

        <div className="rounded-md border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Environment variables</p>
          <div className="space-y-2 font-mono text-xs text-gray-600">
            {[
              { key: "DATABASE_URL", desc: "PostgreSQL connection string" },
              { key: "ENCRYPTION_KEY", desc: "64-char hex key for credential encryption" },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-start gap-2">
                <code className="bg-gray-100 rounded px-1.5 py-0.5 shrink-0">{key}</code>
                <span className="text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Hosting note</p>
          <p>
            Browser automation requires a persistent Node.js environment.
            Deploy to <strong>Railway</strong> or <strong>Render</strong> — not Vercel.
            Vercel functions cannot run Playwright.
          </p>
          <a
            href="https://railway.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-amber-700 font-medium hover:underline"
          >
            Railway.app <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  )
}

function SettingsSection({
  icon, title, description, href, linkLabel, comingSoon,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href?: string
  linkLabel?: string
  comingSoon?: boolean
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-gray-500">{icon}</span>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {comingSoon && (
          <span className="ml-auto text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">Coming soon</span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      {href && linkLabel && (
        <Link href={href} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}
