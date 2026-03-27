"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, CheckCircle, XCircle } from "lucide-react"

interface Credential {
  id: string
  label: string
  username: string
  loginUrl?: string
}

interface Props {
  onSnapshotCreated: (snapshotId: string) => void
}

export function AutomationForm({ onSnapshotCreated }: Props) {
  const [creds, setCreds] = useState<Credential[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  // New credential form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: "", username: "", password: "", loginUrl: "" })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetch("/api/credentials")
      .then((r) => r.json())
      .then((data: Credential[]) => {
        setCreds(data)
        if (data[0]) setSelectedId(data[0].id)
      })
      .catch(() => {})
  }, [])

  async function saveCred() {
    if (!form.label || !form.username || !form.password) {
      toast.error("Label, username, and password are required")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, service: "buildinglink" }),
      })
      const data = await res.json() as Credential & { error?: string }
      if (!res.ok) { toast.error(data.error ?? "Failed to save"); return }
      setCreds((prev) => [...prev, data])
      setSelectedId(data.id)
      setShowForm(false)
      setForm({ label: "", username: "", password: "", loginUrl: "" })
      toast.success("Credentials saved")
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteCred(id: string) {
    await fetch(`/api/credentials/${id}`, { method: "DELETE" })
    setCreds((prev) => prev.filter((c) => c.id !== id))
    if (selectedId === id) setSelectedId(creds.find((c) => c.id !== id)?.id ?? "")
  }

  async function testLogin() {
    if (!selectedId) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/credentials/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: selectedId }),
      })
      const data = await res.json() as { ok: boolean; message: string }
      setTestResult(data)
    } finally {
      setIsTesting(false)
    }
  }

  async function runExtract() {
    if (!selectedId) return
    setIsRunning(true)
    try {
      const res = await fetch("/api/extract/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: selectedId }),
      })
      const data = await res.json() as { snapshotId?: string; recordCount?: number; error?: string }
      if (!res.ok || !data.snapshotId) {
        toast.error(data.error ?? "Extraction failed")
        return
      }
      toast.success(`Extracted ${data.recordCount} records`)
      onSnapshotCreated(data.snapshotId)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Credential selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">BuildingLink Credentials</label>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <Plus size={12} /> Add new
          </button>
        </div>

        {creds.length > 0 ? (
          <div className="space-y-2">
            {creds.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="cred"
                  value={c.id}
                  checked={selectedId === c.id}
                  onChange={() => setSelectedId(c.id)}
                  className="accent-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.label}</p>
                  <p className="text-xs text-gray-500">{c.username}</p>
                </div>
                <button
                  onClick={() => deleteCred(c.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={13} />
                </button>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No credentials saved yet. Add one below.</p>
        )}
      </div>

      {/* Add credential form */}
      {showForm && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New credential</p>
          {[
            { key: "label", label: "Label", placeholder: "e.g. Saltaire BuildingLink", type: "text" },
            { key: "username", label: "Username / Email", placeholder: "manager@example.com", type: "email" },
            { key: "password", label: "Password", placeholder: "••••••••", type: "password" },
            { key: "loginUrl", label: "Login URL (optional)", placeholder: "https://www.buildinglink.com", type: "url" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={saveCred}
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${testResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {testResult.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {testResult.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={testLogin}
          disabled={!selectedId || isTesting || isRunning}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {isTesting ? <Loader2 size={14} className="inline animate-spin mr-1" /> : null}
          Test login
        </button>
        <button
          onClick={runExtract}
          disabled={!selectedId || isRunning || isTesting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : null}
          {isRunning ? "Extracting…" : "Run extract"}
        </button>
      </div>
    </div>
  )
}
