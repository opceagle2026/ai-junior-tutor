"use client";

import Link from "next/link";
import { useState } from "react";
import {
  fetchWrongAnswersForReview,
  updateWrongAnswerAfterReview,
  type WrongAnswerItem,
} from "@/lib/wrongAnswers";

type AnswerMap = Record<string, string>;
type ResultMap = Record<
  string,
  {
    isCorrect: boolean;
    nextWrongCount: number;
  }
>;

export default function WrongReviewPage() {
  const [items, setItems] = useState<WrongAnswerItem[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<ResultMap>({});
  const [reviewCount, setReviewCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  function normalizeAnswer(value: string) {
    return value.trim().toLowerCase();
  }

  function isCorrect(item: WrongAnswerItem) {
    const studentAnswer = answers[item.id] ?? "";
    return normalizeAnswer(studentAnswer) === normalizeAnswer(item.answer);
  }

  async function handleStartReview() {
    setIsLoading(true);
    setMessage("");
    setIsSubmitted(false);
    setAnswers({});
    setResults({});

    try {
      const data = await fetchWrongAnswersForReview(reviewCount);
      setItems(data);

      if (data.length === 0) {
        setMessage("目前沒有需要複習的錯題。");
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
            從錯題庫抽題重新練習。答對會降低錯誤次數，答錯會增加錯誤次數。
          </p>

          <div className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium">複習題數</label>

              <input
                type="number"
                min={1}
                max={20}
                value={reviewCount}
                onChange={(event) => setReviewCount(Number(event.target.value))}
                className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>

            <button
              onClick={handleStartReview}
              disabled={isLoading || isSubmittingAnswers}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {isLoading ? "載入中..." : "開始錯題複習"}
            </button>

            {items.length > 0 && !isSubmitted && (
              <button
                onClick={handleSubmitAnswers}
                disabled={isSubmittingAnswers}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300"
              >
                {isSubmittingAnswers ? "批改中..." : "交卷批改"}
              </button>
            )}

            <Link
              href="/wrong-answers"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-100"
            >
              查看錯題庫
            </Link>
          </div>

          {message && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              {message}
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

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                      第 {index + 1} 題
                    </span>

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