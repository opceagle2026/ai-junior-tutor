"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/admin/sources";

  const [email, setEmail] = useState("");
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
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

      <h1 className="text-3xl font-semibold tracking-tight">後台登入</h1>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        請使用管理者帳號登入後台，管理教材、題庫與 AI 分析。
      </p>

      <form onSubmit={handleLogin} className="mt-8 space-y-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Email</span>

          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="admin@example.com"
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
          {isLoading ? "登入中..." : "登入後台"}
        </button>
      </form>
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