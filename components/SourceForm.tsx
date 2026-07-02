"use client";

import { GRADES, type Grade } from "@/types/sources";

export type SourceFormValues = {
  title: string;
  grade: Grade;
};

type SourceFormProps = {
  values: SourceFormValues;
  onChange: (values: SourceFormValues) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100";

export function SourceForm({
  values,
  onChange,
  onSubmit,
  disabled,
  isSubmitting,
}: SourceFormProps) {
  function updateField<K extends keyof SourceFormValues>(
    key: K,
    value: SourceFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
          <span aria-hidden="true">📝</span>
          教材設定
        </div>

        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
          補充教材基本資訊
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          標題可自行填寫，也可以留空讓系統使用檔名；年級可手動指定，或交由 AI 自動判斷。
        </p>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50/80 p-5 text-sm leading-7 text-blue-800">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
            💡
          </div>

          <div>
            <p className="font-black text-blue-900">AI 會自動分析教材內容</p>
            <p className="mt-1">
              科目、單元與知識點會在教材分析後自動判斷。若教材年級已經很明確，可以先手動指定年級，讓後續建題更穩定。
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm font-bold text-slate-700">
            標題（可不填）
          </span>

          <input
            type="text"
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="可自訂教材標題；不填時會使用檔名"
            className={inputClassName}
          />

          <span className="text-xs leading-5 text-slate-500">
            批次上傳多個檔案時，如果有填標題，系統會以「標題 - 檔名」建立多筆教材。
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-slate-700">年級</span>

          <select
            required
            value={values.grade}
            onChange={(event) =>
              updateField("grade", event.target.value as Grade)
            }
            className={inputClassName}
          >
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          <span className="text-xs leading-5 text-slate-500">
            不確定年級時，可維持「AI 自動判斷」。
          </span>
        </label>

        <div className="flex items-end sm:justify-end">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 sm:w-auto"
          >
            {isSubmitting ? "自動建立中…" : "新增教材並自動建立題庫"}
          </button>
        </div>
      </form>
    </section>
  );
}