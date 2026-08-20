"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, X, SwitchCamera, QrCode, RotateCcw } from "lucide-react";
import jsQR from "jsqr";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { uploadScan } from "@/services/api";

export default function ScanUploader() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [qrDetected, setQrDetected] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);

  // Start Camera
  const startCamera = async (mode: "environment" | "user" = "environment") => {
    setIsStarting(true);
    setError(null);
    setQrDetected(false);
    setQrData(null);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setFacingMode(mode);
      setIsCameraActive(true);

      setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = mediaStream;
          video.onloadedmetadata = () => {
            video
              .play()
              .then(() => {
                setIsStarting(false);
                startQRScanning();
              })
              .catch(() => {
                setError("Could not start camera preview");
                setIsStarting(false);
              });
          };
        }
      }, 200);
    } catch (err: any) {
      setError(err.message || "Camera access denied");
      setIsStarting(false);
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStarting(false);
  };

  // QR Code Scanning
  const startQRScanning = () => {
    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code?.data) {
        setQrData(code.data);
        setQrDetected(true);
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    animationRef.current = requestAnimationFrame(scan);
  };

  // Capture Photo
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], "business-card.jpg", {
          type: "image/jpeg",
        });
        setFile(capturedFile);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  const switchCamera = () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    startCamera(newMode);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setQrDetected(false);
    setQrData(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await uploadScan(file);
      if (response.success && response.card) {
        sessionStorage.setItem(
          "extractedCard",
          JSON.stringify({ ...response.card, qr_raw: qrData })
        );
        router.push("/review");
      } else {
        setError(response.message || "Failed to extract data");
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* ========== START SCREEN ========== */}
      {!isCameraActive && !preview && (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gradient-to-b from-gray-50 to-white">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Camera className="h-10 w-10 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Scan Business Card
          </h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Point your camera at the business card. QR codes will be detected automatically.
          </p>
          <Button
            onClick={() => startCamera("environment")}
            size="lg"
            disabled={isStarting}
            className="px-8"
          >
            <Camera className="h-5 w-5 mr-2" />
            {isStarting ? "Starting..." : "Open Camera"}
          </Button>
        </div>
      )}

      {/* ========== LIVE CAMERA ========== */}
      {isCameraActive && !preview && (
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-[4/3] object-cover max-h-[520px]"
          />

          {/* Dark gradient at bottom for controls */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          {/* Loading */}
          {isStarting && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <LoadingSpinner text="Starting camera..." />
            </div>
          )}

          {/* Corner Guide Frame */}
          {!isStarting && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[88%] h-[62%]">
                {/* Top-left */}
                <div className={`absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] rounded-tl-lg ${qrDetected ? "border-green-400" : "border-white"}`} />
                {/* Top-right */}
                <div className={`absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] rounded-tr-lg ${qrDetected ? "border-green-400" : "border-white"}`} />
                {/* Bottom-left */}
                <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] rounded-bl-lg ${qrDetected ? "border-green-400" : "border-white"}`} />
                {/* Bottom-right */}
                <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] rounded-br-lg ${qrDetected ? "border-green-400" : "border-white"}`} />
              </div>
            </div>
          )}

          {/* QR Detected Badge */}
          {qrDetected && !isStarting && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-sm font-semibold px-5 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
              <QrCode className="h-4 w-4" />
              QR Code Detected
            </div>
          )}

          {/* Tip Text */}
          {!isStarting && !qrDetected && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-4 py-1.5 rounded-full backdrop-blur-sm">
              Align the card inside the frame
            </div>
          )}

          {/* Controls */}
          {!isStarting && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
              {/* Switch Camera */}
              <button
                onClick={switchCamera}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3.5 rounded-full transition-all"
              >
                <SwitchCamera className="h-5 w-5 text-white" />
              </button>

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                className="group relative"
              >
                <div className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white group-hover:scale-90 transition-transform" />
                </div>
              </button>

              {/* Close */}
              <button
                onClick={stopCamera}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3.5 rounded-full transition-all"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== CAPTURED PREVIEW ========== */}
      {preview && (
        <div className="space-y-5">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <img
              src={preview}
              alt="Captured business card"
              className="w-full max-h-96 object-contain bg-gray-50"
            />

            {qrDetected && (
              <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
                <QrCode className="h-3.5 w-3.5" />
                QR Found
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                handleRemove();
                startCamera(facingMode);
              }}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake
            </Button>

            <Button
              className="flex-1"
              onClick={handleUpload}
              isLoading={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Process Card
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}