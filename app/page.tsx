import Link from "next/link";

type HomeCard = {
  title: string;
  href: string;
  description: string;
};

const studentCards: HomeCard[] = [
  {
    title: "上傳教材",
    href: "/upload",
    description: "上傳 PDF、講義、課本照片或練習題截圖。",
  },
  {
    title: "線上測驗",
    href: "/practice",
    description: "依科目與年級抽題練習，系統會自動批改。",
  },
  {
    title: "錯題庫",
    href: "/wrong-answers",
    description: "查看答錯的題目、正確答案與詳解。",
  },
  {
    title: "錯題複習",
    href: "/wrong-review",
    description: "重新練習錯題，答對後逐步降低錯題次數。",
  },
  {
    title: "學習統計",
    href: "/stats",
    description: "查看題庫分布、錯題分布與學習弱點。",
  },
];

const adminCards: HomeCard[] = [
  {
    title: "教材管理",
    href: "/admin/sources",
    description: "管理教材、AI 分析、建立題庫與刪除教材。",
  },
  {
    title: "題庫管理",
    href: "/admin/questions",
    description: "檢視、產生與刪除 AI 題目。",
  },
  {
    title: "AI分析",
    href: "/admin/ai-analysis",
    description: "查看教材 AI 分析與處理狀態。",
  },
];

function FeatureCard({ card }: { card: HomeCard }) {
  return (
    <Link
      href={card.href}
      className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 opacity-90"
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M8.5 7.5h7M8.5 11h7M8.5 14.5h4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M7.5 3.5h9a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {card.title}
          </h2>

          <p className="text-sm leading-6 text-slate-600">
            {card.description}
          </p>
        </div>

        <div className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            開啟
          </span>

          <svg
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            <path
              d="M7.5 4.5 13 10l-5.5 5.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-blue-100 to-sky-50 opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:py-20">
        <header className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/60 bg-white px-3 py-1 text-sm font-medium text-blue-700 shadow-sm">
            <span
              className="h-2 w-2 rounded-full bg-blue-500"
              aria-hidden="true"
            />
            AI 輔助學習流程
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            AI 國中家教題庫
          </h1>

          <p className="text-base leading-7 text-slate-600 sm:text-lg">
            教材 → AI分析 → 題庫 → 出卷 → 批改 → 錯題加強
          </p>
        </header>

        <section
          aria-label="學生功能入口"
          className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-2">
            <p className="text-sm font-medium text-blue-700">學生使用</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              上傳教材與開始練習
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              學生可以上傳教材、線上測驗、查看錯題與學習統計。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {studentCards.map((card) => (
              <FeatureCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section aria-label="管理者功能入口">
          <div className="mb-5 flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-500">管理者使用</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              後台管理
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              管理教材、題庫與 AI 分析流程。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adminCards.map((card) => (
              <FeatureCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <footer className="pt-2 text-sm text-slate-500">
          AI 國中家教題庫 MVP：教材、題庫、測驗、錯題複習與學習統計。
        </footer>
      </main>
    </div>
  );
}