import { supabase } from "@/lib/supabaseClient";

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
  // 先找是否已存在
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