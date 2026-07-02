"use client";

import { useMemo, useState } from "react";
import type { SourceItem, SourceStatus } from "@/types/sources";
import { SUPPORTED_SUBJECTS } from "@/types/subjects";

type SourceListProps = {
  sources: SourceItem[];
  isLoading?: boolean;
  isActionDisabled?: boolean;
  onAnalyze: (id: string) => void;
};

const STATUS_LABELS: Record<SourceStatus, string> = {
  uploaded: "已上傳",
  analyzing: "分析中",
  completed: "分析完成",
  failed: "分析失敗",
};

const STATUS_STYLES: Record<SourceStatus, string> = {
  uploaded: "bg-sky-100 text-sky-700 ring-sky-200",
  analyzing: "bg-amber-100 text-amber-700 ring-amber-200",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  failed: "bg-red-100 text-red-700 ring-red-200",
};

const STATUS_DOT_STYLES: Record<SourceStatus, string> = {
  uploaded: "bg-sky-500",
  analyzing: "bg-amber-500",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
};

const STATUS_BAR_STYLES: Record<SourceStatus, string> = {
  uploaded: "from-sky-400 via-blue-500 to-indigo-500",
  analyzing: "from-amber-400 via-orange-500 to-rose-500",
  completed: "from-emerald-400 via-teal-500 to-cyan-500",
  failed: "from-red-400 via-rose-500 to-pink-500",
};

const SUBJECT_FILTERS = ["全部科目", ...SUPPORTED_SUBJECTS] as const;
const GRADE_FILTERS = ["全部年級", "國一", "國二", "國三"] as const;

type SubjectFilter = (typeof SUBJECT_FILTERS)[number];
type GradeFilter = (typeof GRADE_FILTERS)[number];

function getSourceSummary(source: SourceItem): string {
  if ("summary" in source && typeof source.summary === "string") {
    return source.summary.trim();
  }

  return "";
}

function getFailedReason(source: SourceItem): string {
  const summary = getSourceSummary(source);

  if (summary) {
    return summary;
  }

  return "這份教材分析失敗，可能是內容不屬於國中課程、檔案無法辨識，或 AI 服務暫時發生問題。";
}

function getAnalyzeButtonLabel(source: SourceItem, isActionDisabled?: boolean) {
  if (source.status === "analyzing") {
    return "分析中…";
  }

  if (isActionDisabled) {
    return "自動建立中…";
  }

  if (source.status === "failed") {
    return "重新分析教材";
  }

  return "AI 分析教材";
}

function getSourceFileName(source: SourceItem) {
  if (source.fileName) {
    return source.fileName;
  }

  return "網路教材或無檔名";
}

function getDisplayValue(value: string | null | undefined) {
  if (!value || value === "AI 自動判斷") {
    return "待判斷";
  }

  return value;
}

