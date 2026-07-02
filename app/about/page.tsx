import Link from "next/link";

const studentSteps = [
  {
    title: "建立帳號",
    description: "學生先建立自己的帳號，之後測驗、錯題庫與學習統計都會保存在個人紀錄中。",
    icon: "🔑",
  },
  {
    title: "開始測驗",
    description: "可以依科目、年級與題型選擇題目練習，作答後系統會立即批改。",
    icon: "✏️",
  },
  {
    title: "累積錯題",
    description: "答錯的題目會自動進入錯題庫，方便之後重新複習觀念與詳解。",
    icon: "🧩",
  },
  {
    title: "追蹤進步",
    description: "學習統計會整理答題表現、錯題分布與需要加強的地方。",
    icon: "📈",
  },
];

const uploadNotes = [
  "可以上傳 PDF、課本照片、講義圖片或練習題截圖。",
  "上傳後不一定會立刻出題，需要等待 AI 分析與題庫建立。",
  "圖片越清楚、文字越完整，後續分析與建題效果通常越好。",
  "如果題目沒有出現，可能是教材尚未完成分析，或管理者尚未建立題庫。",
];

const adminSteps = [
  {
    title: "教材管理",
    description: "管理者可以上傳教材、查看分析狀態，並重新分析或刪除教材。",
    href: "/admin/sources",
  },
  {
    title: "題庫管理",
    description: "管理者可以依教材產生題目，檢視題庫內容，也可以刪除不適合的題目。",
    href: "/admin/questions",
  },
  {
    title: "AI 分析儀表板",
    description: "查看教材處理狀態、分析成功率，以及需要處理的失敗教材。",
    href: "/admin/ai-analysis",
  },
];

export default function AboutPage() {
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
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
            >
              ← 返回首頁
            </Link>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/signup"
                className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                建立帳號
              </Link>

              <Link
                href="/practice"
                className="inline-flex w-fit rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
              >
                開始測驗 →
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">
                <span aria-hidden="true">✨</span>
                使用說明
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                AI 國中家教題庫
                <br />
                怎麼使用？
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                這個網站可以讓學生練習題目、累積錯題、查看學習統計；也可以讓管理者上傳教材、進行 AI 分析並建立題庫。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-violet-600 to-pink-500 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">一句話流程</p>
              <p className="mt-2 text-2xl font-black">
                教材 → AI 分析 → 題庫 → 測驗 → 錯題複習
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                學生不用一次讀很多，從幾題開始練習，錯題會自動留下來。
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold text-blue-700">學生使用</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              學生可以怎麼開始？
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {studentSteps.map((step) => (
              <div
                key={step.title}
                className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 text-2xl shadow-sm">
                  {step.icon}
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-bold text-violet-700">教材上傳</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                上傳教材後，為什麼不一定立刻有題目？
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                因為教材需要經過 AI 分析、題庫建立與必要的檢查，才會成為可以練習的題目。這樣可以避免題目品質不穩，也比較適合正式使用。
              </p>
            </div>

            <div className="grid gap-3">
              {uploadNotes.map((note) => (
                <div
                  key={note}
                  className="rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-sm leading-6 text-slate-700"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold text-emerald-700">管理者使用</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              管理者可以做什麼？
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              後台功能需要 admin 或 teacher 權限。管理者可以從後台首頁統一管理教材、題庫與 AI 分析流程。
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {adminSteps.map((step) => (
              <Link
                key={step.title}
                href={step.href}
                className="group rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="text-lg font-black text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>

                <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 group-hover:bg-emerald-100">
                  前往 →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-amber-100 bg-amber-50/80 p-6 text-sm leading-7 text-slate-700 shadow-sm backdrop-blur sm:p-8">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
              💡
            </div>

            <div>
              <p className="font-black text-slate-900">試用建議</p>
              <p className="mt-1">
                第一次使用時，可以先從「線上測驗」開始。如果題目不足，再請管理者從後台新增教材與題庫。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}