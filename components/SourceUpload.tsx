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
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">上傳區</h2>
        <p className="mt-1 text-sm text-slate-600">
          可上傳 PDF、圖片；若系統檔案視窗無法多選，建議把檔案放進同一個資料夾後，用「選擇資料夾批次匯入」。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:border-blue-400 hover:bg-blue-100"
        >
          選擇 PDF / 圖片檔
        </button>

        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 transition hover:border-violet-400 hover:bg-violet-100"
        >
          選擇資料夾批次匯入
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100"
        >
          拍照輸入教材
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
            拖曳多個檔案到此處，或點擊選擇檔案
          </p>

          <p className="mt-1 text-xs text-slate-500">
            支援 PDF、PNG、JPG、JPEG、WEBP；批次大量匯入建議使用資料夾
          </p>
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
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                已選擇 {files.length} 個檔案
              </p>

              <p className="mt-1 text-sm text-slate-500">
                總大小：{formatFileSize(totalSize)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearFiles}
              className="w-fit rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              清空檔案
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {files.map((selectedFile) => (
              <div
                key={getFileKey(selectedFile)}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <dl className="grid flex-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-slate-500">檔名</dt>
                      <dd className="break-all font-medium text-slate-800">
                        {selectedFile.name}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-slate-500">檔案類型</dt>
                      <dd className="font-medium text-slate-800">
                        {getFileTypeLabel(selectedFile)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-slate-500">檔案大小</dt>
                      <dd className="font-medium text-slate-800">
                        {formatFileSize(selectedFile.size)}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(selectedFile)}
                    className="w-fit rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-white"
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}