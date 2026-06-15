import Link from "next/link";

export default function AiAnalysisPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">AI分析</h1>
        <p className="text-base leading-7 text-slate-600">
          這裡會顯示 AI 對教材與作答表現的分析結果，協助優化學習內容。
        </p>
        <Link
          href="/"
          className="inline-flex w-fit items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          返回首頁
        </Link>
      </div>
    </main>
  );
}
