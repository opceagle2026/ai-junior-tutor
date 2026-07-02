"use client";

import Link from "next/link";
import { useState } from "react";
import {
  fetchPracticeQuestions,
  type QuestionTypeCounts,
} from "@/lib/practice";
import type { QuestionItem } from "@/lib/questions";
import { saveWrongAnswer } from "@/lib/wrongAnswers";
import { SUPPORTED_SUBJECTS } from "@/types/subjects";

type AnswerMap = Record<string, string>;
type TutorHintMap = Record<string, string>;

const SUBJECT_FILTERS = ["全部科目", ...SUPPORTED_SUBJECTS] as const;
const GRADE_FILTERS = ["全部年級", "國一", "國二", "國三"] as const;

const ALL_QUESTION_TYPES = ["選擇題", "填充題", "計算題", "簡答題"] as const;

const SUBJECT_QUESTION_TYPES: Record<
  string,
  (typeof ALL_QUESTION_TYPES)[number][]
> = {
  全部科目: ["選擇題", "填充題", "計算題", "簡答題"],
  國語文: ["選擇題", "填充題", "簡答題"],
  英語文: ["選擇題", "填充題", "簡答題"],
  數學: ["選擇題", "填充題", "計算題", "簡答題"],
  歷史: ["選擇題", "填充題", "簡答題"],
  地理: ["選擇題", "填充題", "簡答題"],
  公民與社會: ["選擇題", "填充題", "簡答題"],
  生物: ["選擇題", "填充題", "簡答題"],
  理化: ["選擇題", "填充題", "計算題", "簡答題"],
  地球科學: ["選擇題", "填充題", "簡答題"],
};

const QUESTION_TYPE_STYLES: Record<
  QuestionType,
  {
    icon: string;
    pill: string;
    card: string;
  }
> = {
  選擇題: {
    icon: "✅",
    pill: "bg-blue-100 text-blue-700",
    card: "from-blue-500 to-sky-500",
  },
  填充題: {
    icon: "✍️",
    pill: "bg-violet-100 text-violet-700",
    card: "from-violet-500 to-purple-500",
  },
  計算題: {
    icon: "🧮",
    pill: "bg-amber-100 text-amber-700",
    card: "from-amber-500 to-orange-500",
  },
  簡答題: {
    icon: "💬",
    pill: "bg-emerald-100 text-emerald-700",
    card: "from-emerald-500 to-teal-500",
  },
};

type SubjectFilter = (typeof SUBJECT_FILTERS)[number];
type GradeFilter = (typeof GRADE_FILTERS)[number];
type QuestionType = (typeof ALL_QUESTION_TYPES)[number];

function getAllowedQuestionTypes(subject: string) {
  return SUBJECT_QUESTION_TYPES[subject] ?? SUBJECT_QUESTION_TYPES.全部科目;
}

function isQuestionTypeAllowed(
  subject: string,
  questionType: keyof QuestionTypeCounts,
) {
  return getAllowedQuestionTypes(subject).includes(questionType);
}

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

function normalizeCount(value: number) {
  if (Number.isNaN(value) || value < 0) {
    return 0;
  }

  if (value > 20) {
    return 20;
  }

  return Math.floor(value);
}

