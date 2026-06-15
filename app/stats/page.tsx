"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type WrongAnswerItem = {
  subject: string;
  unit: string;
  knowledge_point: string;
  wrong_count: number;
};

function findTop(items: string[]) {
  if (items.length === 0) return "-";

  const counter: Record<string, number> = {};

  items.forEach((item) => {
    counter[item] = (counter[item] || 0) + 1;
  });

  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])[0][0];
}

export default function StatsPage() {
  const [sourceCount, setSourceCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const [topSubject, setTopSubject] = useState("-");
  const [topUnit, setTopUnit] = useState("-");
  const [topKnowledge, setTopKnowledge] = useState("-");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
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
            .select("*"),
        ]);

      setSourceCount(sourceTotal ?? 0);
      setQuestionCount(questionTotal ?? 0);

      const wrongAnswers = (wrongResult.data ?? []) as WrongAnswerItem[];

      setWrongCount(wrongAnswers.length);

      setTopSubject(
        findTop(
          wrongAnswers.map((item) => item.subject)
        )
      );

      setTopUnit(
        findTop(
          wrongAnswers.map((item) => item.unit)
        )
      );

      setTopKnowledge(
        findTop(
          wrongAnswers.map((item) => item.knowledge_point)
        )
      );

      setLoading(false);
    }

    void loadStats();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        載入中...
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

          <h1 className="text-3xl font-semibold tracking-tight">
            學習統計
          </h1>

          <p className="mt-2 text-base leading-7 text-slate-600">
            查看目前教材、題庫與弱點分析。
          </p>

        </section>

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              教材數
            </p>

            <p className="mt-3 text-4xl font-bold">
              {sourceCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              題目數
            </p>

            <p className="mt-3 text-4xl font-bold">
              {questionCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              錯題數
            </p>

            <p className="mt-3 text-4xl font-bold text-red-600">
              {wrongCount}
            </p>
          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              最常錯科目
            </p>

            <p className="mt-3 text-2xl font-bold">
              {topSubject}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              最常錯單元
            </p>

            <p className="mt-3 text-2xl font-bold">
              {topUnit}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              最常錯知識點
            </p>

            <p className="mt-3 text-2xl font-bold">
              {topKnowledge}
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}