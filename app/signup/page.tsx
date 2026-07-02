"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useState } from "react";

const LOCAL_ACCOUNT_DOMAIN = "ai-junior-tutor.local";

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
        throw new Error("帳號只能使用英文字母、數字或底線，長度需為 3 到 20 個字。");
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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            ← 返回首頁
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight">
            建立學生帳號
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            建立帳號後，可以使用線上測驗、個人錯題庫、錯題複習與學習統計。
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">
                帳號
              </span>

              <input
                type="text"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="例如 student001"
              />

              <span className="text-xs leading-5 text-slate-500">
                可使用英文字母、數字或底線，長度 3 到 20 個字。登入時只要輸入這個帳號。
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">
                顯示名稱
              </span>

              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="例如 小明"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">
                密碼
              </span>

              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="至少 6 個字"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">
                確認密碼
              </span>

              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="請再輸入一次密碼"
              />
            </label>

            {message && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {isLoading ? "建立中..." : "建立帳號"}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p>已經有帳號？</p>

            <Link
              href="/login"
              className="mt-2 inline-flex font-medium text-blue-700 hover:text-blue-800"
            >
              回登入頁 →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}