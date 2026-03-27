"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface GroupsPickerProps {
  availableGroups: string[]
  value: string // comma-separated current value
  onChange: (value: string) => void
}

export function GroupsPicker({ availableGroups, value, onChange }: GroupsPickerProps) {
  const [customInput, setCustomInput] = useState("")

  const selected = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const selectedSet = new Set(selected)

  function toggle(group: string) {
    const next = selectedSet.has(group)
      ? selected.filter((g) => g !== group)
      : [...selected, group]
    onChange(next.join(","))
  }

  function selectAll() {
    const allGroups = [...new Set([...availableGroups, ...selected])]
    onChange(allGroups.join(","))
  }

  function clearAll() {
    onChange("")
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (!trimmed) return
    if (!selectedSet.has(trimmed)) {
      onChange([...selected, trimmed].join(","))
    }
    setCustomInput("")
  }

  function removeChip(group: string) {
    onChange(selected.filter((g) => g !== group).join(","))
  }

  // Groups not in the imported list but currently selected
  const customGroups = selected.filter((g) => !availableGroups.includes(g))
  const allDisplayGroups = [...availableGroups, ...customGroups]

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {/* Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((g) => (
            <span
              key={g}
              className="flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
            >
              {g}
              <button
                onClick={() => removeChip(g)}
                className="ml-0.5 text-blue-500 hover:text-blue-700"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Checkboxes */}
      <div className="rounded border border-gray-200 bg-white p-2 max-h-40 overflow-y-auto space-y-1">
        <div className="flex gap-2 mb-1.5">
          <button
            onClick={selectAll}
            className="text-xs text-blue-600 hover:underline"
          >
            All
          </button>
          <span className="text-gray-300 text-xs">·</span>
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:underline"
          >
            Clear
          </button>
        </div>
        {allDisplayGroups.map((group) => (
          <label key={group} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSet.has(group)}
              onChange={() => toggle(group)}
              className="accent-blue-600"
            />
            <span className="text-xs text-gray-700">{group}</span>
          </label>
        ))}
      </div>

      {/* Custom group input */}
      <div className="flex gap-1">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Add group…"
          className="flex-1 rounded border border-gray-200 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={addCustom}
          className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}
