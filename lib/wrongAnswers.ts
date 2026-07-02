import { supabase } from "@/lib/supabaseClient";

export type WrongAnswerItem = {
  id: string;
  user_id: string | null;
  question_id: string;
  question_text: string;
  options: string[] | null;
  answer: string;
  student_answer: string;
  explanation: string;
  subject: string;
  grade: string | null;
  unit: string;
  knowledge_point: string;
  wrong_count: number;
};

type FetchWrongAnswersForReviewOptions = {
  count?: number;
  subject?: string;
  grade?: string;
};

function shuffleItems<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function isMissingSessionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Auth session missing") ||
    error.message.includes("session missing") ||
    error.message.includes("missing session")
  );
}

function getFriendlySupabaseError(error: unknown, fallback: string) {
  if (isMissingSessionError(error)) {
    return "請先重新登入，才能使用個人錯題庫。";
  }

  if (error instanceof Error && error.message) {
    if (
      error.message.includes("row-level security") ||
      error.message.includes("permission denied") ||
      error.message.includes("not authorized") ||
      error.message.includes("Unauthorized")
    ) {
      return "目前帳號沒有存取錯題庫的權限，請重新登入後再試。";
    }

    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      return "網路連線不穩，請確認網路後再試一次。";
    }

    return error.message;
  }

  return fallback;
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isMissingSessionError(error)) {
      return null;
    }

    throw new Error(getFriendlySupabaseError(error, "讀取登入狀態失敗。"));
  }

  return user?.id ?? null;
}

export async function saveWrongAnswer(params: {
  questionId: string;
  questionText: string;
  options?: string[] | null;
  answer: string;
  studentAnswer: string;
  explanation: string;
  subject: string;
  grade?: string;
  unit: string;
  knowledgePoint: string;
}) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("請先重新登入，才能把錯題保存到個人錯題庫。");
  }

  const { data: existing, error: existingError } = await supabase
    .from("wrong_answers")
    .select("*")
    .eq("user_id", userId)
    .eq("question_id", params.questionId)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      getFriendlySupabaseError(existingError, "讀取錯題紀錄失敗。"),
    );
  }

  if (existing) {
    const count = (existing.wrong_count ?? 1) + 1;

    const { error } = await supabase
      .from("wrong_answers")
      .update({
        wrong_count: count,
        student_answer: params.studentAnswer,
        options: params.options ?? existing.options ?? null,
        grade: params.grade ?? existing.grade ?? null,
      })
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(getFriendlySupabaseError(error, "更新錯題紀錄失敗。"));
    }

    return;
  }

  const { error } = await supabase.from("wrong_answers").insert({
    user_id: userId,
    question_id: params.questionId,
    question_text: params.questionText,
    options: params.options ?? null,
    answer: params.answer,
    student_answer: params.studentAnswer,
    explanation: params.explanation,
    subject: params.subject,
    grade: params.grade ?? null,
    unit: params.unit,
    knowledge_point: params.knowledgePoint,
    wrong_count: 1,
  });

  if (error) {
    throw new Error(getFriendlySupabaseError(error, "新增錯題紀錄失敗。"));
  }
}

export async function fetchWrongAnswersForReview(
  options: FetchWrongAnswersForReviewOptions | number = 10,
): Promise<WrongAnswerItem[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("請先重新登入，才能查看個人錯題庫。");
  }

  const normalizedOptions =
    typeof options === "number" ? { count: options } : options;

  const count = normalizedOptions.count ?? 10;
  const subject = normalizedOptions.subject ?? "全部科目";
  const grade = normalizedOptions.grade ?? "全部年級";

  let query = supabase
    .from("wrong_answers")
    .select("*")
    .eq("user_id", userId)
    .gt("wrong_count", 0)
    .order("wrong_count", { ascending: false });

  if (subject !== "全部科目") {
    query = query.eq("subject", subject);
  }

  if (grade !== "全部年級") {
    query = query.eq("grade", grade);
  }

  const fetchLimit = Math.max(count * 5, 100);

  const { data, error } = await query.limit(fetchLimit);

  if (error) {
    throw new Error(getFriendlySupabaseError(error, "讀取錯題庫失敗。"));
  }

  return shuffleItems(data as WrongAnswerItem[]).slice(0, count);
}

export async function updateWrongAnswerAfterReview(params: {
  wrongAnswerId: string;
  isCorrect: boolean;
  studentAnswer: string;
  currentWrongCount: number;
}): Promise<number> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("請先重新登入，才能更新個人錯題庫。");
  }

  const nextWrongCount = params.isCorrect
    ? Math.max(params.currentWrongCount - 1, 0)
    : params.currentWrongCount + 1;

  const { error } = await supabase
    .from("wrong_answers")
    .update({
      wrong_count: nextWrongCount,
      student_answer: params.studentAnswer,
    })
    .eq("id", params.wrongAnswerId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(getFriendlySupabaseError(error, "更新錯題複習結果失敗。"));
  }

  return nextWrongCount;
}