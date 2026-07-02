import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

type HomeCard = {
  title: string;
  href: string;
  description: string;
  icon: string;
  colorClass: string;
};

type UserProfile = {
  role: string | null;
  username: string | null;
  display_name: string | null;
};

const ADMIN_ROLES = ["admin", "teacher"];

const studentCards: HomeCard[] = [
  {
    title: "上傳教材",
    href: "/upload",
    description: "上傳講義、課本照片或練習題，等待 AI 分析與題庫建立後就能練習。",
    icon: "📚",
    colorClass: "from-sky-400 to-blue-500",
  },
  {
    title: "線上測驗",
    href: "/practice",
    description: "依科目、年級與題型開始練習，作答後立即批改。",
    icon: "✏️",
    colorClass: "from-violet-400 to-purple-500",
  },
  {
    title: "錯題庫",
    href: "/wrong-answers",
    description: "把答錯的題目收起來，重新看懂觀念與詳解。",
    icon: "🧩",
    colorClass: "from-amber-400 to-orange-500",
  },
  {
    title: "錯題複習",
    href: "/wrong-review",
    description: "針對錯題再練一次，答對後逐步降低錯題次數。",
    icon: "🚀",
    colorClass: "from-emerald-400 to-teal-500",
  },
  {
    title: "學習統計",
    href: "/stats",
    description: "查看自己的題目表現、錯題分布與需要加強的地方。",
    icon: "📈",
    colorClass: "from-pink-400 to-rose-500",
  },
];

const adminCards: HomeCard[] = [
  {
    title: "教材管理",
    href: "/admin/sources",
    description: "管理教材、AI 分析、建立題庫與刪除教材。",
    icon: "🗂️",
    colorClass: "from-sky-500 to-blue-600",
  },
  {
    title: "題庫管理",
    href: "/admin/questions",
    description: "檢視、產生與刪除 AI 題目。",
    icon: "📝",
    colorClass: "from-violet-500 to-purple-600",
  },
  {
    title: "AI 分析儀表板",
    href: "/admin/ai-analysis",
    description: "查看教材 AI 分析與處理狀態。",
    icon: "🤖",
    colorClass: "from-emerald-500 to-teal-600",
  },
];

async function getCurrentUserAndProfile() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // 首頁只讀取登入狀態，不在這裡寫入 cookie。
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: (profile as UserProfile | null) ?? null,
  };
}

