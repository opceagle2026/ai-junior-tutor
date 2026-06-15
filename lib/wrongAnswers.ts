import { supabase } from "@/lib/supabaseClient";

export type WrongAnswerItem = {
  id: string;
  question_id: string;
  question_text: string;
  answer: string;
  student_answer: string;
  explanation: string;
  subject: string;
  unit: string;
  knowledge_point: string;
  wrong_count: number;
};

export async function saveWrongAnswer(params: {
  questionId: string;
  questionText: string;
  answer: string;
  studentAnswer: string;
  explanation: string;
  subject: string;
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
      })
      .eq("id", existing.id);

    if (error) throw error;

    return;
  }

  const { error } = await supabase
    .from("wrong_answers")
    .insert({
      question_id: params.questionId,
      question_text: params.questionText,
      answer: params.answer,
      student_answer: params.studentAnswer,
      explanation: params.explanation,
      subject: params.subject,
      unit: params.unit,
      knowledge_point: params.knowledgePoint,
      wrong_count: 1,
    });

  if (error) {
    throw error;
  }
}

export async function fetchWrongAnswersForReview(
  count = 10,
): Promise<WrongAnswerItem[]> {
  const { data, error } = await supabase
    .from("wrong_answers")
    .select("*")
    .gt("wrong_count", 0)
    .order("wrong_count", { ascending: false })
    .limit(count);

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