"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SourceForm, type SourceFormValues } from "@/components/SourceForm";
import { SourceList } from "@/components/SourceList";
import { SourceUpload } from "@/components/SourceUpload";
import {
  addWebSource,
  fetchSources,
  updateSourceStatus,
  uploadSource,
} from "@/lib/sources";
import { GRADES } from "@/types/sources";
import type { SourceItem } from "@/types/sources";

const initialFormValues: SourceFormValues = {
  title: "",
  grade: "AI 自動判斷",
};

type SearchMaterial = {
  title: string;
  url: string;
  content: string;
};

type AutoBuildResult = {
  ok: boolean;
  count: number;
  error?: string;
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

async function autoBuildSource(sourceId: string): Promise<AutoBuildResult> {
  try {
    const response = await fetch("/api/auto-build-source", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        count: 0,
        error: result.error || "自動建立題庫失敗",
      };
    }

    return {
      ok: true,
      count: result.count ?? 0,
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      error: getErrorMessage(error, "自動建立題庫失敗"),
    };
  }
}

export default function SourcesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [formValues, setFormValues] =
    useState<SourceFormValues>(initialFormValues);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [buildMessage, setBuildMessage] = useState<string>("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchGrade, setSearchGrade] =
    useState<SourceFormValues["grade"]>("AI 自動判斷");
  const [isSearching, setIsSearching] = useState(false);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchMaterial[]>([]);
  const [searchMessage, setSearchMessage] = useState("");

  const isBuilding = isSubmitting || addingUrl !== null;

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

  async function handleSearchMaterials() {
    if (!searchKeyword.trim() || addingUrl !== null) return;

    setIsSearching(true);
    setSearchMessage("");
    setSearchResults([]);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/search-materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: searchKeyword.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "搜尋教材失敗");
      }

      setSearchResults(result.materials ?? []);
      setSearchMessage(`找到 ${result.count ?? 0} 筆搜尋結果`);
    } catch (error) {
      setSearchMessage(getErrorMessage(error, "搜尋教材失敗"));
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAddWebMaterial(item: SearchMaterial) {
    if (!item.url || addingUrl !== null) return;

    setAddingUrl(item.url);
    setErrorMessage(null);
    setSearchMessage("");

    try {
      const newSource = await addWebSource({
        title: item.title || searchKeyword,
        grade: searchGrade,
        url: item.url,
        content: item.content,
        keyword: searchKeyword.trim(),
      });

      setSources((prev) => [
        {
          ...newSource,
          status: "analyzing",
        },
        ...prev,
      ]);

      setSearchMessage("已加入教材，正在自動分析並建立題庫...");

      const result = await autoBuildSource(newSource.id);

      await loadSources();

      if (!result.ok) {
        throw new Error(result.error || "自動建立題庫失敗");
      }

      setSearchMessage(`完成！教材已分析並自動建立 ${result.count} 題。`);
    } catch (error) {
      await loadSources();

      setSearchMessage(
        getErrorMessage(error, "加入教材或自動建立題庫失敗"),
      );
    } finally {
      setAddingUrl(null);
    }
  }

  async function handleAddSource() {
    if (files.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setBuildMessage("正在上傳教材並自動建立題庫，請稍候...");

    let uploadedCount = 0;
    let completedCount = 0;
    let failedCount = 0;
    let totalQuestionCount = 0;
    const failedMessages: string[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const selectedFile = files[index];

        setBuildMessage(
          `正在處理第 ${index + 1} / ${files.length} 份教材：${selectedFile.name}`,
        );

        try {
          const newSource = await uploadSource({
            title: getTitleForFile(
              formValues.title,
              selectedFile,
              files.length,
            ),
            grade: formValues.grade,
            file: selectedFile,
            fileType: getFileType(selectedFile),
          });

          uploadedCount += 1;

          setSources((prev) => [
            {
              ...newSource,
              status: "analyzing",
            },
            ...prev,
          ]);

          setBuildMessage(
            `已上傳「${newSource.title}」，正在 AI 分析並建立題庫...`,
          );

          const result = await autoBuildSource(newSource.id);

          if (result.ok) {
            completedCount += 1;
            totalQuestionCount += result.count;
          } else {
            failedCount += 1;
            failedMessages.push(
              `${newSource.title}：${result.error || "自動建立題庫失敗"}`,
            );
          }

          await loadSources();
        } catch (error) {
          failedCount += 1;
          failedMessages.push(
            `${selectedFile.name}：${getErrorMessage(
              error,
              "上傳或自動建立題庫失敗",
            )}`,
          );
        }
      }

      setFiles([]);
      setFormValues(initialFormValues);

      const summaryMessage = [
        `完成處理 ${files.length} 份教材。`,
        `成功上傳 ${uploadedCount} 份。`,
        `成功建立題庫 ${completedCount} 份。`,
        `共建立 ${totalQuestionCount} 題。`,
        failedCount > 0 ? `有 ${failedCount} 份未完成。` : "",
      ]
        .filter(Boolean)
        .join(" ");

      setBuildMessage(summaryMessage);

      if (failedMessages.length > 0) {
        setErrorMessage(failedMessages.slice(0, 3).join("\n"));
      } else {
        setErrorMessage(null);
      }

      await loadSources();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "批次上傳教材失敗"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnalyze(id: string) {
    if (isBuilding) return;

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
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              教材管理
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-600">
              可批次上傳教材、拍照輸入教材，或自動搜尋網路教材。新增後系統會自動判斷年級、分析內容並建立題庫。
            </p>
          </div>
        </header>

        {errorMessage && (
          <div
            className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {buildMessage && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
            {buildMessage}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">自動搜尋教材</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            輸入關鍵字，例如「國二 一次函數」、「國一 英文 現在式」，系統會搜尋可作為教材來源的網頁內容。
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px_auto]">
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="例如：國二 一次函數"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <select
              value={searchGrade}
              onChange={(e) =>
                setSearchGrade(e.target.value as SourceFormValues["grade"])
              }
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>

            <button
              onClick={handleSearchMaterials}
              disabled={!searchKeyword.trim() || isSearching || addingUrl !== null}
              className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {isSearching ? "搜尋中..." : "搜尋教材"}
            </button>
          </div>

          {searchMessage && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {searchMessage}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-5 space-y-4">
              {searchResults.map((item, index) => (
                <article
                  key={`${item.url}-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.title || "未命名教材"}
                      </h3>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block break-all text-sm text-blue-700 hover:underline"
                        >
                          {item.url}
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddWebMaterial(item)}
                      disabled={addingUrl !== null}
                      className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300"
                    >
                      {addingUrl === item.url
                        ? "自動建立中..."
                        : addingUrl !== null
                          ? "請稍候..."
                          : "加入教材並自動出題"}
                    </button>
                  </div>

                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                    {item.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SourceUpload files={files} onFilesSelect={setFiles} />
          <div className="border-t border-slate-100" />
          <SourceForm
            values={formValues}
            onChange={setFormValues}
            onSubmit={handleAddSource}
            disabled={files.length === 0 || isSubmitting}
            isSubmitting={isSubmitting}
          />
          <p className="text-sm text-slate-500">
            批次上傳時，若未填標題，系統會以各檔案名稱作為教材標題；若有填標題，會以「標題 - 檔名」建立多筆教材。年級預設由 AI 自動判斷，新增後會自動分析並建立題庫。
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SourceList
            sources={sources}
            isLoading={isLoading}
            isActionDisabled={isBuilding}
            onAnalyze={handleAnalyze}
          />
        </div>
      </div>
    </main>
  );
}