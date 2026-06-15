"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ConnectionStatus = "loading" | "connected" | "failed";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<ConnectionStatus>("loading");

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.auth.getSession();
        setStatus(error ? "failed" : "connected");
      } catch {
        setStatus("failed");
      }
    }

    void checkConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex w-fit text-sm font-medium text-blue-700 transition hover:text-blue-800"
          >
            ← 返回首頁
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Supabase 測試
          </h1>
          <p className="text-sm text-slate-600">檢查 Supabase client 是否可正常連線。</p>
        </div>

        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-4 ${
            status === "loading"
              ? "border-slate-200 bg-slate-50"
              : status === "connected"
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
          }`}
        >
          <span
            className={`h-3 w-3 shrink-0 rounded-full ${
              status === "loading"
                ? "animate-pulse bg-slate-400"
                : status === "connected"
                  ? "bg-emerald-500"
                  : "bg-red-500"
            }`}
            aria-hidden="true"
          />

          <p
            className={`text-sm font-medium ${
              status === "loading"
                ? "text-slate-600"
                : status === "connected"
                  ? "text-emerald-800"
                  : "text-red-800"
            }`}
          >
            {status === "loading" && "連線測試中…"}
            {status === "connected" && "Supabase Connected"}
            {status === "failed" && "Supabase Connection Failed"}
          </p>
        </div>
      </div>
    </main>
  );
}
