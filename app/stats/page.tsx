"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SUPPORTED_SUBJECTS } from "@/types/subjects";

type WrongAnswerItem = {
  id: string;
  user_id: string | null;
  question_text: string;
  answer: string;
  student_answer: string;
  explanation: string;
  subject: string;
  grade?: string | null;
  unit: string;
  knowledge_point: string;
  wrong_count: number;
};

type QuestionStatsItem = {
  id: string;
  subject: string;
  grade: string;
  unit: string;
};

type TopItem = {
  label: string;
  count: number;
};

type CountItem = {
  label: string;
  count: number;
};

type StatCardProps = {
  label: string;
  value: number | string;
  description: string;
  icon: string;
  colorClass: string;
};

const GRADE_LABELS = ["國一", "國二", "國三"] as const;

function findTopByWrongCount(
  items: WrongAnswerItem[],
  key: "subject" | "grade" | "unit" | "knowledge_point",
): TopItem {
  if (items.length === 0) {
    return {
      label: "-",
      count: 0,
    };
  }

  const counter: Record<string, number> = {};

  items.forEach((item) => {
    const rawValue = item[key];
    const label = rawValue || "未分類";
    counter[label] = (counter[label] || 0) + (item.wrong_count || 0);
  });

  const [label, count] =
    Object.entries(counter).sort((a, b) => b[1] - a[1])[0] ?? ["-", 0];

  return {
    label,
    count,
  };
}

function countQuestionsByLabel(
  items: QuestionStatsItem[],
  labels: readonly string[],
  key: "subject" | "grade",
): CountItem[] {
  return labels.map((label) => ({
    label,
    count: items.filter((item) => item[key] === label).length,
  }));
}

function countWrongByLabel(
  items: WrongAnswerItem[],
  labels: readonly string[],
  key: "subject" | "grade",
): CountItem[] {
  return labels.map((label) => ({
    label,
    count: items
      .filter((item) => item[key] === label)
      .reduce((sum, item) => sum + (item.wrong_count || 0), 0),
  }));
}

function getMaxCount(items: CountItem[]) {
  return Math.max(...items.map((item) => item.count), 1);
}

