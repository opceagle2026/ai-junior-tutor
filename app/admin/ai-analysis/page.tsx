"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchSources } from "@/lib/sources";
import type { SourceItem, SourceStatus } from "@/types/sources";

const STATUS_LABELS: Record<SourceStatus, string> = {
  uploaded: "已上傳",
  analyzing: "分析中",
  completed: "分析完成",
  failed: "分析失敗",
};

const STATUS_DESCRIPTIONS: Record<SourceStatus, string> = {
  uploaded: "等待 AI 分析",
  analyzing: "AI 正在處理",
  completed: "可建立題庫",
  failed: "需要重新處理",
};

const STATUS_CARD_STYLES: Record<SourceStatus, string> = {
  uploaded: "border-sky-100 bg-sky-50 text-sky-700",
  analyzing: "border-amber-100 bg-amber-50 text-amber-700",
  completed: "border-emerald-100 bg-emerald-50 text-emerald-700",
  failed: "border-red-100 bg-red-50 text-red-700",
};

const STATUS_BADGE_STYLES: Record<SourceStatus, string> = {
  uploaded: "bg-sky-100 text-sky-700 ring-sky-200",
  analyzing: "bg-amber-100 text-amber-700 ring-amber-200",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  failed: "bg-red-100 text-red-700 ring-red-200",
};

const STATUS_BAR_STYLES: Record<SourceStatus, string> = {
  uploaded: "from-sky-400 via-blue-500 to-indigo-500",
  analyzing: "from-amber-400 via-orange-500 to-rose-500",
  completed: "from-emerald-400 via-teal-500 to-cyan-500",
  failed: "from-red-400 via-rose-500 to-pink-500",
};

function getDisplayValue(value: string | null | undefined) {
  if (!value || value === "AI 自動判斷") {
    return "待判斷";
  }

  return value;
}

function getSourceTime(source: SourceItem) {
  if ("createdAt" in source && typeof source.createdAt === "string") {
    return source.createdAt;
  }

  if ("created_at" in source && typeof source.created_at === "string") {
    return source.created_at;
  }

  return "";
}

