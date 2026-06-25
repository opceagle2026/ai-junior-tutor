"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SUPPORTED_SUBJECTS } from "@/types/subjects";

type WrongAnswerItem = {
  id: string;
  question_text: string;
  answer: string;
  student_answer: string;
  explanation: string;
  subject: string;
  grade?: string | null;
  unit: string;
  knowledge_point: string;
  wrong_count: number;
};

type TutorHintMap = Record<string, string>;

const SUBJECT_FILTERS = ["全部科目", ...SUPPORTED_SUBJECTS] as const;
const GRADE_FILTERS = ["全部年級", "國一", "國二", "國三"] as const;

type SubjectFilter = (typeof SUBJECT_FILTERS)[number];
type GradeFilter = (typeof GRADE_FILTERS)[number];

export default function WrongAnswersPage() {
  const [items, setItems] = useState<WrongAnswerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [subjectFilter, setSubjectFilter] =
    useState<SubjectFilter>("全部科目");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("全部年級");

  const [tutorHints, setTutorHints] = useState<TutorHintMap>({});
  const [loadingHintItemId, setLoadingHintItemId] = useState<string | null>(
    null,
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSubject =
        subjectFilter === "全部科目" || item.subject === subjectFilter;

      const matchesGrade =
        gradeFilter === "全部年級" || item.grade === gradeFilter;

      return matchesSubject && matchesGrade;
    });
  }, [items, subjectFilter, gradeFilter]);

  useEffect(() => {
    async function loadWrongAnswers() {
      setIsLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("wrong_answers")
        .select("*")
        .order("wrong_count", { ascending: false });

      if (error) {
        setMessage(error.message || "載入錯題失敗");
      }

      if (!error && data) {
        setItems(data as WrongAnswerItem[]);
      }

      setIsLoading(false);
    }

    void loadWrongAnswers();
  }, []);

  async function handleTutorHint(item: WrongAnswerItem) {
    if (loadingHintItemId !== null) return;

    setLoadingHintItemId(item.id);
    setMessage("");

    try {
      const response = await fetch("/api/tutor-hint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grade: item.grade || "國中",
          subject: item.subject,
          unit: item.unit,
          knowledgePoint: item.knowledge_point,
          questionText: item.question_text,
          options: null,
          answer: item.answer,
          explanation: item.explanation,
          studentAnswer: item.student_answer,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI 家教提示產生失敗");
      }

      setTutorHints((prev) => ({
        ...prev,
        [item.id]: result.hint || "AI 沒有產生提示內容。",
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 家教提示產生失敗");
    } finally {
      setLoadingHintItemId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            ← 返回首頁
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight">錯題庫</h1>

          <p className="mt-2 text-base leading-7 text-slate-600">
            系統會自動記錄答錯的題目，並統計錯誤次數。也可以依科目與年級篩選錯題，請 AI 家教一步一步提示。
          </p>
        </section>

        {message && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        {items.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">錯題篩選</h2>
                <p className="mt-1 text-sm text-slate-500">
                  目前顯示 {filteredItems.length} / 全部 {items.length} 題
                </p>
              </div>
            </div>

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

            <p className="mt-3 text-xs leading-6 text-slate-500">
              若舊錯題沒有年級資料，選擇特定年級時可能不會顯示；下一步補上錯題年級欄位後，新錯題就會正常分類。
            </p>
          </section>
        )}

        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            載入中...
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            目前沒有錯題。
          </div>
        )}

        {!isLoading && items.length > 0 && filteredItems.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            目前沒有符合篩選條件的錯題。
          </div>
        )}

        {filteredItems.map((item, index) => {
          const tutorHint = tutorHints[item.id];
          const isLoadingHint = loadingHintItemId === item.id;

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                  第 {index + 1} 題
                </span>

                {item.grade && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {item.grade}
                  </span>
                )}

                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {item.subject}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {item.unit}
                </span>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  {item.knowledge_point}
                </span>

                <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                  錯誤 {item.wrong_count} 次
                </span>
              </div>

              <p className="whitespace-pre-wrap text-base font-medium leading-7">
                {item.question_text}
              </p>

              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p>
                  <span className="font-semibold">你的答案：</span>
                  {item.student_answer || "未作答"}
                </p>

                <p className="mt-2">
                  <span className="font-semibold">正確答案：</span>
                  {item.answer}
                </p>

                <p className="mt-4 whitespace-pre-wrap">
                  <span className="font-semibold">詳解：</span>
                  {item.explanation}
                </p>

                <button
                  onClick={() => handleTutorHint(item)}
                  disabled={loadingHintItemId !== null}
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  {isLoadingHint ? "AI 思考中..." : "請 AI 教我"}
                </button>

                {tutorHint && (
                  <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-4">
                    <p className="mb-2 font-semibold text-indigo-800">
                      AI 家教提示
                    </p>

                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {tutorHint}
                    </p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}