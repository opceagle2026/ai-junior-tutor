import Link from "next/link";

export default function AiAnalysisPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-sky-50 px-6 py-10 text-slate-900 sm:py-16">
      <div
        className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-sky-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-8rem] top-32 h-96 w-96 rounded-full bg-violet-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
            >
              ← 返回首頁
            </Link>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/sources"
                className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                教材管理
              </Link>

              <Link
                href="/admin/questions"
                className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
              >
                題庫管理 →
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">
                <span aria-hidden="true">🤖</span>
                AI 分析狀態
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                查看教材分析與建題流程
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                這裡可作為 AI 分析結果與處理狀態的入口。教材上傳後，系統會分析科目、年級、單元與知識點，並協助建立題庫。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                AI 工作流程
              </p>
              <p className="mt-2 text-3xl font-black">教材 → 分析 → 題庫</p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                若要查看教材處理狀態，請回到教材管理頁；若要檢視已產生題目，請前往題庫管理。
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Link
            href="/admin/sources"
            className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 text-2xl shadow-sm">
              🗂️
            </div>

            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
              教材管理
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              查看教材上傳、AI 分析狀態，並重新分析或建立題庫。
            </p>

            <p className="mt-4 text-sm font-bold text-blue-700">
              前往教材管理 →
            </p>
          </Link>

          <Link
            href="/admin/questions"
            className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 text-2xl shadow-sm">
              📝
            </div>

            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
              題庫管理
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              檢視 AI 產生的題目，依科目、年級篩選，或刪除不適合的題目。
            </p>

            <p className="mt-4 text-sm font-bold text-violet-700">
              前往題庫管理 →
            </p>
          </Link>

          <Link
            href="/stats"
            className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl shadow-sm">
              📈
            </div>

            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
              學習統計
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              查看題庫分布與個人錯題統計，作為後續教材與題目優化參考。
            </p>

            <p className="mt-4 text-sm font-bold text-emerald-700">
              查看學習統計 →
            </p>
          </Link>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <div
            className="h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500"
            aria-hidden="true"
          />

          <div className="p-6 sm:p-8">
            <p className="text-sm font-bold text-indigo-700">目前說明</p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              AI 分析頁目前是流程入口
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              目前實際教材狀態與 AI 分析結果主要集中在「教材管理」頁；題目內容集中在「題庫管理」頁。之後如果要擴充，可以在本頁集中顯示分析中、已完成、失敗教材數，以及最近分析結果。
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-700">uploaded</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  已上傳，等待分析
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-sm font-black text-blue-700">analyzing</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  AI 正在分析
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-700">
                  completed
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  分析完成，可建題
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-sm font-black text-red-700">failed</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  分析失敗，需重試
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}