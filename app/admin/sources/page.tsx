"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SourceForm, type SourceFormValues } from "@/components/SourceForm";
import { SourceList } from "@/components/SourceList";
import { SourceUpload } from "@/components/SourceUpload";
import { fetchSources, updateSourceStatus, uploadSource } from "@/lib/sources";
import type { SourceItem } from "@/types/sources";

const initialFormValues: SourceFormValues = {
  title: "",
  grade: "國一",
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message) return message;
  }

  return fallback;
}

export default function SourcesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [formValues, setFormValues] = useState<SourceFormValues>(initialFormValues);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSources = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const data = await fetchSources();
      setSources(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "載入教材列表失敗"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  async function handleAddSource() {
    if (!file) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const newSource = await uploadSource({
        title: formValues.title.trim(),
        grade: formValues.grade,
        file,
        fileType: getFileType(file),
      });

      setSources((prev) => [newSource, ...prev]);
      setFile(null);
      setFormValues(initialFormValues);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "上傳教材失敗"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnalyze(id: string) {
    setErrorMessage(null);

    setSources((prev) =>
      prev.map((source) =>
        source.id === id ? { ...source, status: "analyzing" as const } : source,
      ),
    );

    try {
      await updateSourceStatus(id, "analyzing");

      const response = await fetch("/api/analyze-source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceId: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "AI 分析失敗");
      }

      await loadSources();
    } catch (error) {
      try {
        await updateSourceStatus(id, "failed");
      } catch {
        // ignore secondary failure
      }

      setSources((prev) =>
        prev.map((source) =>
          source.id === id ? { ...source, status: "failed" as const } : source,
        ),
      );

      setErrorMessage(getErrorMessage(error, "AI 分析失敗"));
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex w-fit items-center text-sm font-medium text-blue-700 transition hover:text-blue-800"
          >
            ← 返回首頁
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">教材管理</h1>
            <p className="mt-2 text-base leading-7 text-slate-600">
              上傳教材並填寫標題與年級，檔案會儲存至 Supabase，科目與單元將由 AI 分析後自動填入。
            </p>
          </div>
        </header>

        {errorMessage && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SourceUpload file={file} onFileSelect={setFile} />
          <div className="border-t border-slate-100" />
          <SourceForm
            values={formValues}
            onChange={setFormValues}
            onSubmit={handleAddSource}
            disabled={!file || !formValues.title.trim() || isSubmitting}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SourceList
            sources={sources}
            isLoading={isLoading}
            onAnalyze={handleAnalyze}
          />
        </div>
      </div>
    </main>
  );
}