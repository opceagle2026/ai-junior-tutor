"use client";

import type { SourceItem, SourceStatus } from "@/types/sources";

type SourceListProps = {
  sources: SourceItem[];
  isLoading?: boolean;
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

export function SourceList({ sources, isLoading, onAnalyze }: SourceListProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">教材列表</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
          共 {sources.length} 筆
        </span>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          載入教材列表中…
        </div>
      ) : sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          尚無教材，請上傳檔案並填寫標題與年級後加入。
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sources.map((source) => {
            const canAnalyze =
              source.status === "uploaded" || source.status === "failed";
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
                    <p className="text-sm text-slate-600">{source.grade}</p>
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
                    {source.status === "analyzing"
                      ? "分析中…"
                      : source.status === "failed"
                        ? "重新分析教材"
                        : "AI 分析教材"}
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