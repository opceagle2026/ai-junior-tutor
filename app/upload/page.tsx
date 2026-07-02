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
  if (error instanceof Error && error.message) {
    const message = error.message;

    if (
      message.includes("row-level security") ||
      message.includes("permission denied") ||
      message.includes("not authorized") ||
      message.includes("Unauthorized")
    ) {
      return "目前帳號沒有上傳權限，請先確認已登入，或改用有權限的帳號。";
    }

    if (
      message.includes("Storage") ||
      message.includes("bucket") ||
      message.includes("object")
    ) {
      return "教材檔案儲存失敗，請稍後再試，或換一個較小、較清楚的檔案。";
    }

    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("Failed to fetch")
    ) {
      return "網路連線不穩，請確認網路後再試一次。";
    }

    return message;
  }

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
  const [hasUploaded, setHasUploaded] = useState(false);

  async function handleUpload() {
    if (files.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setHasUploaded(false);
    setMessage("正在上傳教材，請先不要關閉頁面...");
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
            `${selectedFile.name}：${getErrorMessage(
              error,
              "上傳失敗，請稍後再試。",
            )}`,
          );
        }
      }

      setFiles([]);
      setFormValues(initialFormValues);

      if (uploadedCount > 0) {
        setHasUploaded(true);
        setMessage(
          `已成功上傳 ${uploadedCount} 份教材。教材已保存，接下來等 AI 分析與題庫建立完成後，就可以到線上測驗練習。`,
        );
      } else {
        setMessage("");
      }

      if (failedMessages.length > 0) {
        setErrorMessage(
          [
            ...failedMessages.slice(0, 3),
            failedMessages.length > 3
              ? `另有 ${failedMessages.length - 3} 份教材未成功上傳。`
              : "",
            "建議確認檔案是否清楚、格式是否為 PDF、PNG、JPG、JPEG 或 WEBP。",
          ]
            .filter(Boolean)
            .join("\n"),
        );
      } else {
        setErrorMessage("");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "上傳教材失敗，請稍後再試。"));
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-pink-50 px-6 py-10 text-slate-900 sm:py-16">
      <div
        className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-sky-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-8rem] top-32 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
            >
              ← 返回首頁
            </Link>

            <Link
              href="/practice"
              className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
            >
              去線上測驗 →
            </Link>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">
                <span aria-hidden="true">📚</span>
                學生上傳教材
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                上傳你的教材
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                可以上傳 PDF、課本照片、講義圖片或練習題截圖。上傳後，系統會先保存教材，等 AI 分析與題庫建立完成後，就能進行練習。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-sky-500 via-blue-500 to-violet-500 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                上傳小提醒
              </p>
              <p className="mt-2 text-2xl font-black">拍清楚、傳上來</p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                文字越清楚，後續 AI 分析與建題效果越好。檔名不用完美，標題也可以先留空。
              </p>
            </div>
          </div>
        </header>

        {message && (
          <div className="rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-sm leading-6 text-blue-800 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>{message}</p>

              {hasUploaded && (
                <Link
                  href="/practice"
                  className="inline-flex w-fit rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
                >
                  去線上測驗 →
                </Link>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            className="whitespace-pre-line rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm leading-6 text-red-700 shadow-sm backdrop-blur"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-sm backdrop-blur">
          <div
            className="h-2 bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-8 p-6 sm:p-8">
            <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-5">
              <div className="mb-4 flex flex-col gap-2">
                <p className="text-sm font-bold text-sky-700">第一步</p>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  選擇要上傳的檔案
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  支援 PDF、PNG、JPG、JPEG、WEBP。可以一次選多個檔案。
                </p>
              </div>

              <SourceUpload files={files} onFilesSelect={setFiles} />
            </div>

            <div className="rounded-3xl border border-violet-100 bg-violet-50/70 p-5">
              <div className="mb-4 flex flex-col gap-2">
                <p className="text-sm font-bold text-violet-700">第二步</p>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  補上教材資訊
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  標題可以留空，系統會用檔案名稱當教材標題；年級也可以先選 AI 自動判斷。
                </p>
              </div>

              <div className="rounded-3xl bg-white/80 p-5 shadow-sm">
                <SourceForm
                  values={formValues}
                  onChange={setFormValues}
                  onSubmit={handleUpload}
                  disabled={files.length === 0 || isSubmitting}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-amber-50/80 p-5 text-sm leading-7 text-slate-700">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                  💡
                </div>

                <div>
                  <p className="font-black text-slate-900">上傳提醒</p>
                  <p className="mt-1">
                    如果沒有填標題，系統會用檔案名稱當教材標題。年級可以先選「AI
                    自動判斷」，之後會由系統分析教材內容。
                  </p>
                  <p className="mt-2">
                    上傳完成後，教材需要經過 AI 分析與題庫建立，才會出現在可練習的題目中。
                  </p>
                  <p className="mt-2">
                    如果建題效果不好，建議換一張更清楚、光線更均勻的圖片，或改用 PDF 檔。
                  </p>
                </div>
              </div>
            </div>

            {isSubmitting && (
              <div className="rounded-3xl border border-blue-100 bg-blue-50/80 p-5 text-sm leading-7 text-blue-800">
                <p className="font-black">教材上傳中...</p>
                <p className="mt-1">
                  請先不要關閉頁面，也不要重複點擊送出。檔案較多時會需要一點時間。
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}