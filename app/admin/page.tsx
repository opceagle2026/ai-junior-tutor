"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchQuestions, type QuestionItem } from "@/lib/questions";
import { fetchSources } from "@/lib/sources";
import type { SourceItem } from "@/types/sources";

const adminCards = [
  {
    href: "/admin/sources",
    icon: "🗂️",
    title: "教材管理",
    description: "上傳 PDF、圖片或搜尋網路教材，並啟動 AI 分析與自動建題。",
    action: "管理教材 →",
    iconClass: "from-sky-400 to-blue-500",
    actionClass: "text-blue-700",
  },
  {
    href: "/admin/questions",
    icon: "📝",
    title: "題庫管理",
    description: "檢視 AI 產生的題目，依科目、年級篩選，並刪除不適合的題目。",
    action: "管理題庫 →",
    iconClass: "from-violet-400 to-purple-500",
    actionClass: "text-violet-700",
  },
  {
    href: "/admin/ai-analysis",
    icon: "🤖",
    title: "AI 分析儀表板",
    description: "查看教材目前是已上傳、分析中、已完成或分析失敗。",
    action: "查看分析狀態 →",
    iconClass: "from-emerald-400 to-teal-500",
    actionClass: "text-emerald-700",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "上傳教材",
    description: "可上傳 PDF、圖片、拍照教材，或從網路搜尋教材來源。",
  },
  {
    step: "02",
    title: "AI 分析",
    description: "系統會判斷年級、科目、單元與知識點，整理成可建題素材。",
  },
  {
    step: "03",
    title: "建立題庫",
    description: "依教材內容產生題目，後台可檢視、篩選與刪除不適合的題目。",
  },
];

function StatCard({
  title,
  value,
  unit,
  description,
  className,
}: {
  title: string;
  value: number | string;
  unit: string;
  description: string;
  className: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${className}`}>
      <p className="text-sm font-black">{title}</p>

      <p className="mt-3 text-4xl font-black">
        {value}
        <span className="ml-1 text-lg font-bold opacity-70">{unit}</span>
      </p>

      <p className="mt-2 text-xs font-bold opacity-80">{description}</p>
    </div>
  );
}

export default function AdminPage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setMessage("");

      try {
        const [sourceData, questionData] = await Promise.all([
          fetchSources(),
          fetchQuestions(),
        ]);

        setSources(sourceData);
        setQuestions(questionData);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "載入後台統計失敗");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const sourceStats = useMemo(() => {
    return sources.reduce(
      (stats, source) => {
        stats.total += 1;

        if (source.status === "completed") {
          stats.completed += 1;
        }

        if (source.status === "failed") {
          stats.failed += 1;
        }

        if (source.status === "uploaded" || source.status === "analyzing") {
          stats.pending += 1;
        }

        return stats;
      },
      {
        total: 0,
        completed: 0,
        failed: 0,
        pending: 0,
      },
    );
  }, [sources]);

  const completedRate =
    sourceStats.total === 0
      ? 0
      : Math.round((sourceStats.completed / sourceStats.total) * 100);

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

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                登出
              </button>
            </form>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">
                <span aria-hidden="true">🛠️</span>
                後台管理首頁
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                管理教材、題庫與 AI 分析
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                這裡是 AI 國中家教題庫的管理入口。可以從教材上傳開始，讓 AI 分析內容，再建立可供學生練習的題庫。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                整體分析完成率
              </p>

              <p className="mt-2 text-5xl font-black">
                {isLoading ? "…" : completedRate}
                <span className="ml-1 text-2xl font-bold text-white/80">
                  %
                </span>
              </p>

              <p className="mt-3 text-sm leading-6 text-white/85">
                {isLoading
                  ? "正在讀取後台統計資料..."
                  : `目前共有 ${sourceStats.total} 份教材，其中 ${sourceStats.completed} 份已完成分析。`}
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
          <StatCard
            title="教材總數"
            value={isLoading ? "…" : sourceStats.total}
            unit="份"
            description="目前後台已建立的教材來源"
            className="border-sky-100 bg-sky-50 text-sky-700"
          />

          <StatCard
            title="已完成分析"
            value={isLoading ? "…" : sourceStats.completed}
            unit="份"
            description="可用於建立題庫的教材"
            className="border-emerald-100 bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="題庫總題數"
            value={isLoading ? "…" : questions.length}
            unit="題"
            description="目前可供測驗使用的題目"
            className="border-violet-100 bg-violet-50 text-violet-700"
          />

          <StatCard
            title="分析失敗"
            value={isLoading ? "…" : sourceStats.failed}
            unit="份"
            description="建議回教材管理重新分析"
            className="border-red-100 bg-red-50 text-red-700"
          />
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {adminCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.iconClass} text-2xl shadow-sm transition group-hover:scale-105`}
              >
                {card.icon}
              </div>

              <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
                {card.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {card.description}
              </p>

              <p className={`mt-4 text-sm font-bold ${card.actionClass}`}>
                {card.action}
              </p>
            </Link>
          ))}
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <div
            className="h-2 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500"
            aria-hidden="true"
          />

          <div className="p-6 sm:p-8">
            <p className="text-sm font-bold text-indigo-700">建議工作流程</p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              從教材到題庫的三個步驟
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              目前後台的核心流程是先建立教材來源，再讓 AI 分析教材內容，最後產生題目並整理到題庫管理頁。
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {workflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5"
                >
                  <p className="text-sm font-black text-blue-700">
                    {item.step}
                  </p>

                  <h3 className="mt-2 text-lg font-black text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-amber-100 bg-amber-50/80 p-6 text-sm leading-7 text-slate-700 shadow-sm backdrop-blur sm:p-8">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
              💡
            </div>

            <div>
              <p className="font-black text-slate-900">管理提醒</p>
              <p className="mt-1">
                如果教材分析失敗，可以到「教材管理」重新分析；如果題目內容不適合，可以到「題庫管理」刪除題目。學生端只會使用已建立的題庫與自己的錯題紀錄。
              </p>

              {sourceStats.failed > 0 && (
                <Link
                  href="/admin/sources"
                  className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm hover:bg-red-50"
                >
                  有 {sourceStats.failed} 份教材分析失敗，前往處理 →
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}