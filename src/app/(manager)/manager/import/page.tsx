"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error?.message ?? "Import failed");
    } else {
      setResult(data.data);
      toast.success(`Import complete: ${data.data.created} created, ${data.data.updated} updated`);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk Import</h1>
        <p className="text-slate-500 text-sm mt-1">Upload a CSV or Excel file to onboard residents and assign parking spots</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Expected columns</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-slate-50 rounded-lg p-3 font-mono text-sm text-slate-600">
            spot_number, floor, type, has_ev, owner_email, owner_unit
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Required: <strong>owner_email</strong>. Also accepted: <strong>email</strong>, <strong>name</strong>, <strong>unit_number</strong>, <strong>phone</strong>, <strong>notes</strong>. All other columns are optional.
            <br />
            <strong>type</strong>: REGULAR, TANDEM, or HANDICAPPED (defaults to REGULAR).
            <strong> has_ev</strong>: true/yes/1 for EV charger installed.
            <br />
            Existing residents will be updated; new residents will be created (without passwords — they&apos;ll need an invite to set up login).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#1e4d8c]/40 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Upload size={32} className="mx-auto text-slate-300 mb-3" />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText size={18} className="text-[#1e4d8c]" />
                <span className="font-medium text-slate-700">{file.name}</span>
                <Badge variant="secondary" className="text-xs">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
            ) : (
              <>
                <p className="text-slate-600 font-medium">Drop your CSV or Excel file here</p>
                <p className="text-slate-400 text-sm mt-1">or click to browse</p>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            {file && (
              <Button variant="outline" onClick={() => setFile(null)}>Remove file</Button>
            )}
            <Button
              className="bg-[#1e4d8c] hover:bg-[#163a6a] flex-1"
              disabled={!file || loading}
              onClick={handleUpload}
            >
              {loading ? "Importing…" : "Import"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.errors.length === 0 ? "border-emerald-200" : "border-amber-200"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {result.errors.length === 0 ? (
                <CheckCircle2 size={18} className="text-emerald-600" />
              ) : (
                <AlertCircle size={18} className="text-amber-600" />
              )}
              Import results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-0">{result.created} created</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-0">{result.updated} updated</Badge>
              </div>
              {result.errors.length > 0 && (
                <Badge className="bg-red-100 text-red-700 border-0">{result.errors.length} errors</Badge>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-red-700">Rows with errors (skipped):</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
