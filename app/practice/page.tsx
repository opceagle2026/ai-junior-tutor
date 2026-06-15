"use client";

import Link from "next/link";
import { useState } from "react";
import { fetchPracticeQuestions } from "@/lib/practice";
import type { QuestionItem } from "@/lib/questions";
import { saveWrongAnswer } from "@/lib/wrongAnswers";

type AnswerMap = Record<string, string>;

export default function PracticePage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [wrongSavedCount, setWrongSavedCount] = useState(0);

  async function handleStartPractice() {
    setIsLoading(true);
    setMessage("");
    setIsSubmitted(false);
    setWrongSavedCount(0);
    setAnswers({});

    try {
      const data = await fetchPracticeQuestions(questionCount);
      setQuestions(data);

      if (data.length === 0) {
        setMessage("目前題庫沒有題目，請先到題庫管理產生題目。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "載入測驗題目失敗");
    } finally {
      setIsLoading(false);
    }
  }

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  function normalizeAnswer(value: string) {
    return value.trim().toLowerCase();
  }

  function isCorrect(question: QuestionItem) {
    const studentAnswer = answers[question.id] ?? "";
    return normalizeAnswer(studentAnswer) === normalizeAnswer(question.answer);
  }

  async function handleSubmitAnswers() {
    setIsSubmittingAnswers(true);
    setMessage("");

    try {
      const wrongQuestions = questions.filter((question) => !isCorrect(question));

      await Promise.all(
        wrongQuestions.map((question) =>
          saveWrongAnswer({
            questionId: question.id,
            questionText: question.question_text,
            answer: question.answer,
            studentAnswer: answers[question.id] ?? "",
            explanation: question.explanation,
            subject: question.subject,
            unit: question.unit,
            knowledgePoint: question.knowledge_point ?? "",
          }),
        ),
      );

      setWrongSavedCount(wrongQuestions.length);
      setIsSubmitted(true);

      if (wrongQuestions.length > 0) {
        setMessage(`已將 ${wrongQuestions.length} 題加入錯題庫。`);
      } else {
        setMessage("全部答對，這次沒有新增錯題。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "儲存錯題失敗");
    } finally {
      setIsSubmittingAnswers(false);
    }
  }

  const correctCount = questions.filter(isCorrect).length;

  const score =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

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

          <h1 className="text-3xl font-semibold tracking-tight">線上測驗</h1>

          <p className="mt-2 text-base leading-7 text-slate-600">
            從題庫抽題進行練習，作答後系統會立即批改、顯示詳解，並將錯題自動加入錯題庫。
          </p>

          <div className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium">題數</label>

              <input
                type="number"
                min={1}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>

            <button
              onClick={handleStartPractice}
              disabled={isLoading || isSubmittingAnswers}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {isLoading ? "載入中..." : "開始測驗"}
            </button>

            {questions.length > 0 && !isSubmitted && (
              <button
                onClick={handleSubmitAnswers}
                disabled={isSubmittingAnswers}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300"
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

          {isSubmitted && questions.length > 0 && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-lg font-semibold text-emerald-800">
                得分：{score} 分
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                答對 {correctCount} 題，共 {questions.length} 題
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                已儲存錯題：{wrongSavedCount} 題
              </p>

              {wrongSavedCount > 0 && (
                <Link
                  href="/wrong-answers"
                  className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  查看錯題庫
                </Link>
              )}
            </div>
          )}
        </section>

        {questions.length > 0 && (
          <section className="space-y-4">
            {questions.map((question, index) => {
              const studentAnswer = answers[question.id] ?? "";
              const correct = isCorrect(question);

              return (
                <article
                  key={question.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                      第 {index + 1} 題
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {question.subject}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {question.unit}
                    </span>

                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                      {question.question_type}
                    </span>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      {question.difficulty}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-base font-medium leading-7">
                    {question.question_text}
                  </p>

                  {Array.isArray(question.options) &&
                    question.options.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label
                            key={`${question.id}-${optionIndex}`}
                            className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              checked={studentAnswer === option}
                              disabled={isSubmitted || isSubmittingAnswers}
                              onChange={(e) =>
                                handleAnswerChange(question.id, e.target.value)
                              }
                            />

                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                  {(!Array.isArray(question.options) ||
                    question.options.length === 0) && (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium">
                        你的答案
                      </label>
                      <input
                        value={studentAnswer}
                        disabled={isSubmitted || isSubmittingAnswers}
                        onChange={(e) =>
                          handleAnswerChange(question.id, e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                  )}

                  {isSubmitted && (
                    <div
                      className={`mt-5 rounded-xl border p-4 ${
                        correct
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <p className="font-semibold">
                        {correct ? "答對了" : "答錯了，已加入錯題庫"}
                      </p>

                      <p className="mt-2">
                        你的答案：{studentAnswer || "未作答"}
                      </p>

                      <p className="mt-1">正確答案：{question.answer}</p>

                      <p className="mt-3 whitespace-pre-wrap">
                        詳解：{question.explanation}
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