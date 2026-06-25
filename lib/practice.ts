import { supabase } from "@/lib/supabaseClient";
import type { QuestionItem } from "@/lib/questions";

type FetchPracticeQuestionsOptions = {
  count?: number;
  subject?: string;
  grade?: string;
};

function shuffleItems<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

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

  const fetchLimit = Math.max(count * 5, 100);

  const { data, error } = await query.limit(fetchLimit);

  if (error) {
    throw error;
  }

  return shuffleItems(data as QuestionItem[]).slice(0, count);
}