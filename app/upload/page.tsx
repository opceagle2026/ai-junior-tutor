"use client";

import Link from "next/link";
import { useState } from "react";
import { SourceForm, type SourceFormValues } from "@/components/SourceForm";
import { SourceUpload } from "@/components/SourceUpload";
import { uploadSource } from "@/lib/sources";

const initialFormValues: SourceFormValues = {
  title: "",
  grade: "AI 自動判斷",
};

function getFileType(file: File): string {
  if (file.type) return file.type;

  const dotIndex = file.name.lastIndexOf(".");

  if (dotIndex === -1) return "application/octet-stream";

  const extension = file.name.slice(dotIndex + 1).toLowerCase();

  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };

  return mimeMap[extension] ?? "application/octet-stream";
}

function getTitleForFile(baseTitle: string, file: File, totalFiles: number) {
  const trimmedTitle = baseTitle.trim();

  if (!trimmedTitle) {
    return file.name;
  }

  if (totalFiles === 1) {
    return trimmedTitle;
  }

  return `${trimmedTitle} - ${file.name}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;

    if (typeof message === "string" && message) return message;
  }

  return fallback;
}

export default function StudentUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [formValues, setFormValues] =
    useState<SourceFormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleUpload() {
    if (files.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setMessage("正在上傳教材，請稍候...");
    setErrorMessage("");

    let uploadedCount = 0;
    const failedMessages: string[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const selectedFile = files[index];

        setMessage(
          `正在上傳第 ${index + 1} / ${files.length} 份教材：${selectedFile.name}`,
        );

        try {
          await uploadSource({
            title: getTitleForFile(formValues.title, selectedFile, files.length),
            grade: formValues.grade,
            file: selectedFile,
            fileType: getFileType(selectedFile),
          });

          uploadedCount += 1;
        } catch (error) {
          failedMessages.push(
            `${selectedFile.name}：${getErrorMessage(error, "上傳失敗")}`,
          );
        }
      }

      setFiles([]);
      setFormValues(initialFormValues);

      if (uploadedCount > 0) {
        setMessage(
          `已成功上傳 ${uploadedCount} 份教材。老師或管理者會再進行 AI 分析與建立題庫。`,
        );
      } else {
        setMessage("");
      }

      if (failedMessages.length > 0) {
        setErrorMessage(failedMessages.slice(0, 3).join("\n"));
      } else {
        setErrorMessage("");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "上傳教材失敗"));
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex w-fit items-center text-sm font-medium text-blue-700 transition hover:text-blue-800"
          >
            ← 返回首頁
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-medium text-blue-700">學生上傳教材</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              上傳你的教材
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              可以上傳 PDF、課本照片、講義圖片或練習題截圖。上傳後，系統會先保存教材，之後由老師或管理者進行 AI 分析與建立題庫。
            </p>
          </div>
        </header>

        {message && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
            {message}
          </div>
        )}

        {errorMessage && (
          <div
            className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <section className="flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SourceUpload files={files} onFilesSelect={setFiles} />

          <div className="border-t border-slate-100" />

          <SourceForm
            values={formValues}
            onChange={setFormValues}
            onSubmit={handleUpload}
            disabled={files.length === 0 || isSubmitting}
            isSubmitting={isSubmitting}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            <p className="font-medium text-slate-800">上傳提醒</p>
            <p className="mt-1">
              如果沒有填標題，系統會用檔案名稱當教材標題。年級可以先選「AI
              自動判斷」，之後會由系統分析教材內容。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}