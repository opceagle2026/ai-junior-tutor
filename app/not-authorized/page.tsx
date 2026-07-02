import Link from "next/link";

export default function NotAuthorizedPage() {
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
        <section className="rounded-[2rem] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-8 text-white shadow-lg">
          <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white">
            AI 國中家教題庫
          </div>

          <h2 className="mt-8 text-4xl font-black tracking-tight sm:text-5xl">
            這裡是後台，
            <br />
            學生帳號不能進入。
          </h2>

          <p className="mt-5 text-sm leading-7 text-white/85 sm:text-base">
            你目前登入的帳號沒有管理權限。不過學生功能都還是可以正常使用，可以回到測驗、錯題庫或學習統計繼續學習。
          </p>

          <div className="mt-8 grid gap-3 text-sm font-semibold">
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              ✏️ 可以使用：線上測驗
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              🧩 可以使用：錯題庫與錯題複習
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              📈 可以使用：學習統計
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <div
            className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
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
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
                <span aria-hidden="true">🔐</span>
                權限不足
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                目前帳號沒有後台權限
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                後台管理功能需要 admin 或 teacher 權限。若你是學生，請回到學習功能繼續使用；若你是管理者，請確認登入的是管理者 Email。
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/practice"
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-center text-sm font-bold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
              >
                回我的學習
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                回首頁
              </Link>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 text-sm leading-6 text-slate-600">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  🙋
                </div>

                <div>
                  <p className="font-black text-slate-900">
                    要改用管理者帳號嗎？
                  </p>

                  <p className="mt-1">
                    你可以先登出，再用具有 admin 或 teacher 權限的 Email 登入。
                  </p>

                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="mt-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      登出
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}