function FeatureCard({ card }: { card: HomeCard }) {
  return (
    <Link
      href={card.href}
      className="group relative block overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div
        className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${card.colorClass}`}
        aria-hidden="true"
      />

      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${card.colorClass} opacity-10 blur-2xl transition group-hover:opacity-20`}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.colorClass} text-2xl shadow-sm`}
          >
            {card.icon}
          </div>

          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {card.title}
          </h2>

          <p className="text-sm leading-6 text-slate-600">
            {card.description}
          </p>
        </div>

        <div className="mt-1 rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-700">
          開始 →
        </div>
      </div>
    </Link>
  );
}

function AdminLoginCard() {
  return (
    <Link
      href="/login?redirectedFrom=/admin"
      className="group relative block overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          🔐
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            管理者登入
          </h2>

          <p className="text-sm leading-6 text-slate-600">
            管理者登入後可進入後台首頁，管理教材、題庫與 AI 分析流程。
          </p>

          <span className="mt-1 text-sm font-medium text-blue-700">
            前往登入 →
          </span>
        </div>
      </div>
    </Link>
  );
}

function NoAdminAccessCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        🙋
      </div>

      <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
        目前是學生帳號
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        這個帳號可以使用測驗、錯題庫、錯題複習與學習統計；後台管理需 admin 或 teacher 權限。
      </p>
    </div>
  );
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        登出
      </button>
    </form>
  );
}

export default async function Home() {
  const { user, profile } = await getCurrentUserAndProfile();
  const isLoggedIn = Boolean(user);
  const role = profile?.role ?? null;
  const isAdminUser = Boolean(role && ADMIN_ROLES.includes(role));
  const displayName =
    profile?.display_name || profile?.username || user?.email || "使用者";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-pink-50 font-sans text-slate-900">
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

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:py-16">
        <header className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/70 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <span className="text-base" aria-hidden="true">
                ✨
              </span>
              AI 輔助學習流程
            </div>

            <div className="flex flex-wrap gap-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/about"
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    使用說明
                  </Link>

                  <Link
                    href={isAdminUser ? "/admin" : "/practice"}
                    className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
                  >
                    {isAdminUser ? "進入後台管理" : "我的學習"}
                  </Link>

                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/about"
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    使用說明
                  </Link>

                  <Link
                    href="/login"
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    登入帳號
                  </Link>

                  <Link
                    href="/signup"
                    className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-violet-700"
                  >
                    註冊帳號
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                AI 國中家教題庫
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                上傳教材、等待 AI 整理重點與建立題庫，再依科目出題練習；答錯的題目會自動進入錯題庫，幫你一步一步補強弱點。
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-sm font-medium">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                  教材上傳
                </span>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">
                  AI 分析
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                  線上測驗
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                  錯題加強
                </span>
              </div>

              {isLoggedIn && (
                <p className="mt-5 text-sm leading-6 text-slate-500">
                  目前登入：{displayName}
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-violet-600 to-pink-500 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-white/80">
                {isAdminUser ? "管理提醒" : "今日任務"}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {isAdminUser ? "先進後台總覽！" : "先練 5 題就好！"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/85">
                {isAdminUser
                  ? "從後台首頁可以快速進入教材管理、題庫管理與 AI 分析儀表板。"
                  : "不用一次讀很多，從一小組題目開始，錯題會幫你自動留下來複習。"}
              </p>

              <Link
                href={isAdminUser ? "/admin" : "/practice"}
                className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                {isAdminUser ? "進入後台 →" : "開始練習 →"}
              </Link>
            </div>
          </div>
        </header>

        <section
          aria-label="學生功能入口"
          className="rounded-[2rem] border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-2">
            <p className="text-sm font-bold text-blue-700">學生使用</p>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              選一個功能，開始今天的學習
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              可以先測驗，也可以先上傳教材等待 AI 分析與題庫建立；答錯沒關係，錯題庫會幫你記住要加強的地方。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {studentCards.map((card) => (
              <FeatureCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section
          aria-label="管理者功能入口"
          className="rounded-[2rem] border border-white/70 bg-white/50 p-5 shadow-sm backdrop-blur sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-slate-500">管理者使用</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                {isAdminUser ? "後台管理中心" : "管理者入口"}
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                {isAdminUser
                  ? "建議先進入後台首頁，再依需求管理教材、題庫與 AI 分析流程。"
                  : "後台管理功能需具備 admin 或 teacher 權限。"}
              </p>
            </div>

            {isLoggedIn && <LogoutButton />}
          </div>

          {isAdminUser ? (
            <div className="flex flex-col gap-5">
              <Link
                href="/admin"
                className="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 p-6 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl transition group-hover:bg-white/20"
                  aria-hidden="true"
                />

                <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white">
                      🛠️ 後台總覽
                    </div>

                    <h3 className="mt-4 text-2xl font-black tracking-tight">
                      進入後台管理首頁
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/85">
                      從這裡統一進入教材管理、題庫管理與 AI 分析儀表板，依照「教材 → 分析 → 題庫」流程管理整個系統。
                    </p>
                  </div>

                  <div className="inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm">
                    進入後台 →
                  </div>
                </div>
              </Link>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {adminCards.map((card) => (
                  <FeatureCard key={card.title} card={card} />
                ))}
              </div>
            </div>
          ) : isLoggedIn ? (
            <NoAdminAccessCard />
          ) : (
            <AdminLoginCard />
          )}
        </section>

        <footer className="pt-2 text-center text-sm text-slate-500">
          AI 國中家教題庫 MVP：教材、題庫、測驗、錯題複習與學習統計。
        </footer>
      </main>
    </div>
  );
}