function formatSourceTime(value: string) {
  if (!value) {
    return "無時間資料";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AiAnalysisPage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSources() {
      setIsLoading(true);
      setMessage("");

      try {
        const data = await fetchSources();
        setSources(data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "載入 AI 分析狀態失敗");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSources();
  }, []);

  const statusCounts = useMemo(() => {
    return sources.reduce<Record<SourceStatus, number>>(
      (counts, source) => {
        counts[source.status] += 1;
        return counts;
      },
      {
        uploaded: 0,
        analyzing: 0,
        completed: 0,
        failed: 0,
      },
    );
  }, [sources]);

  const recentSources = useMemo(() => {
    return [...sources]
      .sort((a, b) => {
        const timeA = new Date(getSourceTime(a)).getTime();
        const timeB = new Date(getSourceTime(b)).getTime();

        if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
        if (Number.isNaN(timeA)) return 1;
        if (Number.isNaN(timeB)) return -1;

        return timeB - timeA;
      })
      .slice(0, 8);
  }, [sources]);

  const activeCount = statusCounts.uploaded + statusCounts.analyzing;
  const completedRate =
    sources.length === 0
      ? 0
      : Math.round((statusCounts.completed / sources.length) * 100);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-sky-50 px-6 py-10 text-slate-900 sm:py-16">
      <div
        className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-sky-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-8rem] top-32 h-96 w-96 rounded-full bg-violet-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
            >
              ← 返回首頁
            </Link>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/sources"
                className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                教材管理
              </Link>

              <Link
                href="/admin/questions"
                className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
              >
                題庫管理 →
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">
                <span aria-hidden="true">🤖</span>
                AI 分析儀表板
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                查看教材分析狀態
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                這裡會統整教材的 AI 分析進度，包含已上傳、分析中、分析完成與分析失敗，方便快速掌握後台處理狀況。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">整體完成率</p>

              <p className="mt-2 text-5xl font-black">
                {completedRate}
                <span className="ml-1 text-2xl font-bold text-white/80">%</span>
              </p>

              <p className="mt-3 text-sm leading-6 text-white/85">
                全部教材 {sources.length} 份，其中 {statusCounts.completed} 份已完成分析。
                {activeCount > 0
                  ? ` 目前還有 ${activeCount} 份等待或分析中。`
                  : " 目前沒有等待中的教材。"}
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm leading-6 text-red-700 shadow-sm">
            {message}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(["uploaded", "analyzing", "completed", "failed"] as SourceStatus[]).map(
            (status) => (
              <div
                key={status}
                className={`rounded-3xl border p-5 shadow-sm ${STATUS_CARD_STYLES[status]}`}
              >
                <p className="text-sm font-black">{STATUS_LABELS[status]}</p>

                <p className="mt-3 text-4xl font-black">
                  {isLoading ? "…" : statusCounts[status]}
                  <span className="ml-1 text-lg font-bold opacity-70">份</span>
                </p>

                <p className="mt-2 text-xs font-bold opacity-80">
                  {STATUS_DESCRIPTIONS[status]}
                </p>
              </div>
            ),
          )}
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Link
            href="/admin/sources"
            className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 text-2xl shadow-sm">
              🗂️
            </div>

            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
              教材管理
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              查看教材上傳、AI 分析狀態，並重新分析或建立題庫。
            </p>

            <p className="mt-4 text-sm font-bold text-blue-700">
              前往教材管理 →
            </p>
          </Link>

          <Link
            href="/admin/questions"
            className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 text-2xl shadow-sm">
              📝
            </div>

            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
              題庫管理
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              檢視 AI 產生的題目，依科目、年級篩選，或刪除不適合的題目。
            </p>

            <p className="mt-4 text-sm font-bold text-violet-700">
              前往題庫管理 →
            </p>
          </Link>

          <Link
            href="/stats"
            className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl shadow-sm">
              📈
            </div>

            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
              學習統計
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              查看題庫分布與個人錯題統計，作為後續教材與題目優化參考。
            </p>

            <p className="mt-4 text-sm font-bold text-emerald-700">
              查看學習統計 →
            </p>
          </Link>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <div
            className="h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500"
            aria-hidden="true"
          />

          <div className="p-6 sm:p-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-indigo-700">最近教材</p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                  最近 8 筆 AI 分析狀態
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  可快速查看最近教材的分析結果；若有失敗教材，可前往教材管理頁重新處理。
                </p>
              </div>

              <Link
                href="/admin/sources"
                className="inline-flex w-fit rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
              >
                管理全部教材 →
              </Link>
            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
                載入 AI 分析狀態中...
              </div>
            ) : recentSources.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
                目前尚無教材。請先到教材管理頁上傳教材。
              </div>
            ) : (
              <div className="space-y-4">
                {recentSources.map((source) => (
                  <article
                    key={source.id}
                    className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/80 shadow-sm"
                  >
                    <div
                      className={`h-1.5 bg-gradient-to-r ${STATUS_BAR_STYLES[source.status]}`}
                      aria-hidden="true"
                    />

                    <div className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_BADGE_STYLES[source.status]}`}
                            >
                              {STATUS_LABELS[source.status]}
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                              {getDisplayValue(source.grade)}
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                              {getDisplayValue(source.subject)}
                            </span>
                          </div>

                          <h3 className="mt-3 break-words text-lg font-black leading-7 text-slate-900">
                            {source.title}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            單元：{getDisplayValue(source.unit)}｜時間：
                            {formatSourceTime(getSourceTime(source))}
                          </p>
                        </div>

                        {source.status === "failed" ? (
                          <Link
                            href="/admin/sources"
                            className="inline-flex w-fit rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm hover:bg-red-50"
                          >
                            前往重試
                          </Link>
                        ) : (
                          <Link
                            href="/admin/sources"
                            className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            查看教材
                          </Link>
                        )}
                      </div>

                      {source.knowledgePoints.length > 0 && (
                        <div className="mt-4 border-t border-slate-200 pt-4">
                          <p className="text-xs font-bold text-slate-500">
                            知識點
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {source.knowledgePoints.slice(0, 8).map((point) => (
                              <span
                                key={point}
                                className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200"
                              >
                                {point}
                              </span>
                            ))}

                            {source.knowledgePoints.length > 8 && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                +{source.knowledgePoints.length - 8}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}