"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeRendererProps {
  text: string;
  size?: number;
  className?: string;
}

export function QRCodeRenderer({
  text,
  size = 120,
  className = "",
}: QRCodeRendererProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(text, {
          width: size,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        if (active) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      }
    };

    generateQR();
    return () => {
      active = false;
    };
  }, [text, size]);

  if (!qrDataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 text-[10px] rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        Generating QR...
      </div>
    );
  }

  return (
    <img
      src={qrDataUrl}
      alt="Payment QR Code"
      width={size}
      height={size}
      className={`rounded-lg border border-gray-100 bg-white ${className}`}
    />
  );
}
