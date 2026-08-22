"use client";

import { Camera, Loader2, ScanLine, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function resolveScanTarget(rawValue: string, checkInHref: string) {
  const value = rawValue.trim();
  if (!value) return null;

  const buildTarget = (token: string) => {
    const target = new URL(checkInHref, window.location.origin);
    target.searchParams.set("token", token);
    return `${target.pathname}${target.search}`;
  };

  try {
    const url = new URL(value, window.location.origin);
    const token = url.searchParams.get("token");
    if (token) {
      return buildTarget(token);
    }
  } catch {}

  if (value.includes(".") && !value.includes("/") && !value.includes("?")) {
    return buildTarget(value);
  }

  return null;
}

export default function BookingQrScanner({
  checkInHref = "/booking/check-in?returnTo=%2Fadmin%2Fbookings",
}: {
  checkInHref?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopScanner = useCallback(() => {
    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const goToScan = useCallback((rawValue: string) => {
    const target = resolveScanTarget(rawValue, checkInHref);
    if (!target) {
      setError("This QR code does not look like a PawJai booking QR.");
      return;
    }
    stopScanner();
    window.location.assign(target);
  }, [checkInHref, stopScanner]);

  const startScanner = useCallback(async () => {
    setError(null);

    if (!window.BarcodeDetector) {
      setError("Camera QR scanning is not supported in this browser. Paste the QR link or token below.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not available in this browser. Paste the QR link or token below.");
      return;
    }

    try {
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const scanFrame = async () => {
        if (!videoRef.current || !streamRef.current) return;

        try {
          const [code] = await detector.detect(videoRef.current);
          if (code?.rawValue) {
            goToScan(code.rawValue);
            return;
          }
        } catch {
          setError("The camera opened, but QR detection failed. Try better lighting or paste the QR link below.");
        }

        animationRef.current = window.requestAnimationFrame(scanFrame);
      };

      animationRef.current = window.requestAnimationFrame(scanFrame);
    } catch (cameraError) {
      setScanning(false);
      setError(
        cameraError instanceof Error
          ? `Camera could not start: ${cameraError.message}`
          : "Camera could not start. Paste the QR link or token below.",
      );
    }
  }, [goToScan]);

  useEffect(() => stopScanner, [stopScanner]);

  return (
    <div className="rounded-[24px] border border-[#d6c8ad] bg-white p-4 shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#4f4338]">QR check-in scanner</p>
          <p className="mt-1 text-sm text-[#74685d]">
            Scan a visitor appointment QR to open their booking profile.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b87179]"
          onClick={() => {
            setOpen(true);
            void startScanner();
          }}
          type="button"
        >
          <Camera size={17} />
          Scan QR
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#201a15]/70 px-4 py-6">
          <div className="w-full max-w-xl rounded-[28px] bg-[#fffaf5] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-[#4f4338]">Scan booking QR</p>
                <p className="mt-1 text-sm text-[#74685d]">
                  Point the camera at the visitor&apos;s PawJai appointment QR.
                </p>
              </div>
              <button
                aria-label="Close scanner"
                className="rounded-full border border-[#eadfce] bg-white p-2 text-[#5b4d40]"
                onClick={() => {
                  stopScanner();
                  setOpen(false);
                }}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[22px] border border-[#eadfce] bg-[#201a15]">
              <video
                className="aspect-video w-full object-cover"
                muted
                playsInline
                ref={videoRef}
              />
              <div className="flex items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-semibold text-[#5b4d40]">
                {scanning ? <Loader2 className="animate-spin" size={16} /> : <ScanLine size={16} />}
                {scanning ? "Looking for QR code" : "Camera scanner ready"}
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-2xl border border-[#f1c4c0] bg-[#fff4f2] px-4 py-3 text-sm text-[#8b332d]">
                {error}
              </p>
            ) : null}

            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                goToScan(manualValue);
              }}
            >
              <input
                className="min-w-0 flex-1 rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#cd8188]"
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="Paste QR link or token"
                value={manualValue}
              />
              <button className="rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white" type="submit">
                Open booking
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