export function SourceList({
  sources,
  isLoading,
  isActionDisabled,
  onAnalyze,
}: SourceListProps) {
  const [subjectFilter, setSubjectFilter] =
    useState<SubjectFilter>("全部科目");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("全部年級");
  const [deletedSourceIds, setDeletedSourceIds] = useState<string[]>([]);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  const visibleSources = useMemo(() => {
    return sources.filter((source) => !deletedSourceIds.includes(source.id));
  }, [sources, deletedSourceIds]);

  const filteredSources = useMemo(() => {
    return visibleSources.filter((source) => {
      const matchesSubject =
        subjectFilter === "全部科目" || source.subject === subjectFilter;

      const matchesGrade =
        gradeFilter === "全部年級" || source.grade === gradeFilter;

      return matchesSubject && matchesGrade;
    });
  }, [visibleSources, subjectFilter, gradeFilter]);

  async function handleDeleteSource(source: SourceItem) {
    if (deletingSourceId !== null || isActionDisabled) {
      return;
    }

    const confirmed = window.confirm(
      `確定要刪除「${source.title}」嗎？\n\n這會一起刪除：\n1. 教材資料\n2. 相關題目\n3. 相關錯題紀錄\n4. Storage 裡的教材檔案\n\n此動作無法復原。`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingSourceId(source.id);
    setDeleteMessage("");

    try {
      const response = await fetch("/api/delete-source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceId: source.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "刪除教材失敗");
      }

      setDeletedSourceIds((prev) => [...prev, source.id]);
      setDeleteMessage(
        `已刪除「${source.title}」，並移除相關題目 ${result.deletedQuestionCount ?? 0} 題。`,
      );
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "刪除教材失敗");
    } finally {
      setDeletingSourceId(null);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
            <span aria-hidden="true">🗂️</span>
            教材列表
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
            已建立的教材來源
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            可依科目與年級篩選教材，也可重新分析、刪除教材與相關題目。
          </p>
        </div>

        <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-200">
          顯示 {filteredSources.length} / {visibleSources.length} 筆
        </span>
      </div>

      {deleteMessage && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm leading-6 text-blue-800 shadow-sm">
          {deleteMessage}
        </div>
      )}

      {visibleSources.length > 0 && (
        <div className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-700">科目</span>
            <select
              value={subjectFilter}
              onChange={(event) =>
                setSubjectFilter(event.target.value as SubjectFilter)
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              {SUBJECT_FILTERS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-700">年級</span>
            <select
              value={gradeFilter}
              onChange={(event) =>
                setGradeFilter(event.target.value as GradeFilter)
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              {GRADE_FILTERS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
          載入教材列表中…
        </div>
      ) : visibleSources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
          尚無教材，請上傳檔案並填寫標題與年級後加入。
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
          目前沒有符合篩選條件的教材。
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filteredSources.map((source) => {
            const canAnalyze =
              !isActionDisabled &&
              (source.status === "uploaded" || source.status === "failed");

            const failedReason =
              source.status === "failed" ? getFailedReason(source) : "";

            const isDeleting = deletingSourceId === source.id;

            return (
              <li
                key={source.id}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/80 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div
                  className={`h-1.5 bg-gradient-to-r ${STATUS_BAR_STYLES[source.status]}`}
                  aria-hidden="true"
                />

                <div className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_STYLES[source.status]}`}
                          aria-hidden="true"
                        />

                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_STYLES[source.status]}`}
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

                      <p className="mt-2 break-all text-xs leading-5 text-slate-500">
                        {getSourceFileName(source)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onAnalyze(source.id)}
                        disabled={!canAnalyze}
                        className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300"
                      >
                        {getAnalyzeButtonLabel(source, isActionDisabled)}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSource(source)}
                        disabled={
                          isDeleting ||
                          deletingSourceId !== null ||
                          isActionDisabled ||
                          source.status === "analyzing"
                        }
                        className="inline-flex items-center rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        {isDeleting ? "刪除中…" : "刪除教材"}
                      </button>
                    </div>
                  </div>

                  <dl className="mt-5 grid gap-3 border-t border-slate-200 pt-5 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <dt className="text-xs font-bold text-slate-500">
                        AI 判斷科目
                      </dt>
                      <dd className="mt-1 font-black text-slate-800">
                        {getDisplayValue(source.subject)}
                      </dd>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <dt className="text-xs font-bold text-slate-500">
                        AI 判斷單元
                      </dt>
                      <dd className="mt-1 font-black text-slate-800">
                        {getDisplayValue(source.unit)}
                      </dd>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <dt className="text-xs font-bold text-slate-500">
                        年級
                      </dt>
                      <dd className="mt-1 font-black text-slate-800">
                        {getDisplayValue(source.grade)}
                      </dd>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <dt className="text-xs font-bold text-slate-500">
                        狀態
                      </dt>
                      <dd className="mt-1 font-black text-slate-800">
                        {STATUS_LABELS[source.status]}
                      </dd>
                    </div>
                  </dl>

                  {source.status === "failed" && (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm leading-6 text-red-700">
                      <p className="font-black">失敗原因</p>
                      <p className="mt-1">{failedReason}</p>
                    </div>
                  )}

                  {source.knowledgePoints.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-xs font-bold text-slate-500">
                        知識點
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {source.knowledgePoints.map((point) => (
                          <span
                            key={point}
                            className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200"
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}