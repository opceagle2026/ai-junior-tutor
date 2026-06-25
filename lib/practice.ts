import { supabase } from "@/lib/supabaseClient";
import type { QuestionItem } from "@/lib/questions";

type FetchPracticeQuestionsOptions = {
  count?: number;
  subject?: string;
  grade?: string;
};

export async function fetchPracticeQuestions(
  options: FetchPracticeQuestionsOptions | number = 10,
): Promise<QuestionItem[]> {
  const normalizedOptions =
    typeof options === "number" ? { count: options } : options;

  const count = normalizedOptions.count ?? 10;
  const subject = normalizedOptions.subject ?? "全部科目";
  const grade = normalizedOptions.grade ?? "全部年級";

  let query = supabase.from("questions").select("*");

  if (subject !== "全部科目") {
    query = query.eq("subject", subject);
  }

  if (grade !== "全部年級") {
    query = query.eq("grade", grade);
  }

  const { data, error } = await query.limit(count);

  if (error) {
    throw error;
  }

  return data as QuestionItem[];
}