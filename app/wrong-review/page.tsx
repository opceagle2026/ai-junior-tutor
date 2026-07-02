"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchWrongAnswersForReview,
  updateWrongAnswerAfterReview,
  type WrongAnswerItem,
} from "@/lib/wrongAnswers";
import { SUPPORTED_SUBJECTS } from "@/types/subjects";

type AnswerMap = Record<string, string>;
type ResultMap = Record<
  string,
  {
    isCorrect: boolean;
    nextWrongCount: number;
  }
>;

const SUBJECT_FILTERS = ["全部科目", ...SUPPORTED_SUBJECTS] as const;
const GRADE_FILTERS = ["全部年級", "國一", "國二", "國三"] as const;

type SubjectFilter = (typeof SUBJECT_FILTERS)[number];
type GradeFilter = (typeof GRADE_FILTERS)[number];

function extractChoiceLetter(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^\(?([A-Da-d])\)?[.、\s：:]?/);

  return match?.[1]?.toUpperCase() ?? "";
}

function removeChoicePrefix(value: string) {
  return value
    .trim()
    .replace(/^\(?[A-Da-d]\)?[.、\s：:]?/, "")
    .trim()
    .toLowerCase();
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function isSameAnswer(studentAnswer: string, correctAnswer: string) {
  const student = studentAnswer.trim();
  const correct = correctAnswer.trim();

  if (!student || !correct) {
    return false;
  }

  const studentLetter = extractChoiceLetter(student);
  const correctLetter = extractChoiceLetter(correct);

  if (studentLetter && correctLetter) {
    return studentLetter === correctLetter;
  }

  if (studentLetter && /^[A-Da-d]$/.test(correct)) {
    return studentLetter === correct.toUpperCase();
  }

  if (correctLetter && /^[A-Da-d]$/.test(student)) {
    return student.toUpperCase() === correctLetter;
  }

  const studentWithoutPrefix = removeChoicePrefix(student);
  const correctWithoutPrefix = removeChoicePrefix(correct);

  if (
    studentWithoutPrefix &&
    correctWithoutPrefix &&
    studentWithoutPrefix === correctWithoutPrefix
  ) {
    return true;
  }

  return normalizeAnswer(student) === normalizeAnswer(correct);
}

function normalizeReviewCount(value: number) {
  if (Number.isNaN(value) || value < 1) {
    return 1;
  }

  if (value > 20) {
    return 20;
  }

  return Math.floor(value);
}

function getWrongCountStyle(count: number) {
  if (count >= 5) {
    return "bg-red-100 text-red-700";
  }

  if (count >= 3) {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-amber-100 text-amber-700";
}

export default function WrongReviewPage() {
  const [items, setItems] = useState<WrongAnswerItem[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<ResultMap>({});
  const [reviewCount, setReviewCount] = useState(5);

  const [subjectFilter, setSubjectFilter] =
    useState<SubjectFilter>("全部科目");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("全部年級");

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = "/login?redirectedFrom=/wrong-review";
        return;
      }

      setIsCheckingAuth(false);
    }

    void checkAuth();
  }, []);

  function isCorrect(item: WrongAnswerItem) {
    const studentAnswer = answers[item.id] ?? "";
    return isSameAnswer(studentAnswer, item.answer);
  }

  async function handleStartReview() {
    setIsLoading(true);
    setMessage("");
    setIsSubmitted(false);
    setAnswers({});
    setResults({});

    try {
      const data = await fetchWrongAnswersForReview({
        count: reviewCount,
        subject: subjectFilter,
        grade: gradeFilter,
      });

      setItems(data);

      if (data.length === 0) {
        setMessage("目前沒有符合科目與年級條件、需要複習的錯題。");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "載入錯題複習失敗";

      if (errorMessage.includes("請先登入")) {
        window.location.href = "/login?redirectedFrom=/wrong-review";
        return;
      }

      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAnswerChange(itemId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  }

  async function handleSubmitAnswers() {
    setIsSubmittingAnswers(true);
    setMessage("");

    try {
      const nextResults: ResultMap = {};

      await Promise.all(
        items.map(async (item) => {
          const correct = isCorrect(item);

          const nextWrongCount = await updateWrongAnswerAfterReview({
            wrongAnswerId: item.id,
            isCorrect: correct,
            studentAnswer: answers[item.id] ?? "",
            currentWrongCount: item.wrong_count,
          });

          nextResults[item.id] = {
            isCorrect: correct,
            nextWrongCount,
          };
        }),
      );

      setResults(nextResults);
      setIsSubmitted(true);

      const reviewedCorrectCount = Object.values(nextResults).filter(
        (result) => result.isCorrect,
      ).length;

      setMessage(
        `複習完成：答對 ${reviewedCorrectCount} 題，共 ${items.length} 題。答對的錯誤次數已下降，答錯的錯誤次數已增加。`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "更新錯題複習結果失敗";

      if (errorMessage.includes("請先登入")) {
        window.location.href = "/login?redirectedFrom=/wrong-review";
        return;
      }

      setMessage(errorMessage);
    } finally {
      setIsSubmittingAnswers(false);
    }
  }

  const correctCount = items.filter(isCorrect).length;

  const score =
    items.length > 0 ? Math.round((correctCount / items.length) * 100) : 0;

  if (isCheckingAuth) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-pink-50 px-6 py-10 text-slate-900 sm:py-16">
        <div
          className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-sky-300/30 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 text-slate-700 shadow-sm backdrop-blur">
            載入中...
          </div>
        </div>
      </main>
    );
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
              href="/wrong-answers"
              className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-amber-500 hover:to-orange-600"
            >
              查看錯題庫 →
            </Link>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                <span aria-hidden="true">🚀</span>
                錯題複習
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                把錯題再挑戰一次
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                從你的個人錯題庫抽題重新練習。答對會降低錯誤次數，答錯會增加錯誤次數，讓複習更有方向。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                本次複習
              </p>
              <p className="mt-2 text-4xl font-black">
                {reviewCount}
                <span className="ml-1 text-lg font-bold text-white/80">
                  題
                </span>
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                先練一小組就好。每答對一次，錯題就離你更遠一點。
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-sm sm:grid-cols-5 sm:items-end">
            <label className="flex flex-col gap-2 sm:col-span-1">
              <span className="text-sm font-bold text-slate-700">科目</span>
              <select
                value={subjectFilter}
                onChange={(event) =>
                  setSubjectFilter(event.target.value as SubjectFilter)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                {SUBJECT_FILTERS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 sm:col-span-1">
              <span className="text-sm font-bold text-slate-700">年級</span>
              <select
                value={gradeFilter}
                onChange={(event) =>
                  setGradeFilter(event.target.value as GradeFilter)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                {GRADE_FILTERS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 sm:col-span-1">
              <span className="text-sm font-bold text-slate-700">
                複習題數
              </span>
              <input
                type="number"
                min={1}
                max={20}
                value={reviewCount}
                onChange={(event) =>
                  setReviewCount(normalizeReviewCount(Number(event.target.value)))
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <button
              type="button"
              onClick={handleStartReview}
              disabled={isLoading || isSubmittingAnswers}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white shadow-sm hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-300 disabled:to-slate-300 sm:col-span-1"
            >
              {isLoading ? "載入中..." : "開始複習"}
            </button>

            <Link
              href="/wrong-answers"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center font-bold text-slate-700 shadow-sm hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 sm:col-span-1"
            >
              錯題庫
            </Link>
          </div>

          {message && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-white/90 p-4 text-sm leading-6 text-slate-700 shadow-sm">
              {message}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700">
                本次複習：{items.length} 題
              </span>

              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
                {subjectFilter}
              </span>

              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
                {gradeFilter}
              </span>
            </div>
          )}

          {isSubmitted && items.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-white">
                <p className="text-sm font-bold text-white/80">複習完成</p>
                <p className="mt-1 text-3xl font-black">得分：{score} 分</p>
              </div>

              <div className="p-5">
                <p className="text-sm font-medium text-emerald-700">
                  答對 {correctCount} 題，共 {items.length} 題
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  答對的題目錯誤次數會下降；答錯的題目會保留在錯題庫，之後可以再複習。
                </p>

                <Link
                  href="/wrong-answers"
                  className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  回錯題庫查看 →
                </Link>
              </div>
            </div>
          )}
        </section>

        {items.length > 0 && (
          <section className="space-y-5">
            {items.map((item, index) => {
              const studentAnswer = answers[item.id] ?? "";
              const result = results[item.id];
              const hasOptions =
                Array.isArray(item.options) && item.options.length > 0;
              const wrongCountStyle = getWrongCountStyle(item.wrong_count);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur"
                >
                  <div
                    className="h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"
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
                        原錯誤 {item.wrong_count} 次
                      </span>

                      {result && (
                        <span
                          className={`rounded-full px-3 py-1 font-bold ${
                            result.isCorrect
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          複習後錯誤 {result.nextWrongCount} 次
                        </span>
                      )}
                    </div>

                    <p className="whitespace-pre-wrap text-lg font-bold leading-8 text-slate-900">
                      {item.question_text}
                    </p>

                    {hasOptions && (
                      <div className="mt-5 space-y-3">
                        <p className="text-sm font-bold text-slate-700">
                          你的答案
                        </p>

                        {item.options?.map((option, optionIndex) => (
                          <label
                            key={`${item.id}-${optionIndex}`}
                            className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-3 transition ${
                              studentAnswer === option
                                ? "border-emerald-300 bg-emerald-50 ring-4 ring-emerald-100"
                                : "border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/60"
                            }`}
                          >
                            <input
                              type="radio"
                              name={item.id}
                              value={option}
                              checked={studentAnswer === option}
                              disabled={isSubmitted || isSubmittingAnswers}
                              onChange={(event) =>
                                handleAnswerChange(item.id, event.target.value)
                              }
                            />

                            <span className="leading-6 text-slate-800">
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {!hasOptions && (
                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                          你的答案
                        </label>

                        <input
                          value={studentAnswer}
                          disabled={isSubmitted || isSubmittingAnswers}
                          onChange={(event) =>
                            handleAnswerChange(item.id, event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                          placeholder="把你的答案寫在這裡"
                        />
                      </div>
                    )}

                    {isSubmitted && result && (
                      <div
                        className={`mt-6 rounded-3xl border p-5 ${
                          result.isCorrect
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <p
                          className={`text-lg font-black ${
                            result.isCorrect
                              ? "text-emerald-800"
                              : "text-red-800"
                          }`}
                        >
                          {result.isCorrect
                            ? "🎉 答對了，錯誤次數已下降"
                            : "🧩 答錯了，錯誤次數已增加"}
                        </p>

                        {!result.isCorrect && (
                          <>
                            <p className="mt-3 text-sm leading-6 text-red-800">
                              你的答案：{studentAnswer || "未作答"}
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-800">
                              正確答案：{item.answer}
                            </p>

                            <div className="mt-4 rounded-2xl bg-white/80 p-4">
                              <p className="text-sm font-bold text-slate-800">
                                詳解
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                {item.explanation}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {!isSubmitted && (
              <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xl font-black text-slate-900">
                      完成複習了嗎？
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      確認所有題目都已作答後，再送出批改。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitAnswers}
                    disabled={isSubmittingAnswers}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-bold text-white shadow-sm hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-300 disabled:to-slate-300"
                  >
                    {isSubmittingAnswers ? "批改中..." : "交卷批改"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}