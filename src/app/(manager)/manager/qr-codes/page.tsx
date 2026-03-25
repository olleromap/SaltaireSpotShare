"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, QrCode } from "lucide-react";
import { useEffect } from "react";

export default function QRCodesPage() {
  const [qrDataURL, setQrDataURL] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
    setCustomUrl(`${window.location.origin}/register`);
  }, []);

  async function generateQR(url: string) {
    const { default: QRCode } = await import("qrcode");
    const dataURL = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrDataURL(dataURL);
  }

  function downloadQR() {
    if (!qrDataURL) return;
    const a = document.createElement("a");
    a.href = qrDataURL;
    a.download = "saltaire-spotshare-qr.png";
    a.click();
  }

  const presets = [
    { label: "Resident sign-up", description: "For lobby signage — directs to registration", url: `${appUrl}/register` },
    { label: "Browse available spots", description: "For residents to quickly find parking", url: `${appUrl}/reserve` },
    { label: "Direct to login", description: "For residents who already have accounts", url: `${appUrl}/login` },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QR Codes</h1>
        <p className="text-slate-500 text-sm mt-1">Generate QR codes for building signage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Quick presets</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {presets.map(({ label, description, url }) => (
                <button
                  key={label}
                  onClick={() => { setCustomUrl(url); generateQR(url); }}
                  className="w-full text-left p-3 rounded-lg border hover:border-[#1e4d8c] hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-slate-800 text-sm">{label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{description}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Custom URL</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button
                className="w-full bg-[#1e4d8c] hover:bg-[#163a6a] gap-2"
                onClick={() => generateQR(customUrl)}
                disabled={!customUrl}
              >
                <QrCode size={16} />
                Generate QR code
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Preview</CardTitle></CardHeader>
          <CardContent>
            {qrDataURL ? (
              <div className="space-y-4">
                <div className="bg-white border-2 border-slate-100 rounded-xl p-4 flex flex-col items-center">
                  {/* Print-ready layout */}
                  <div className="text-center mb-3">
                    <div className="font-bold text-slate-900 text-lg">SaltaireSpotShare</div>
                    <div className="text-slate-500 text-xs">Resident Parking Portal</div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataURL} alt="QR code" className="w-48 h-48" />
                  <div className="text-center mt-3">
                    <div className="text-slate-600 text-sm font-medium">Scan to get started</div>
                    <div className="text-slate-400 text-xs mt-1">Reserve • Share • Manage</div>
                  </div>
                </div>
                <Button className="w-full gap-2" variant="outline" onClick={downloadQR}>
                  <Download size={16} />
                  Download PNG
                </Button>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-300">
                <div className="text-center">
                  <QrCode size={48} className="mx-auto mb-3" />
                  <p className="text-sm">Select a preset or enter a URL</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
