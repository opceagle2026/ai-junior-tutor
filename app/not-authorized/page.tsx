import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            ← 返回首頁
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight">權限不足</h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            這個帳號目前沒有後台管理權限。若需要管理教材、題庫或 AI
            分析，請確認帳號角色是否為 admin 或 teacher。
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              回首頁
            </Link>

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:w-auto"
              >
                登出
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}