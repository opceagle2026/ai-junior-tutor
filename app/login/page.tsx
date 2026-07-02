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

  if (value.startsWith("//")) {
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

function getLoginErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "登入失敗，請稍後再試。";
  }

  const message = error.message;

  if (message.includes("Invalid login credentials")) {
    return "帳號或密碼不正確，請再確認一次。";
  }

  if (message.includes("Email not confirmed")) {
    return "帳號尚未完成確認，請確認 Supabase 是否已關閉 Email 確認。";
  }

  if (message.includes("Too many requests") || message.includes("rate limit")) {
    return "嘗試次數過多，請稍等一下再登入。";
  }

  if (message.includes("User not found")) {
    return "找不到這個帳號，請先建立學生帳號。";
  }

  return message || "登入失敗，請稍後再試。";
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

    if (!account.trim() || !password) {
      setMessage("請輸入帳號與密碼。");
      return;
    }

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
      setMessage(getLoginErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
      <div
        className="h-2 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500"
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
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
            <span aria-hidden="true">🔑</span>
            帳號登入
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            歡迎回來，繼續學習
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            學生可使用帳號登入；管理者可使用 Email
            登入。登入後可使用線上測驗、錯題庫、錯題複習與學習統計。
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-700">
              帳號或 Email
            </span>

            <input
              type="text"
              required
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              autoComplete="username"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder="例如 student001 或 admin@example.com"
            />

            <span className="text-xs leading-5 text-slate-500">
              學生只要輸入註冊時的帳號；管理者請輸入完整 Email。
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-700">密碼</span>

            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder="請輸入密碼"
            />
          </label>

          {message && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !account.trim() || !password}
            className="w-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300"
          >
            {isLoading ? "登入中..." : "登入帳號"}
          </button>
        </form>

        <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50/80 p-5 text-sm leading-6 text-slate-600">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-2xl">
              ✨
            </div>

            <div>
              <p className="font-black text-slate-900">還沒有帳號？</p>

              <p className="mt-1">
                建立學生帳號後，就可以開始線上測驗、累積個人錯題庫與查看學習統計。
              </p>

              <Link
                href="/signup"
                className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                建立學生帳號 →
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs leading-6 text-slate-500">
          學生登入後會回到原本要使用的學習功能；管理者登入後可進入後台管理。
        </p>
      </div>
    </section>
  );
}

export default function LoginPage() {
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
        <section className="rounded-[2rem] bg-gradient-to-br from-blue-600 via-violet-600 to-pink-500 p-8 text-white shadow-lg">
          <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white">
            AI 國中家教題庫
          </div>

          <h2 className="mt-8 text-4xl font-black tracking-tight sm:text-5xl">
            每一次作答，
            <br />
            都離懂更近一點。
          </h2>

          <p className="mt-5 text-sm leading-7 text-white/85 sm:text-base">
            登入後可以開始測驗、查看個人錯題、重新複習弱點，讓 AI
            幫你把學習路線整理得更清楚。
          </p>

          <div className="mt-8 grid gap-3 text-sm font-semibold">
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              ✏️ 線上測驗：依科目與年級抽題練習
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              🧩 錯題庫：答錯的題目自動保存
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              📈 學習統計：看見自己的進步方向
            </div>
          </div>
        </section>

        <Suspense
          fallback={
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-sm backdrop-blur">
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