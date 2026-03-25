import QRCode from "qrcode";

export async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function generateQRSVGString(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", width: 400, margin: 2 });
}
