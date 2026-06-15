"use client";

import { useRef, useState } from "react";
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES } from "@/types/sources";

type SourceUploadProps = {
  file: File | null;
  onFileSelect: (file: File | null) => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return fileName.slice(dotIndex).toLowerCase();
}

function getFileTypeLabel(file: File): string {
  if (file.type) return file.type;
  return getFileExtension(file.name) || "未知類型";
}

function isAcceptedFile(file: File): boolean {
  const extension = getFileExtension(file.name);
  if (ACCEPTED_EXTENSIONS.includes(extension as (typeof ACCEPTED_EXTENSIONS)[number])) {
    return true;
  }
  return ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number]);
}

export function SourceUpload({ file, onFileSelect }: SourceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(fileList: FileList | null) {
    const selected = fileList?.[0];
    if (!selected) return;

    if (!isAcceptedFile(selected)) {
      setError("僅支援 PDF、PNG、JPG、JPEG、WEBP 格式。");
      return;
    }

    setError(null);
    onFileSelect(selected);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files);
  }

  const accept = ACCEPTED_EXTENSIONS.join(",");

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-slate-900">上傳區</h2>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path
              d="M12 16V8m0 0-3 3m3-3 3 3M5 19h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1.5a4.5 4.5 0 0 0-8.7-1.5H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-slate-900">
            拖曳檔案到此處，或點擊選擇檔案
          </p>
          <p className="mt-1 text-xs text-slate-500">支援 PDF、PNG、JPG、JPEG、WEBP</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => handleFile(event.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {file && (
        <div className="rounded-lg border border-blue-100 bg-white px-4 py-3">
          <p className="text-sm font-medium text-slate-900">已選擇檔案</p>
          <dl className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">檔名</dt>
              <dd className="break-all font-medium text-slate-800">{file.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">檔案類型</dt>
              <dd className="font-medium text-slate-800">{getFileTypeLabel(file)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">檔案大小</dt>
              <dd className="font-medium text-slate-800">{formatFileSize(file.size)}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
