"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const LOCAL_ACCOUNT_DOMAIN = "ai-junior-tutor.example.com";

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/";
  }

  return value;
}

function normalizeLoginAccount(value: string) {
  const account = value.trim();

  if (account.includes("@")) {
    return account;
  }

  return `${account}@${LOCAL_ACCOUNT_DOMAIN}`;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectedFrom = getSafeRedirectPath(searchParams.get("redirectedFrom"));

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage("");

    try {
      const loginEmail = normalizeLoginAccount(account);

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        throw error;
      }

      window.location.href = redirectedFrom;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登入失敗");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <Link
        href="/"
        className="mb-6 inline-flex w-fit items-center text-sm font-medium text-blue-700 hover:text-blue-800"
      >
        ← 返回首頁
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight">帳號登入</h1>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        學生可使用帳號登入；管理者可使用 Email 登入。登入後可使用線上測驗、錯題庫、錯題複習與學習統計。
      </p>

      <form onSubmit={handleLogin} className="mt-8 space-y-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            帳號或 Email
          </span>

          <input
            type="text"
            required
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            autoComplete="username"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="例如 student001 或 admin@example.com"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">密碼</span>

          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="請輸入密碼"
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
          {isLoading ? "登入中..." : "登入"}
        </button>
      </form>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p>還沒有帳號？</p>

        <Link
          href="/signup"
          className="mt-2 inline-flex font-medium text-blue-700 hover:text-blue-800"
        >
          建立學生帳號 →
        </Link>
      </div>

      <p className="mt-5 text-xs leading-6 text-slate-500">
        學生登入後會回到原本要使用的學習功能；管理者登入後可進入後台管理。
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Suspense
          fallback={
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-600">登入頁載入中...</p>
            </section>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}