function getPreviewText(text: string, maxLength = 80) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function StatCard({
  label,
  value,
  description,
  icon,
  colorClass,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${colorClass} opacity-10 blur-2xl transition group-hover:opacity-20`}
        aria-hidden="true"
      />

      <div className="relative">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClass} text-2xl shadow-sm`}
        >
          {icon}
        </div>

        <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
        <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
          {value}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function WeakPointCard({
  label,
  item,
  icon,
  colorClass,
}: {
  label: string;
  item: TopItem;
  icon: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div
        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClass} text-xl shadow-sm`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
        {item.label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        累計錯誤 {item.count} 次
      </p>
    </div>
  );
}

function DistributionList({
  title,
  description,
  items,
  colorClass = "from-blue-500 to-sky-500",
}: {
  title: string;
  description: string;
  items: CountItem[];
  colorClass?: string;
}) {
  const maxCount = getMaxCount(items);

  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
      <h2 className="text-xl font-black tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const percentage = Math.round((item.count / maxCount) * 100);

          return (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-slate-700">{item.label}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  {item.count}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function StatsPage() {
  const [sourceCount, setSourceCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [wrongAnswerCount, setWrongAnswerCount] = useState(0);
  const [activeWrongCount, setActiveWrongCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalWrongTimes, setTotalWrongTimes] = useState(0);

  const [questionSubjectStats, setQuestionSubjectStats] = useState<CountItem[]>(
    [],
  );
  const [questionGradeStats, setQuestionGradeStats] = useState<CountItem[]>([]);
  const [wrongSubjectStats, setWrongSubjectStats] = useState<CountItem[]>([]);
  const [wrongGradeStats, setWrongGradeStats] = useState<CountItem[]>([]);

  const [topSubject, setTopSubject] = useState<TopItem>({
    label: "-",
    count: 0,
  });
  const [topGrade, setTopGrade] = useState<TopItem>({
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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          window.location.href = "/login?redirectedFrom=/stats";
          return;
        }

        const [
          { count: sourceTotal },
          questionCountResult,
          questionsResult,
          wrongResult,
        ] = await Promise.all([
          supabase
            .from("sources")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("questions")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("questions")
            .select("id, subject, grade, unit"),

          supabase
            .from("wrong_answers")
            .select("*")
            .eq("user_id", user.id)
            .order("wrong_count", { ascending: false }),
        ]);

        setSourceCount(sourceTotal ?? 0);
        setQuestionCount(questionCountResult.count ?? 0);

        if (questionsResult.error) {
          throw questionsResult.error;
        }

        if (wrongResult.error) {
          throw wrongResult.error;
        }

        const questions = (questionsResult.data ?? []) as QuestionStatsItem[];
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

        setQuestionSubjectStats(
          countQuestionsByLabel(questions, SUPPORTED_SUBJECTS, "subject"),
        );
        setQuestionGradeStats(
          countQuestionsByLabel(questions, GRADE_LABELS, "grade"),
        );
        setWrongSubjectStats(
          countWrongByLabel(activeWrongAnswers, SUPPORTED_SUBJECTS, "subject"),
        );
        setWrongGradeStats(
          countWrongByLabel(activeWrongAnswers, GRADE_LABELS, "grade"),
        );

        setTopSubject(findTopByWrongCount(activeWrongAnswers, "subject"));
        setTopGrade(findTopByWrongCount(activeWrongAnswers, "grade"));
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
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-pink-50 px-6 py-16 text-slate-900">
        <div
          className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-sky-300/30 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-5xl rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          載入學習統計中...
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

            <div className="flex flex-wrap gap-2">
              <Link
                href="/wrong-answers"
                className="inline-flex w-fit items-center rounded-full border border-amber-100 bg-white px-4 py-2 text-sm font-bold text-amber-700 shadow-sm hover:bg-amber-50"
              >
                查看錯題庫
              </Link>

              <Link
                href="/wrong-review"
                className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-emerald-600 hover:to-teal-600"
              >
                開始錯題複習 →
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-pink-100 px-4 py-2 text-sm font-bold text-pink-700">
                <span aria-hidden="true">📈</span>
                學習統計
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                看見自己的進步方向
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                查看目前教材、題庫總量，以及你個人的錯題狀況與學習弱點。統計不是排名，而是幫你知道下一步要加強哪裡。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-pink-500 via-violet-500 to-blue-500 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                今日學習雷達
              </p>
              <p className="mt-2 text-4xl font-black">
                {activeWrongCount}
                <span className="ml-1 text-lg font-bold text-white/80">
                  題
                </span>
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                目前待複習題數。先從錯誤次數最高的題目開始，最容易看到進步。
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-red-100 bg-red-50/90 p-4 text-sm leading-6 text-red-700 shadow-sm backdrop-blur">
            {message}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <StatCard
            label="教材數"
            value={sourceCount}
            description="全站教材總量"
            icon="📚"
            colorClass="from-sky-400 to-blue-500"
          />

          <StatCard
            label="題目數"
            value={questionCount}
            description="全站題庫總量"
            icon="📝"
            colorClass="from-violet-400 to-purple-500"
          />

          <StatCard
            label="我的錯題紀錄數"
            value={wrongAnswerCount}
            description="目前登入者個人紀錄"
            icon="🧩"
            colorClass="from-amber-400 to-orange-500"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <StatCard
            label="我的待複習題數"
            value={activeWrongCount}
            description="wrong_count 大於 0"
            icon="🚀"
            colorClass="from-amber-400 to-orange-500"
          />

          <StatCard
            label="我的已熟練題數"
            value={masteredCount}
            description="wrong_count 已降到 0"
            icon="🎉"
            colorClass="from-emerald-400 to-teal-500"
          />

          <StatCard
            label="我的錯誤累計次數"
            value={totalWrongTimes}
            description="依 wrong_count 加總"
            icon="🔥"
            colorClass="from-red-400 to-rose-500"
          />
        </div>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="mb-5">
            <p className="text-sm font-bold text-pink-700">我的弱點雷達</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              先從最常錯的地方開始補強
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              這裡依照錯誤累計次數統計，幫你找出最需要優先複習的科目、年級、單元與知識點。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <WeakPointCard
              label="我的最弱科目"
              item={topSubject}
              icon="🎯"
              colorClass="from-blue-400 to-sky-500"
            />

            <WeakPointCard
              label="我的最弱年級"
              item={topGrade}
              icon="🏫"
              colorClass="from-violet-400 to-purple-500"
            />

            <WeakPointCard
              label="我的最弱單元"
              item={topUnit}
              icon="🧭"
              colorClass="from-amber-400 to-orange-500"
            />

            <WeakPointCard
              label="我的最弱知識點"
              item={topKnowledge}
              icon="💡"
              colorClass="from-pink-400 to-rose-500"
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <DistributionList
            title="各科目題庫分布"
            description="目前全站題庫中，各科目的題目數。"
            items={questionSubjectStats}
            colorClass="from-blue-500 to-sky-500"
          />

          <DistributionList
            title="各年級題庫分布"
            description="目前全站題庫中，各年級的題目數。"
            items={questionGradeStats}
            colorClass="from-violet-500 to-purple-500"
          />

          <DistributionList
            title="我的各科目錯題分布"
            description="依 wrong_count 加總，你在各科目的錯誤累計次數。"
            items={wrongSubjectStats}
            colorClass="from-amber-500 to-orange-500"
          />

          <DistributionList
            title="我的各年級錯題分布"
            description="依 wrong_count 加總，你在各年級的錯誤累計次數。"
            items={wrongGradeStats}
            colorClass="from-emerald-500 to-teal-500"
          />
        </div>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-red-700">優先複習清單</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                我的高錯誤次數題目 Top 5
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                優先複習這些題目，通常可以最快改善弱點。
              </p>
            </div>

            <Link
              href="/wrong-review"
              className="mt-2 inline-flex w-fit rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-emerald-600 hover:to-teal-600 sm:mt-0"
            >
              開始複習 →
            </Link>
          </div>

          {topWrongQuestions.length === 0 && (
            <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                🎉
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-900">
                目前沒有需要複習的錯題
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-600">
                可以先去線上測驗練習一小組題目，答錯的題目會自動收進錯題庫。
              </p>

              <Link
                href="/practice"
                className="mt-5 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
              >
                開始線上測驗 →
              </Link>
            </div>
          )}

          {topWrongQuestions.length > 0 && (
            <div className="mt-6 space-y-4">
              {topWrongQuestions.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700">
                      Top {index + 1}
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

                    <span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">
                      錯誤 {item.wrong_count} 次
                    </span>
                  </div>

                  <p className="text-sm font-bold leading-7 text-slate-800">
                    {getPreviewText(item.question_text)}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
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