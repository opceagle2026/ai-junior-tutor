"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SUPPORTED_SUBJECTS } from "@/types/subjects";

type WrongAnswerItem = {
  id: string;
  user_id: string | null;
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

function getWrongCountStyle(count: number) {
  if (count >= 5) {
    return "bg-red-100 text-red-700";
  }

  if (count >= 3) {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-amber-100 text-amber-700";
}

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

  const totalWrongCount = useMemo(() => {
    return items.reduce((total, item) => total + item.wrong_count, 0);
  }, [items]);

  useEffect(() => {
    async function loadWrongAnswers() {
      setIsLoading(true);
      setMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          window.location.href = "/login?redirectedFrom=/wrong-answers";
          return;
        }

        const { data, error } = await supabase
          .from("wrong_answers")
          .select("*")
          .eq("user_id", user.id)
          .gt("wrong_count", 0)
          .order("wrong_count", { ascending: false });

        if (error) {
          throw error;
        }

        setItems((data || []) as WrongAnswerItem[]);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "載入錯題失敗");
      } finally {
        setIsLoading(false);
      }
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
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-pink-50 px-6 py-10 text-slate-900 sm:py-16">
      <div
        className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-sky-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-8rem] top-32 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
            >
              ← 返回首頁
            </Link>

            <Link
              href="/wrong-review"
              className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-emerald-600 hover:to-teal-600"
            >
              開始錯題複習 →
            </Link>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
                <span aria-hidden="true">🧩</span>
                個人錯題庫
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                把不會的題目，一題一題補起來
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                系統會記錄你的個人錯題與錯誤次數。可以依科目、年級篩選，也可以請 AI 家教一步一步提示。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                目前錯題
              </p>
              <p className="mt-2 text-4xl font-black">
                {items.length}
                <span className="ml-1 text-lg font-bold text-white/80">
                  題
                </span>
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                累計錯誤次數：{totalWrongCount} 次。錯題不是失敗，是下一次進步的地圖。
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 text-sm leading-6 text-slate-700 shadow-sm backdrop-blur">
            {message}
          </div>
        )}

        {items.length > 0 && (
          <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-blue-700">錯題篩選</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                  找出今天要加強的題目
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  目前顯示 {filteredItems.length} / 全部 {items.length} 題
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-white bg-white/80 p-4 shadow-sm sm:grid-cols-2">
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
          </section>
        )}

        {isLoading && (
          <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 text-slate-700 shadow-sm backdrop-blur">
            載入錯題中...
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-3xl">
              🎉
            </div>

            <h2 className="mt-4 text-2xl font-black text-slate-900">
              目前沒有錯題
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-600">
              太好了！目前還沒有需要複習的錯題。可以先去線上測驗練習一小組題目，答錯的題目會自動收進這裡。
            </p>

            <Link
              href="/practice"
              className="mt-5 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
            >
              開始線上測驗 →
            </Link>
          </div>
        )}

        {!isLoading && items.length > 0 && filteredItems.length === 0 && (
          <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 text-slate-700 shadow-sm backdrop-blur">
            目前沒有符合篩選條件的錯題。可以換一個科目或年級看看。
          </div>
        )}

        {filteredItems.map((item, index) => {
          const tutorHint = tutorHints[item.id];
          const isLoadingHint = loadingHintItemId === item.id;
          const wrongCountStyle = getWrongCountStyle(item.wrong_count);

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur"
            >
              <div
                className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
                aria-hidden="true"
              />

              <div className="p-6">
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700">
                    第 {index + 1} 題
                  </span>

                  {item.grade && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      {item.grade}
                    </span>
                  )}

                  <span className="rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-700">
                    {item.subject}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                    {item.unit}
                  </span>

                  {item.knowledge_point && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                      {item.knowledge_point}
                    </span>
                  )}

                  <span
                    className={`rounded-full px-3 py-1 font-bold ${wrongCountStyle}`}
                  >
                    錯誤 {item.wrong_count} 次
                  </span>
                </div>

                <p className="whitespace-pre-wrap text-lg font-bold leading-8 text-slate-900">
                  {item.question_text}
                </p>

                <div className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-sm font-bold text-red-700">
                        你的答案
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {item.student_answer || "未作答"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-sm font-bold text-emerald-700">
                        正確答案
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {item.answer}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/80 p-4">
                    <p className="text-sm font-bold text-slate-800">詳解</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {item.explanation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTutorHint(item)}
                    disabled={loadingHintItemId !== null}
                    className="mt-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300"
                  >
                    {isLoadingHint ? "AI 思考中..." : "請 AI 教我"}
                  </button>

                  {tutorHint && (
                    <div className="mt-4 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
                      <p className="mb-2 font-black text-indigo-800">
                        🤖 AI 家教提示
                      </p>

                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {tutorHint}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}