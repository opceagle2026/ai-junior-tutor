"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchQuestions, type QuestionItem } from "@/lib/questions";
import { fetchSources } from "@/lib/sources";
import type { SourceItem } from "@/types/sources";

export default function QuestionsPage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [message, setMessage] = useState("");

  async function loadQuestions() {
    setIsLoadingQuestions(true);

    try {
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "載入題庫失敗");
    } finally {
      setIsLoadingQuestions(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSources();

        const completedSources = data.filter(
          (item) => item.status === "completed"
        );

        setSources(completedSources);

        if (completedSources.length > 0) {
          setSelectedSourceId(completedSources[0].id);
        }

        await loadQuestions();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "載入資料失敗");
      }
    }

    void load();
  }, []);

  async function handleGenerate() {
    if (!selectedSourceId) return;

    setIsGenerating(true);
    setMessage("");

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceId: selectedSourceId,
          count: questionCount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "產生題目失敗");
      }

      setMessage(`成功建立 ${result.count} 題`);
      await loadQuestions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "產生題目失敗");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center text-sm font-medium text-blue-700 transition hover:text-blue-800"
          >
            ← 返回首頁
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight">題庫管理</h1>

          <p className="mt-2 text-base leading-7 text-slate-600">
            從 AI 已分析完成的教材，自動建立題庫，並檢視題目、答案與詳解。
          </p>

          <div className="mt-8 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium">選擇教材</label>

              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {sources.length === 0 ? (
                  <option value="">尚無已分析教材</option>
                ) : (
                  sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title}｜{source.subject}｜{source.unit}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">題數</label>

              <input
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                disabled={!selectedSourceId || isGenerating}
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                {isGenerating ? "AI 出題中..." : "產生題目"}
              </button>

              <button
                onClick={loadQuestions}
                disabled={isLoadingQuestions}
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:bg-slate-100"
              >
                重新整理題庫
              </button>
            </div>

            {message && (
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                {message}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">已建立題目</h2>
              <p className="mt-1 text-sm text-slate-500">
                目前共 {questions.length} 題
              </p>
            </div>
          </div>

          {isLoadingQuestions ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
              載入題庫中...
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
              尚未建立題目。
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <article
                  key={question.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                      #{questions.length - index}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      {question.subject}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      {question.grade}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      {question.unit}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                      {question.question_type}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      {question.difficulty}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-base font-medium leading-7 text-slate-900">
                    {question.question_text}
                  </p>

                  {Array.isArray(question.options) && question.options.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {question.options.map((option, optionIndex) => (
                        <li
                          key={`${question.id}-${optionIndex}`}
                          className="rounded-lg bg-slate-50 px-3 py-2"
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-slate-700">答案</p>
                      <p className="mt-1 whitespace-pre-wrap text-slate-600">
                        {question.answer}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-700">詳解</p>
                      <p className="mt-1 whitespace-pre-wrap text-slate-600">
                        {question.explanation}
                      </p>
                    </div>
                  </div>

                  {question.knowledge_point && (
                    <p className="mt-3 text-xs text-slate-500">
                      知識點：{question.knowledge_point}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}