"use client";

import { useEffect, useRef, useState } from "react";
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES } from "@/types/sources";

type SourceUploadProps = {
  files: File[];
  onFilesSelect: (files: File[]) => void;
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

  if (
    ACCEPTED_EXTENSIONS.includes(
      extension as (typeof ACCEPTED_EXTENSIONS)[number],
    )
  ) {
    return true;
  }

  return ACCEPTED_MIME_TYPES.includes(
    file.type as (typeof ACCEPTED_MIME_TYPES)[number],
  );
}

function getFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function getFileBadge(file: File) {
  const extension = getFileExtension(file.name);

  if (extension === ".pdf" || file.type === "application/pdf") {
    return "PDF";
  }

  if (
    [".png", ".jpg", ".jpeg", ".webp"].includes(extension) ||
    file.type.startsWith("image/")
  ) {
    return "IMG";
  }

  return "FILE";
}

export function SourceUpload({ files, onFilesSelect }: SourceUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folderInputRef.current) return;

    folderInputRef.current.setAttribute("webkitdirectory", "");
    folderInputRef.current.setAttribute("directory", "");
  }, []);

  function resetInputs() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }

  function handleFiles(fileList: FileList | null) {
    const selectedFiles = Array.from(fileList ?? []);

    if (selectedFiles.length === 0) return;

    const acceptedFiles = selectedFiles.filter(isAcceptedFile);
    const rejectedCount = selectedFiles.length - acceptedFiles.length;

    if (acceptedFiles.length === 0) {
      setError("僅支援 PDF、PNG、JPG、JPEG、WEBP 格式。");
      resetInputs();
      return;
    }

    const existingKeys = new Set(files.map(getFileKey));
    const nextFiles = [
      ...files,
      ...acceptedFiles.filter((file) => !existingKeys.has(getFileKey(file))),
    ];

    if (rejectedCount > 0) {
      setError(`已略過 ${rejectedCount} 個不支援的檔案。`);
    } else {
      setError(null);
    }

    onFilesSelect(nextFiles);
    resetInputs();
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
    handleFiles(event.dataTransfer.files);
  }

  function handleClearFiles() {
    setError(null);
    onFilesSelect([]);
    resetInputs();
  }

  function handleRemoveFile(fileToRemove: File) {
    const removeKey = getFileKey(fileToRemove);
    onFilesSelect(files.filter((file) => getFileKey(file) !== removeKey));
  }

  const fileAccept = ACCEPTED_EXTENSIONS.join(",");
  const imageAccept = "image/png,image/jpeg,image/webp,image/*";
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">
            <span aria-hidden="true">📚</span>
            教材投放區
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
            上傳教材檔案
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            可上傳 PDF、圖片；若系統檔案視窗無法多選，建議把檔案放進同一個資料夾後，用「選擇資料夾批次匯入」。
          </p>
        </div>

        {files.length > 0 && (
          <div className="w-fit rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
            <p className="font-black text-slate-900">
              {files.length} 個檔案
            </p>
            <p className="mt-1 text-xs text-slate-500">
              總大小 {formatFileSize(totalSize)}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group rounded-3xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-2xl transition group-hover:scale-105">
            📄
          </div>
          <p className="mt-3 text-sm font-black text-blue-700">
            選擇 PDF / 圖片檔
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            適合單份或少量教材
          </p>
        </button>

        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          className="group rounded-3xl border border-violet-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-2xl transition group-hover:scale-105">
            🗂️
          </div>
          <p className="mt-3 text-sm font-black text-violet-700">
            選擇資料夾批次匯入
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            適合大量講義一次匯入
          </p>
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="group rounded-3xl border border-emerald-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-2xl transition group-hover:scale-105">
            📷
          </div>
          <p className="mt-3 text-sm font-black text-emerald-700">
            拍照輸入教材
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            適合紙本教材快速拍攝
          </p>
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed px-6 py-12 text-center transition ${
          isDragging
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-blue-200 bg-white/70 hover:border-blue-400 hover:bg-blue-50/80 hover:shadow-md"
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-sm transition group-hover:scale-105">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
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

        <div>
          <p className="text-base font-black text-slate-900">
            拖曳多個檔案到此處，或點擊選擇檔案
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            支援 PDF、PNG、JPG、JPEG、WEBP；批次大量匯入建議使用資料夾
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              PDF
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
              PNG
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
              JPG / JPEG
            </span>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">
              WEBP
            </span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={fileAccept}
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <input
          ref={folderInputRef}
          type="file"
          accept={fileAccept}
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept={imageAccept}
          capture="environment"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {error && (
        <div
          className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white/90 shadow-sm">
          <div
            className="h-1.5 bg-gradient-to-r from-blue-500 via-violet-500 to-sky-500"
            aria-hidden="true"
          />

          <div className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-black text-slate-900">
                  已選擇 {files.length} 個檔案
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  總大小：{formatFileSize(totalSize)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearFiles}
                className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                清空檔案
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {files.map((selectedFile) => (
                <div
                  key={getFileKey(selectedFile)}
                  className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xs font-black text-blue-700">
                        {getFileBadge(selectedFile)}
                      </div>

                      <dl className="grid flex-1 gap-3 text-sm text-slate-600 sm:grid-cols-3">
                        <div className="min-w-0">
                          <dt className="text-xs font-bold text-slate-500">
                            檔名
                          </dt>
                          <dd className="mt-1 break-all font-black text-slate-800">
                            {selectedFile.name}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold text-slate-500">
                            檔案類型
                          </dt>
                          <dd className="mt-1 font-bold text-slate-800">
                            {getFileTypeLabel(selectedFile)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold text-slate-500">
                            檔案大小
                          </dt>
                          <dd className="mt-1 font-bold text-slate-800">
                            {formatFileSize(selectedFile.size)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(selectedFile)}
                      className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}