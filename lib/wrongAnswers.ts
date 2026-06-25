import { supabase } from "@/lib/supabaseClient";

export type WrongAnswerItem = {
  id: string;
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
  const { data: existing } = await supabase
    .from("wrong_answers")
    .select("*")
    .eq("question_id", params.questionId)
    .maybeSingle();

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
      .eq("id", existing.id);

    if (error) throw error;

    return;
  }

  const { error } = await supabase.from("wrong_answers").insert({
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
    throw error;
  }
}

export async function fetchWrongAnswersForReview(
  options: FetchWrongAnswersForReviewOptions | number = 10,
): Promise<WrongAnswerItem[]> {
  const normalizedOptions =
    typeof options === "number" ? { count: options } : options;

  const count = normalizedOptions.count ?? 10;
  const subject = normalizedOptions.subject ?? "全部科目";
  const grade = normalizedOptions.grade ?? "全部年級";

  let query = supabase
    .from("wrong_answers")
    .select("*")
    .gt("wrong_count", 0)
    .order("wrong_count", { ascending: false });

  if (subject !== "全部科目") {
    query = query.eq("subject", subject);
  }

  if (grade !== "全部年級") {
    query = query.eq("grade", grade);
  }

  const { data, error } = await query.limit(count);

  if (error) throw error;

  return data as WrongAnswerItem[];
}

export async function updateWrongAnswerAfterReview(params: {
  wrongAnswerId: string;
  isCorrect: boolean;
  studentAnswer: string;
  currentWrongCount: number;
}): Promise<number> {
  const nextWrongCount = params.isCorrect
    ? Math.max(params.currentWrongCount - 1, 0)
    : params.currentWrongCount + 1;

  const { error } = await supabase
    .from("wrong_answers")
    .update({
      wrong_count: nextWrongCount,
      student_answer: params.studentAnswer,
    })
    .eq("id", params.wrongAnswerId);

  if (error) throw error;

  return nextWrongCount;
}