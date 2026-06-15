"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type WrongAnswerItem = {
  id: string;
  question_text: string;
  answer: string;
  student_answer: string;
  explanation: string;
  subject: string;
  unit: string;
  knowledge_point: string;
  wrong_count: number;
};

type TopItem = {
  label: string;
  count: number;
};

function findTopByWrongCount(
  items: WrongAnswerItem[],
  key: "subject" | "unit" | "knowledge_point",
): TopItem {
  if (items.length === 0) {
    return {
      label: "-",
      count: 0,
    };
  }

  const counter: Record<string, number> = {};

  items.forEach((item) => {
    const label = item[key] || "未分類";
    counter[label] = (counter[label] || 0) + (item.wrong_count || 0);
  });

  const [label, count] =
    Object.entries(counter).sort((a, b) => b[1] - a[1])[0] ?? ["-", 0];

  return {
    label,
    count,
  };
}

function getPreviewText(text: string, maxLength = 80) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

export default function StatsPage() {
  const [sourceCount, setSourceCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [wrongAnswerCount, setWrongAnswerCount] = useState(0);
  const [activeWrongCount, setActiveWrongCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalWrongTimes, setTotalWrongTimes] = useState(0);

  const [topSubject, setTopSubject] = useState<TopItem>({
    label: "-",
    count: 0,
  });
  const [topUnit, setTopUnit] = useState<TopItem>({
    label: "-",
    count: 0,
  });
  const [topKnowledge, setTopKnowledge] = useState<TopItem>({
    label: "-",
    count: 0,
  });

  const [topWrongQuestions, setTopWrongQuestions] = useState<WrongAnswerItem[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setMessage("");

      try {
        const [{ count: sourceTotal }, { count: questionTotal }, wrongResult] =
          await Promise.all([
            supabase
              .from("sources")
              .select("*", { count: "exact", head: true }),

            supabase
              .from("questions")
              .select("*", { count: "exact", head: true }),

            supabase
              .from("wrong_answers")
              .select("*")
              .order("wrong_count", { ascending: false }),
          ]);

        setSourceCount(sourceTotal ?? 0);
        setQuestionCount(questionTotal ?? 0);

        if (wrongResult.error) {
          throw wrongResult.error;
        }

        const wrongAnswers = (wrongResult.data ?? []) as WrongAnswerItem[];

        const activeWrongAnswers = wrongAnswers.filter(
          (item) => (item.wrong_count || 0) > 0,
        );

        const masteredAnswers = wrongAnswers.filter(
          (item) => (item.wrong_count || 0) === 0,
        );

        const totalWrong = wrongAnswers.reduce(
          (sum, item) => sum + (item.wrong_count || 0),
          0,
        );

        setWrongAnswerCount(wrongAnswers.length);
        setActiveWrongCount(activeWrongAnswers.length);
        setMasteredCount(masteredAnswers.length);
        setTotalWrongTimes(totalWrong);

        setTopSubject(findTopByWrongCount(activeWrongAnswers, "subject"));
        setTopUnit(findTopByWrongCount(activeWrongAnswers, "unit"));
        setTopKnowledge(
          findTopByWrongCount(activeWrongAnswers, "knowledge_point"),
        );

        setTopWrongQuestions(activeWrongAnswers.slice(0, 5));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "載入學習統計失敗");
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
        <div className="mx-auto w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          載入中...
        </div>
      </main>
    );
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

          <h1 className="text-3xl font-semibold tracking-tight">學習統計</h1>

          <p className="mt-2 text-base leading-7 text-slate-600">
            查看目前教材、題庫、錯題狀況與需要優先加強的弱點。
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/wrong-answers"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              查看錯題庫
            </Link>

            <Link
              href="/wrong-review"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              開始錯題複習
            </Link>
          </div>
        </section>

        {message && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">教材數</p>
            <p className="mt-3 text-4xl font-bold">{sourceCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">題目數</p>
            <p className="mt-3 text-4xl font-bold">{questionCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">錯題紀錄數</p>
            <p className="mt-3 text-4xl font-bold text-red-600">
              {wrongAnswerCount}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">需要複習題數</p>
            <p className="mt-3 text-4xl font-bold text-amber-600">
              {activeWrongCount}
            </p>
            <p className="mt-2 text-sm text-slate-500">wrong_count 大於 0</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">已熟練題數</p>
            <p className="mt-3 text-4xl font-bold text-emerald-600">
              {masteredCount}
            </p>
            <p className="mt-2 text-sm text-slate-500">wrong_count 已降到 0</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">錯誤累計次數</p>
            <p className="mt-3 text-4xl font-bold text-red-600">
              {totalWrongTimes}
            </p>
            <p className="mt-2 text-sm text-slate-500">依 wrong_count 加總</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">最弱科目</p>
            <p className="mt-3 text-2xl font-bold">{topSubject.label}</p>
            <p className="mt-2 text-sm text-slate-500">
              累計錯誤 {topSubject.count} 次
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">最弱單元</p>
            <p className="mt-3 text-2xl font-bold">{topUnit.label}</p>
            <p className="mt-2 text-sm text-slate-500">
              累計錯誤 {topUnit.count} 次
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">最弱知識點</p>
            <p className="mt-3 text-2xl font-bold">{topKnowledge.label}</p>
            <p className="mt-2 text-sm text-slate-500">
              累計錯誤 {topKnowledge.count} 次
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">高錯誤次數題目 Top 5</h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            優先複習這些題目，通常可以最快改善弱點。
          </p>

          {topWrongQuestions.length === 0 && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              目前沒有需要複習的錯題。
            </div>
          )}

          {topWrongQuestions.length > 0 && (
            <div className="mt-5 space-y-4">
              {topWrongQuestions.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                      Top {index + 1}
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
                      錯誤 {item.wrong_count} 次
                    </span>
                  </div>

                  <p className="text-sm font-medium leading-6 text-slate-800">
                    {getPreviewText(item.question_text)}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    最近答案：{item.student_answer || "未作答"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}