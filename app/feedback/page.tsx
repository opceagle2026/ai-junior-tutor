import Link from "next/link";

const feedbackTypes = [
  {
    title: "使用上看不懂",
    description: "例如不知道怎麼上傳教材、怎麼開始測驗、錯題庫怎麼使用。",
    icon: "🙋",
  },
  {
    title: "題目或答案怪怪的",
    description: "例如題目不清楚、答案判斷不準、詳解看不懂或不完整。",
    icon: "🧩",
  },
  {
    title: "上傳或登入問題",
    description: "例如教材上傳失敗、帳號登入失敗、頁面無法正常開啟。",
    icon: "🛠️",
  },
  {
    title: "想新增功能",
    description: "例如希望增加科目、題型、複習模式、學習報表或老師管理功能。",
    icon: "✨",
  },
];

export default function FeedbackPage() {
  const feedbackEmail = "sandrine0916@gmail.com";
  const mailSubject = encodeURIComponent("AI 國中家教題庫使用意見回饋");
  const mailBody = encodeURIComponent(`您好，我想回饋 AI 國中家教題庫：

1. 我使用的功能：
例如：上傳教材／線上測驗／錯題庫／錯題複習／學習統計／後台管理

2. 遇到的問題或建議：


3. 如果是題目問題，請貼上題目內容或截圖說明：


4. 使用裝置：
例如：手機／平板／電腦

謝謝。`);

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

            <Link
              href="/about"
              className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              使用說明
            </Link>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-pink-100 px-4 py-2 text-sm font-bold text-pink-700">
                <span aria-hidden="true">💬</span>
                使用意見回饋
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                告訴我們
                <br />
                哪裡可以更好
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                這是 AI 國中家教題庫的試用版本，如果你在使用時遇到問題、覺得題目怪怪的，或有想新增的功能，都可以回饋給我們。
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-pink-500 via-violet-500 to-blue-600 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                回饋小提醒
              </p>
              <p className="mt-2 text-2xl font-black">
                越具體，越容易修正
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                如果是題目或答案問題，請盡量附上科目、題目內容或截圖說明。
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold text-blue-700">可以回饋什麼？</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              常見回饋類型
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {feedbackTypes.map((type) => (
              <div
                key={type.title}
                className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-violet-500 text-2xl shadow-sm">
                  {type.icon}
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-900">
                  {type.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold text-violet-700">寄送回饋</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                用 Email 回報問題或建議
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                點下面按鈕會開啟 Email，系統會先幫你帶入回饋格式。你可以直接補上內容後寄出。
              </p>
            </div>

            <div className="rounded-3xl border border-violet-100 bg-violet-50/80 p-5">
              <p className="text-sm font-bold text-slate-900">建議包含：</p>

              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                <li>・你使用的是哪個功能</li>
                <li>・遇到什麼問題，或希望怎麼改善</li>
                <li>・如果是題目問題，請附上題目內容</li>
                <li>・你使用的是手機、平板或電腦</li>
              </ul>

              <a
                href={`mailto:${feedbackEmail}?subject=${mailSubject}&body=${mailBody}`}
                className="mt-5 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
              >
                寄出使用意見 →
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-amber-100 bg-amber-50/80 p-6 text-sm leading-7 text-slate-700 shadow-sm backdrop-blur sm:p-8">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
              💡
            </div>

            <div>
              <p className="font-black text-slate-900">後續可以升級</p>
              <p className="mt-1">
                目前先用 Email 收集回饋，之後如果試用人數增加，可以再改成站內表單，直接把回饋存進 Supabase 資料庫。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}