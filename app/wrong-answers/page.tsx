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

export default function WrongAnswersPage() {
  const [items, setItems] = useState<WrongAnswerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWrongAnswers() {
      const { data, error } = await supabase
        .from("wrong_answers")
        .select("*")
        .order("wrong_count", { ascending: false });

      if (!error && data) {
        setItems(data);
      }

      setIsLoading(false);
    }

    void loadWrongAnswers();
  }, []);

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
            錯題庫
          </h1>

          <p className="mt-2 text-base leading-7 text-slate-600">
            系統會自動記錄答錯的題目，並統計錯誤次數。
          </p>

        </section>

        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            載入中...
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            目前沒有錯題。
          </div>
        )}

        {items.map((item, index) => (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >

            <div className="mb-4 flex flex-wrap gap-2 text-xs">

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
                錯誤 {item.wrong_count} 次
              </span>

            </div>

            <p className="whitespace-pre-wrap text-base font-medium leading-7">
              {item.question_text}
            </p>

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

              <p>
                <span className="font-semibold">
                  你的答案：
                </span>
                {item.student_answer || "未作答"}
              </p>

              <p className="mt-2">
                <span className="font-semibold">
                  正確答案：
                </span>
                {item.answer}
              </p>

              <p className="mt-4 whitespace-pre-wrap">
                <span className="font-semibold">
                  詳解：
                </span>
                {item.explanation}
              </p>

            </div>

          </article>
        ))}

      </div>
    </main>
  );
}