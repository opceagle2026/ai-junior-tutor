import { supabase } from "@/lib/supabaseClient";

export type QuestionItem = {
  id: string;
  subject: string;
  grade: string;
  unit: string;
  knowledge_point: string;
  question_type: string;
  difficulty: string;
  question_text: string;
  options: string[] | null;
  answer: string;
  explanation: string;
};

export async function fetchQuestions(): Promise<QuestionItem[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as QuestionItem[];
}