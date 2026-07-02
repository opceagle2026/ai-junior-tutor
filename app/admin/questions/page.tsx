"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchQuestions, type QuestionItem } from "@/lib/questions";
import { fetchSources } from "@/lib/sources";
import type { SourceItem } from "@/types/sources";
import { SUPPORTED_SUBJECTS } from "@/types/subjects";

const SUBJECT_FILTERS = ["全部科目", ...SUPPORTED_SUBJECTS] as const;
const GRADE_FILTERS = ["全部年級", "國一", "國二", "國三"] as const;

type SubjectFilter = (typeof SUBJECT_FILTERS)[number];
type GradeFilter = (typeof GRADE_FILTERS)[number];

function normalizeQuestionCount(value: number) {
  if (Number.isNaN(value) || value < 1) {
    return 1;
  }

  if (value > 30) {
    return 30;
  }

  return Math.floor(value);
}

function getQuestionTypeStyle(questionType: string) {
  if (questionType === "選擇題") {
    return "bg-blue-100 text-blue-700";
  }

  if (questionType === "填充題") {
    return "bg-violet-100 text-violet-700";
  }

  if (questionType === "計算題") {
    return "bg-amber-100 text-amber-700";
  }

  if (questionType === "簡答題") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function QuestionsPage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [message, setMessage] = useState("");

  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null,
  );

  const [subjectFilter, setSubjectFilter] =
    useState<SubjectFilter>("全部科目");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("全部年級");

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSubject =
        subjectFilter === "全部科目" || question.subject === subjectFilter;

      const matchesGrade =
        gradeFilter === "全部年級" || question.grade === gradeFilter;

      return matchesSubject && matchesGrade;
    });
  }, [questions, subjectFilter, gradeFilter]);

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
          (item) => item.status === "completed",
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

  async function handleDeleteQuestion(question: QuestionItem) {
    if (deletingQuestionId !== null || isGenerating || isLoadingQuestions) {
      return;
    }

    const confirmed = window.confirm(
      `確定要刪除這一題嗎？\n\n題目：${question.question_text.slice(
        0,
        80,
      )}${question.question_text.length > 80 ? "..." : ""}\n\n這會一起刪除該題的錯題紀錄，且無法復原。`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingQuestionId(question.id);
    setMessage("");

    try {
      const response = await fetch("/api/delete-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: question.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "刪除題目失敗");
      }

      setQuestions((prev) =>
        prev.filter((item) => item.id !== question.id),
      );

      setMessage("已刪除題目與相關錯題紀錄。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "刪除題目失敗");
    } finally {
      setDeletingQuestionId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-sky-50 px-6 py-10 text-slate-900 sm:py-16">
      <div
        className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-sky-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-8rem] top-32 h-96 w-96 rounded-full bg-violet-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
            >
              ← 返回首頁
            </Link>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/sources"
                className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                教材管理
              </Link>

              <Link
                href="/admin/ai-analysis"
                className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
              >
                AI 分析狀態 →
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
                <span aria-hidden="true">📝</span>
                後台題庫管理
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                管理 AI 產生的題目
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                從 AI 已分析完成的教材自動建立題庫，並依科目與年級檢視、篩選與刪除題目。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-blue-600 to-indigo-700 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                目前題庫
              </p>
              <p className="mt-2 text-4xl font-black">
                {questions.length}
                <span className="ml-1 text-lg font-bold text-white/80">
                  題
                </span>
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                目前顯示 {filteredQuestions.length} 題；已分析教材 {sources.length} 份。
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-sm leading-6 text-blue-800 shadow-sm backdrop-blur">
            {message}
          </div>
        )}

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-sm backdrop-blur">
          <div
            className="h-2 bg-gradient-to-r from-violet-500 via-blue-500 to-sky-500"
            aria-hidden="true"
          />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                <span aria-hidden="true">🤖</span>
                AI 出題
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                從已分析教材建立題目
              </h2>

              <p className="text-sm leading-6 text-slate-600">
                選擇已完成 AI 分析的教材，系統會依內容自動建立題目。單次最多產生 30 題。
              </p>
            </div>

            <div className="mt-5 grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-700">
                  選擇教材
                </span>

                <select
                  value={selectedSourceId}
                  onChange={(event) => setSelectedSourceId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                >
                  {sources.length === 0 ? (
                    <option value="">尚無已分析教材</option>
                  ) : (
                    sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.title}｜{source.grade}｜{source.subject}｜
                        {source.unit}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-end">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    題數
                  </span>

                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={questionCount}
                    onChange={(event) =>
                      setQuestionCount(
                        normalizeQuestionCount(Number(event.target.value)),
                      )
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!selectedSourceId || isGenerating}
                    className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300"
                  >
                    {isGenerating ? "AI 出題中..." : "產生題目"}
                  </button>

                  <button
                    type="button"
                    onClick={loadQuestions}
                    disabled={isLoadingQuestions || deletingQuestionId !== null}
                    className="rounded-full border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    重新整理題庫
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <div
            className="h-2 bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700"
            aria-hidden="true"
          />

          <div className="p-6 sm:p-8">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">題目列表</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                  已建立題目
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  目前顯示 {filteredQuestions.length} / 全部 {questions.length} 題
                </p>
              </div>
            </div>

            {questions.length > 0 && (
              <div className="mb-5 grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    科目
                  </span>
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
                  <span className="text-sm font-bold text-slate-700">
                    年級
                  </span>
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
            )}

            {isLoadingQuestions ? (
              <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 text-slate-500">
                載入題庫中...
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 text-slate-500">
                尚未建立題目。請先從已分析完成的教材產生題目。
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 text-slate-500">
                目前沒有符合篩選條件的題目。
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => {
                  const isDeleting = deletingQuestionId === question.id;
                  const questionTypeStyle = getQuestionTypeStyle(
                    question.question_type,
                  );

                  return (
                    <article
                      key={question.id}
                      className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/80 shadow-sm"
                    >
                      <div
                        className="h-1.5 bg-gradient-to-r from-blue-500 via-violet-500 to-sky-500"
                        aria-hidden="true"
                      />

                      <div className="p-5">
                        <div className="mb-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700">
                            #{filteredQuestions.length - index}
                          </span>
                          <span className="rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-700">
                            {question.subject}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                            {question.grade}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                            {question.unit}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 font-bold ${questionTypeStyle}`}
                          >
                            {question.question_type}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                            {question.difficulty}
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap text-base font-bold leading-7 text-slate-900">
                          {question.question_text}
                        </p>

                        {Array.isArray(question.options) &&
                          question.options.length > 0 && (
                            <ul className="mt-4 space-y-2 text-sm text-slate-700">
                              {question.options.map((option, optionIndex) => (
                                <li
                                  key={`${question.id}-${optionIndex}`}
                                  className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}

                        <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="font-black text-emerald-700">答案</p>
                            <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">
                              {question.answer}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="font-black text-slate-700">詳解</p>
                            <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">
                              {question.explanation}
                            </p>
                          </div>
                        </div>

                        {question.knowledge_point && (
                          <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-medium leading-5 text-slate-500 shadow-sm">
                            知識點：{question.knowledge_point}
                          </p>
                        )}

                        <div className="mt-4 border-t border-slate-200 pt-4">
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(question)}
                            disabled={
                              isDeleting ||
                              deletingQuestionId !== null ||
                              isGenerating ||
                              isLoadingQuestions
                            }
                            className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                          >
                            {isDeleting ? "刪除中…" : "刪除題目"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}