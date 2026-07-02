# AI 國中家教題庫

AI 國中家教題庫是一個以 Next.js、Supabase 與 AI 分析為基礎的學習題庫網站。

這個專案的目標是讓學生可以進行線上測驗、累積個人錯題庫、重新複習錯題，並透過學習統計了解自己需要加強的地方。管理者則可以從後台上傳教材、進行 AI 分析、建立題庫與管理題目。

## 專案狀態

目前為 MVP 試用版本，已完成學生端與後台端的主要流程。

正式站：https://ai-junior-tutor.vercel.app/

## 主要功能

### 學生端

- 學生帳號註冊與登入
- 線上測驗
- 依科目、年級與題型抽題
- 作答後立即批改
- 答錯題目自動保存至個人錯題庫
- 錯題庫查看
- 錯題複習
- 學習統計
- 學生教材上傳
- 使用說明頁
- 使用意見回饋頁

### 管理者端

- 後台首頁
- 教材管理
- 教材上傳
- AI 分析狀態查看
- 題庫管理
- 依教材產生題目
- 題目刪除
- AI 分析儀表板
- 角色權限控管

## 使用流程

### 學生使用流程

1. 註冊或登入
2. 進入線上測驗
3. 交卷批改
4. 錯題自動保存
5. 查看錯題庫
6. 進行錯題複習
7. 查看學習統計

學生也可以先上傳教材：

1. 上傳教材
2. 等待 AI 分析與題庫建立
3. 進入線上測驗練習

### 管理者使用流程

1. 登入管理者帳號
2. 進入後台首頁
3. 進入教材管理
4. AI 分析教材
5. 進入題庫管理
6. 產生或刪除題目
7. 查看 AI 分析儀表板

## 頁面路由

### 公開頁面

- `/`：首頁
- `/about`：使用說明
- `/feedback`：使用意見回饋
- `/login`：登入
- `/signup`：學生註冊

### 學生功能

- `/practice`：線上測驗
- `/upload`：學生上傳教材
- `/wrong-answers`：錯題庫
- `/wrong-review`：錯題複習
- `/stats`：學習統計

### 後台功能

- `/admin`：後台首頁
- `/admin/sources`：教材管理
- `/admin/questions`：題庫管理
- `/admin/ai-analysis`：AI 分析儀表板

## 技術架構

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Database
- Supabase Storage
- Supabase SSR
- AI 題目分析與生成流程
- Vercel 部署

## 權限設計

目前帳號分為三種角色：

- `student`：學生帳號，可使用測驗、錯題庫、錯題複習、學習統計與教材上傳。
- `teacher`：可進入後台管理。
- `admin`：可進入後台管理。

後台路由會檢查使用者角色，只有 `admin` 與 `teacher` 可以進入。

## 環境變數

請在 `.env.local` 設定：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `GEMINI_API_KEY`

正式部署到 Vercel 時，也需要在 Vercel Project Settings 裡設定相同環境變數。

## 本機開發

安裝套件：

- `npm install`

啟動開發伺服器：

- `npm run dev`

開啟本機網站：

- http://localhost:3000

建立正式版：

- `npm run build`

## 常用開發指令

啟動本機開發環境：

- `npm run dev`

檢查正式版是否可以成功建置：

- `npm run build`

提交並推送到 GitHub：

- `git add .`
- `git commit -m "更新內容"`
- `git push`

## Supabase 資料表摘要

目前主要使用的資料表包含：

- `profiles`：使用者個人資料與角色權限。
- `sources`：教材來源資料。
- `questions`：AI 產生或管理者建立的題目。
- `wrong_answers`：學生個人錯題紀錄。

## 注意事項

- 學生上傳教材後，不一定會立刻出現題目，需要等待 AI 分析與題庫建立。
- 答錯題目會保存到個人錯題庫，因此需要登入後使用測驗功能。
- 如果 session 過期，請重新登入後再使用錯題庫相關功能。
- 後台功能需要 `admin` 或 `teacher` 權限。
- 目前使用意見回饋先採用 Email 方式，未來可升級為站內表單並寫入 Supabase。

## 部署

本專案部署於 Vercel。

正式站：https://ai-junior-tutor.vercel.app/

部署前請確認：

- `npm run build`

並確認 Vercel 環境變數設定完整。

## 開發備註

這個專案目前是 MVP，重點在於先完成完整學習流程：

教材 → AI 分析 → 題庫 → 測驗 → 錯題庫 → 錯題複習 → 學習統計

後續可再擴充：

- 站內意見回饋表單
- 老師班級管理
- 學生學習歷程
- 題目人工審核流程
- 題目品質標記
- 更多題型
- 更完整的教材分析狀態通知