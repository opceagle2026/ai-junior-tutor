"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useState } from "react";

const LOCAL_ACCOUNT_DOMAIN = "ai-junior-tutor.example.com";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function isValidUsername(value: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value);
}

function toLocalEmail(username: string) {
  return `${username}@${LOCAL_ACCOUNT_DOMAIN}`;
}

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage("");

    try {
      const normalizedUsername = normalizeUsername(username);

      if (!isValidUsername(normalizedUsername)) {
        throw new Error(
          "帳號只能使用英文字母、數字或底線，長度需為 3 到 20 個字。",
        );
      }

      if (password.length < 6) {
        throw new Error("密碼至少需要 6 個字。");
      }

      if (password !== confirmPassword) {
        throw new Error("兩次輸入的密碼不一致。");
      }

      const email = toLocalEmail(normalizedUsername);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: normalizedUsername,
            display_name: displayName.trim() || normalizedUsername,
            role: "student",
          },
        },
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      if (!user) {
        throw new Error("建立帳號失敗，請稍後再試。");
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        email,
        role: "student",
        username: normalizedUsername,
        display_name: displayName.trim() || normalizedUsername,
      });

      if (profileError) {
        throw profileError;
      }

      window.location.href = "/practice";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "註冊失敗");
    } finally {
      setIsLoading(false);
    }
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

      <div className="relative mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="rounded-[2rem] bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 p-8 text-white shadow-lg">
          <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white">
            AI 國中家教題庫
          </div>

          <h2 className="mt-8 text-4xl font-black tracking-tight sm:text-5xl">
            建立帳號，
            <br />
            開始你的學習地圖。
          </h2>

          <p className="mt-5 text-sm leading-7 text-white/85 sm:text-base">
            註冊後可以開始線上測驗、累積個人錯題庫、重新複習弱點，並用學習統計看見自己的進步方向。
          </p>

          <div className="mt-8 grid gap-3 text-sm font-semibold">
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              ✏️ 線上測驗：依科目與年級開始練習
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              🧩 錯題庫：答錯的題目自動保存
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              🚀 錯題複習：答對後逐步降低錯誤次數
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <div
            className="h-2 bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500"
            aria-hidden="true"
          />

          <div className="p-6 sm:p-8">
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
            >
              ← 返回首頁
            </Link>

            <div className="mt-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">
                <span aria-hidden="true">✨</span>
                建立學生帳號
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                開始使用 AI 學習工具
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                建立帳號後，可以使用線上測驗、個人錯題庫、錯題複習與學習統計。
              </p>
            </div>

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-700">帳號</span>

                <input
                  type="text"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  placeholder="例如 student001"
                />

                <span className="text-xs leading-5 text-slate-500">
                  可使用英文字母、數字或底線，長度 3 到 20 個字。登入時只要輸入這個帳號。
                </span>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-700">
                  顯示名稱
                </span>

                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  placeholder="例如 小明"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-700">密碼</span>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  placeholder="至少 6 個字"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-700">
                  確認密碼
                </span>

                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  placeholder="請再輸入一次密碼"
                />
              </label>

              {message && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300"
              >
                {isLoading ? "建立中..." : "建立帳號"}
              </button>
            </form>

            <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 text-sm leading-6 text-slate-600">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  🔑
                </div>

                <div>
                  <p className="font-black text-slate-900">已經有帳號？</p>

                  <p className="mt-1">
                    回到登入頁，輸入你的學生帳號或管理者 Email。
                  </p>

                  <Link
                    href="/login"
                    className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50"
                  >
                    回登入頁 →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}