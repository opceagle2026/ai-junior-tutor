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
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

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
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">教材資訊</h2>

      <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
        年級、科目與單元將由 AI 分析教材後自動判斷。若你已確定年級，也可以手動指定。
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            標題（可不填）
          </span>
          <input
            type="text"
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="可自訂教材標題；不填時會使用檔名"
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">年級</span>
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
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? "自動建立中…" : "新增教材並自動建立題庫"}
          </button>
        </div>
      </form>
    </section>
  );
}