function getTotalQuestionCount(counts: QuestionTypeCounts) {
  return (
    counts.選擇題 +
    counts.填充題 +
    counts.計算題 +
    counts.簡答題
  );
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

const initialQuestionTypeCounts: QuestionTypeCounts = {
  選擇題: 5,
  填充題: 0,
  計算題: 0,
  簡答題: 0,
};

export default function PracticePage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [questionTypeCounts, setQuestionTypeCounts] =
    useState<QuestionTypeCounts>(initialQuestionTypeCounts);

  const [subjectFilter, setSubjectFilter] =
    useState<SubjectFilter>("全部科目");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("全部年級");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [wrongSavedCount, setWrongSavedCount] = useState(0);

  const [tutorHints, setTutorHints] = useState<TutorHintMap>({});
  const [loadingHintQuestionId, setLoadingHintQuestionId] = useState<
    string | null
  >(null);

  const allowedQuestionTypes = getAllowedQuestionTypes(subjectFilter);
  const selectedTotalQuestionCount = getTotalQuestionCount(questionTypeCounts);

  function handleSubjectFilterChange(value: SubjectFilter) {
    setSubjectFilter(value);
    setQuestions([]);
    setAnswers({});
    setTutorHints({});
    setIsSubmitted(false);
    setWrongSavedCount(0);
    setMessage("");

    setQuestionTypeCounts((prev) => {
      const nextCounts = { ...prev };

      ALL_QUESTION_TYPES.forEach((questionType) => {
        if (!isQuestionTypeAllowed(value, questionType)) {
          nextCounts[questionType] = 0;
        }
      });

      return nextCounts;
    });
  }

  function handleQuestionTypeCountChange(
    questionType: keyof QuestionTypeCounts,
    value: number,
  ) {
    setQuestionTypeCounts((prev) => ({
      ...prev,
      [questionType]: normalizeCount(value),
    }));
  }

  async function handleStartPractice() {
    if (selectedTotalQuestionCount === 0) {
      setMessage("請至少選擇 1 題。");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsSubmitted(false);
    setWrongSavedCount(0);
    setAnswers({});
    setTutorHints({});
    setLoadingHintQuestionId(null);

    try {
      const data = await fetchPracticeQuestions({
        subject: subjectFilter,
        grade: gradeFilter,
        questionTypeCounts,
      });

      setQuestions(data);

      if (data.length === 0) {
        setMessage("目前沒有符合科目、年級與題型條件的題目，請先到題庫管理產生題目。");
      } else if (data.length < selectedTotalQuestionCount) {
        setMessage(
          `題庫符合條件的題目不足，原本選擇 ${selectedTotalQuestionCount} 題，本次實際抽出 ${data.length} 題。`,
        );
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

  function isCorrect(question: QuestionItem) {
    const studentAnswer = answers[question.id] ?? "";
    return isSameAnswer(studentAnswer, question.answer);
  }

  async function handleSubmitAnswers() {
    setIsSubmittingAnswers(true);
    setMessage("");

    try {
      const wrongQuestions = questions.filter(
        (question) => !isCorrect(question),
      );

      await Promise.all(
        wrongQuestions.map((question) =>
          saveWrongAnswer({
            questionId: question.id,
            questionText: question.question_text,
            options: question.options,
            answer: question.answer,
            studentAnswer: answers[question.id] ?? "",
            explanation: question.explanation,
            subject: question.subject,
            grade: question.grade,
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

  async function handleTutorHint(question: QuestionItem) {
    if (loadingHintQuestionId !== null) return;

    setLoadingHintQuestionId(question.id);
    setMessage("");

    try {
      const response = await fetch("/api/tutor-hint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grade: question.grade,
          subject: question.subject,
          unit: question.unit,
          knowledgePoint: question.knowledge_point,
          questionText: question.question_text,
          options: question.options,
          answer: question.answer,
          explanation: question.explanation,
          studentAnswer: answers[question.id] ?? "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI 家教提示產生失敗");
      }

      setTutorHints((prev) => ({
        ...prev,
        [question.id]: result.hint || "AI 沒有產生提示內容。",
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 家教提示產生失敗");
    } finally {
      setLoadingHintQuestionId(null);
    }
  }

  const correctCount = questions.filter(isCorrect).length;

  const score =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

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
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                <span aria-hidden="true">✏️</span>
                線上測驗
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                今天先練一小組題目
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                依科目、年級與題型從題庫抽題練習。作答後系統會立即批改，答錯的題目會自動加入個人錯題庫。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-violet-600 to-pink-500 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                本次任務
              </p>
              <p className="mt-2 text-4xl font-black">
                {selectedTotalQuestionCount}
                <span className="ml-1 text-lg font-bold text-white/80">
                  題
                </span>
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                不用一次寫很多，先從一組題目開始。答錯沒關係，錯題庫會幫你留下來複習。
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-700">科目</span>
                <select
                  value={subjectFilter}
                  onChange={(event) =>
                    handleSubjectFilterChange(
                      event.target.value as SubjectFilter,
                    )
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

              <label className="flex flex-col gap-2">
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
            </div>

            <div className="rounded-3xl bg-slate-50/80 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-800">
                  各題型題數
                </p>
                <p className="text-xs leading-5 text-slate-500">
                  題型會依科目特性顯示；填 0 表示不抽該題型。
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {ALL_QUESTION_TYPES.map((questionType) => {
                  const allowed = allowedQuestionTypes.includes(questionType);
                  const style = QUESTION_TYPE_STYLES[questionType];

                  if (!allowed) {
                    return null;
                  }

                  return (
                    <label
                      key={questionType}
                      className="rounded-2xl border border-white bg-white p-4 shadow-sm"
                    >
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${style.pill}`}
                      >
                        <span aria-hidden="true">{style.icon}</span>
                        {questionType}
                      </span>

                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={questionTypeCounts[questionType]}
                        onChange={(event) =>
                          handleQuestionTypeCountChange(
                            questionType,
                            Number(event.target.value),
                          )
                        }
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700">
                  預計抽題：{selectedTotalQuestionCount} 題
                </span>

                {ALL_QUESTION_TYPES.map((questionType) => {
                  if (!allowedQuestionTypes.includes(questionType)) {
                    return null;
                  }

                  return (
                    <span
                      key={questionType}
                      className={`rounded-full px-3 py-1 font-medium ${
                        QUESTION_TYPE_STYLES[questionType].pill
                      }`}
                    >
                      {questionType} {questionTypeCounts[questionType]}
                    </span>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleStartPractice}
                disabled={
                  isLoading ||
                  isSubmittingAnswers ||
                  selectedTotalQuestionCount === 0
                }
                className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300"
              >
                {isLoading ? "載入中..." : "開始測驗"}
              </button>
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-white/90 p-4 text-sm leading-6 text-slate-700 shadow-sm">
              {message}
            </div>
          )}

          {questions.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700">
                本次測驗：{questions.length} 題
              </span>

              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
                {subjectFilter}
              </span>

              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
                {gradeFilter}
              </span>

              {ALL_QUESTION_TYPES.map((questionType) => {
                if (!allowedQuestionTypes.includes(questionType)) {
                  return null;
                }

                return (
                  <span
                    key={questionType}
                    className={`rounded-full px-3 py-1 font-medium ${
                      QUESTION_TYPE_STYLES[questionType].pill
                    }`}
                  >
                    {questionType}{" "}
                    {
                      questions.filter(
                        (question) => question.question_type === questionType,
                      ).length
                    }
                  </span>
                );
              })}
            </div>
          )}

          {isSubmitted && questions.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-white">
                <p className="text-sm font-bold text-white/80">測驗完成</p>
                <p className="mt-1 text-3xl font-black">得分：{score} 分</p>
              </div>

              <div className="p-5">
                <p className="text-sm font-medium text-emerald-700">
                  答對 {correctCount} 題，共 {questions.length} 題
                </p>

                <p className="mt-1 text-sm font-medium text-emerald-700">
                  已儲存錯題：{wrongSavedCount} 題
                </p>

                {wrongSavedCount > 0 && (
                  <Link
                    href="/wrong-answers"
                    className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    查看錯題庫 →
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>

        {questions.length > 0 && (
          <section className="space-y-5">
            {questions.map((question, index) => {
              const studentAnswer = answers[question.id] ?? "";
              const correct = isCorrect(question);
              const tutorHint = tutorHints[question.id];
              const isLoadingHint = loadingHintQuestionId === question.id;
              const questionStyle =
                QUESTION_TYPE_STYLES[
                  question.question_type as QuestionType
                ] ?? QUESTION_TYPE_STYLES.選擇題;

              return (
                <article
                  key={question.id}
                  className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur"
                >
                  <div
                    className={`h-2 bg-gradient-to-r ${questionStyle.card}`}
                    aria-hidden="true"
                  />

                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700">
                        第 {index + 1} 題
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        {question.grade}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        {question.subject}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        {question.unit}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 font-bold ${questionStyle.pill}`}
                      >
                        {questionStyle.icon} {question.question_type}
                      </span>

                      <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                        {question.difficulty}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-lg font-bold leading-8 text-slate-900">
                      {question.question_text}
                    </p>

                    {Array.isArray(question.options) &&
                      question.options.length > 0 && (
                        <div className="mt-5 space-y-3">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={`${question.id}-${optionIndex}`}
                              className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-3 transition ${
                                studentAnswer === option
                                  ? "border-blue-300 bg-blue-50 ring-4 ring-blue-100"
                                  : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/60"
                              }`}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                value={option}
                                checked={studentAnswer === option}
                                disabled={isSubmitted || isSubmittingAnswers}
                                onChange={(event) =>
                                  handleAnswerChange(
                                    question.id,
                                    event.target.value,
                                  )
                                }
                              />

                              <span className="leading-6 text-slate-800">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                    {(!Array.isArray(question.options) ||
                      question.options.length === 0) && (
                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                          你的答案
                        </label>

                        <input
                          value={studentAnswer}
                          disabled={isSubmitted || isSubmittingAnswers}
                          onChange={(event) =>
                            handleAnswerChange(question.id, event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                          placeholder="把你的答案寫在這裡"
                        />
                      </div>
                    )}

                    {isSubmitted && (
                      <div
                        className={`mt-6 rounded-3xl border p-5 ${
                          correct
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <p
                          className={`text-lg font-black ${
                            correct ? "text-emerald-800" : "text-red-800"
                          }`}
                        >
                          {correct ? "🎉 答對了" : "🧩 答錯了，已加入錯題庫"}
                        </p>

                        {!correct && (
                          <>
                            <p className="mt-3 text-sm leading-6 text-red-800">
                              你的答案：{studentAnswer || "未作答"}
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-800">
                              正確答案：{question.answer}
                            </p>

                            <div className="mt-4 rounded-2xl bg-white/80 p-4">
                              <p className="text-sm font-bold text-slate-800">
                                詳解
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                {question.explanation}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTutorHint(question)}
                              disabled={loadingHintQuestionId !== null}
                              className="mt-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300"
                            >
                              {isLoadingHint
                                ? "AI 思考中..."
                                : "我不會，請提示"}
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
                      完成作答了嗎？
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