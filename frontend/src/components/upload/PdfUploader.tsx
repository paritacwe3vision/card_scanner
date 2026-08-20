"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, X } from "lucide-react";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { uploadPdf } from "@/services/api";

export default function PdfUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid PDF file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please drop a valid PDF file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await uploadPdf(file);

      if (response.success && response.card) {
        sessionStorage.setItem("extractedCard", JSON.stringify(response.card));
        router.push("/review");
      } else {
        setError(response.message || "Failed to extract card details from PDF");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong while processing the PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-primary-500 hover:bg-primary-50"
          }`}
        >
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700">Upload PDF</p>
          <p className="text-sm text-gray-500 mt-1">
            Drag & drop or click to select a PDF file
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-6 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 truncate max-w-xs">
                {file.name}
              </p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Action Button */}
      {file && (
        <Button
          onClick={handleUpload}
          className="w-full"
          isLoading={isLoading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Process PDF
        </Button>
      )}

      {isLoading && (
        <LoadingSpinner text="Extracting information from PDF..." />
      )}
    </div>
  );
}