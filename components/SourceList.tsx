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
  uploaded: "bg-blue-50 text-blue-700 ring-blue-100",
  analyzing: "bg-amber-50 text-amber-700 ring-amber-100",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  failed: "bg-red-50 text-red-700 ring-red-100",
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

export function SourceList({
  sources,
  isLoading,
  isActionDisabled,
  onAnalyze,
}: SourceListProps) {
  const [subjectFilter, setSubjectFilter] =
    useState<SubjectFilter>("全部科目");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("全部年級");

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      const matchesSubject =
        subjectFilter === "全部科目" || source.subject === subjectFilter;

      const matchesGrade =
        gradeFilter === "全部年級" || source.grade === gradeFilter;

      return matchesSubject && matchesGrade;
    });
  }, [sources, subjectFilter, gradeFilter]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">教材列表</h2>
          <p className="mt-1 text-sm text-slate-500">
            可依科目與年級篩選教材。
          </p>
        </div>

        <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
          顯示 {filteredSources.length} / {sources.length} 筆
        </span>
      </div>

      {sources.length > 0 && (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">科目</span>
            <select
              value={subjectFilter}
              onChange={(event) =>
                setSubjectFilter(event.target.value as SubjectFilter)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {SUBJECT_FILTERS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">年級</span>
            <select
              value={gradeFilter}
              onChange={(event) =>
                setGradeFilter(event.target.value as GradeFilter)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          載入教材列表中…
        </div>
      ) : sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          尚無教材，請上傳檔案並填寫標題與年級後加入。
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          目前沒有符合篩選條件的教材。
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredSources.map((source) => {
            const canAnalyze =
              !isActionDisabled &&
              (source.status === "uploaded" || source.status === "failed");

            const failedReason =
              source.status === "failed" ? getFailedReason(source) : "";

            return (
              <li
                key={source.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-slate-900">
                      {source.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                        {source.grade}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                        {source.subject}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${STATUS_STYLES[source.status]}`}
                  >
                    {STATUS_LABELS[source.status]}
                  </span>
                </div>

                <dl className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">檔名</dt>
                    <dd className="break-all font-medium text-slate-800">
                      {source.fileName}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-slate-500">狀態</dt>
                    <dd className="font-medium text-slate-800">
                      {STATUS_LABELS[source.status]}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-slate-500">AI 判斷科目</dt>
                    <dd className="font-medium text-slate-800">
                      {source.subject}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-slate-500">AI 判斷單元</dt>
                    <dd className="font-medium text-slate-800">
                      {source.unit}
                    </dd>
                  </div>
                </dl>

                {source.status === "failed" && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    <p className="font-medium">失敗原因</p>
                    <p className="mt-1">{failedReason}</p>
                  </div>
                )}

                {source.knowledgePoints.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">知識點</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {source.knowledgePoints.map((point) => (
                        <span
                          key={point}
                          className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => onAnalyze(source.id)}
                    disabled={!canAnalyze}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {getAnalyzeButtonLabel(source, isActionDisabled)}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}