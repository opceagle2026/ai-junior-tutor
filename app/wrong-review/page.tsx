"use client";

import Link from "next/link";
import { useState } from "react";
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

export default function WrongReviewPage() {
  const [items, setItems] = useState<WrongAnswerItem[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<ResultMap>({});
  const [reviewCount, setReviewCount] = useState(5);

  const [subjectFilter, setSubjectFilter] =
    useState<SubjectFilter>("全部科目");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("全部年級");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");

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
      setMessage(error instanceof Error ? error.message : "載入錯題複習失敗");
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

      const correctCount = Object.values(nextResults).filter(
        (result) => result.isCorrect,
      ).length;

      setMessage(
        `複習完成：答對 ${correctCount} 題，共 ${items.length} 題。答對的錯誤次數已下降，答錯的錯誤次數已增加。`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新錯題複習結果失敗");
    } finally {
      setIsSubmittingAnswers(false);
    }
  }

  const correctCount = items.filter(isCorrect).length;

  const score =
    items.length > 0 ? Math.round((correctCount / items.length) * 100) : 0;

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

          <h1 className="text-3xl font-semibold tracking-tight">錯題複習</h1>

          <p className="mt-2 text-base leading-7 text-slate-600">
            依科目與年級從錯題庫抽題重新練習。答對會降低錯誤次數，答錯會增加錯誤次數。
          </p>

          <div className="mt-8 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-5 sm:items-end">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">科目</span>
              <select
                value={subjectFilter}
                onChange={(event) =>
                  setSubjectFilter(event.target.value as SubjectFilter)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {SUBJECT_FILTERS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">年級</span>
              <select
                value={gradeFilter}
                onChange={(event) =>
                  setGradeFilter(event.target.value as GradeFilter)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {GRADE_FILTERS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">複習題數</span>
              <input
                type="number"
                min={1}
                max={20}
                value={reviewCount}
                onChange={(event) => setReviewCount(Number(event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </label>

            <button
              type="button"
              onClick={handleStartReview}
              disabled={isLoading || isSubmittingAnswers}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {isLoading ? "載入中..." : "開始錯題複習"}
            </button>

            <Link
              href="/wrong-answers"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center font-medium text-slate-700 hover:bg-slate-100"
            >
              查看錯題庫
            </Link>

            {items.length > 0 && !isSubmitted && (
              <button
                type="button"
                onClick={handleSubmitAnswers}
                disabled={isSubmittingAnswers}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300 sm:col-span-5"
              >
                {isSubmittingAnswers ? "批改中..." : "交卷批改"}
              </button>
            )}
          </div>

          {message && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              {message}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                本次複習：{items.length} 題
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                {subjectFilter}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                {gradeFilter}
              </span>
            </div>
          )}

          {isSubmitted && items.length > 0 && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-lg font-semibold text-emerald-800">
                得分：{score} 分
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                答對 {correctCount} 題，共 {items.length} 題
              </p>
            </div>
          )}
        </section>

        {items.length > 0 && (
          <section className="space-y-4">
            {items.map((item, index) => {
              const studentAnswer = answers[item.id] ?? "";
              const result = results[item.id];
              const hasOptions =
                Array.isArray(item.options) && item.options.length > 0;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap gap-2 text-xs">
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
                      原錯誤 {item.wrong_count} 次
                    </span>

                    {result && (
                      <span
                        className={`rounded-full px-3 py-1 ${
                          result.isCorrect
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        複習後錯誤 {result.nextWrongCount} 次
                      </span>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap text-base font-medium leading-7">
                    {item.question_text}
                  </p>

                  {hasOptions && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">你的答案</p>

                      {item.options?.map((option, optionIndex) => (
                        <label
                          key={`${item.id}-${optionIndex}`}
                          className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
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

                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {!hasOptions && (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium">
                        你的答案
                      </label>

                      <input
                        value={studentAnswer}
                        disabled={isSubmitted || isSubmittingAnswers}
                        onChange={(event) =>
                          handleAnswerChange(item.id, event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                  )}

                  {isSubmitted && result && (
                    <div
                      className={`mt-5 rounded-xl border p-4 ${
                        result.isCorrect
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <p className="font-semibold">
                        {result.isCorrect
                          ? "答對了，錯誤次數已下降"
                          : "答錯了，錯誤次數已增加"}
                      </p>

                      <p className="mt-2">
                        你的答案：{studentAnswer || "未作答"}
                      </p>

                      <p className="mt-1">正確答案：{item.answer}</p>

                      <p className="mt-3 whitespace-pre-wrap">
                        詳解：{item.explanation}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}