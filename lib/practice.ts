import { supabase } from "@/lib/supabaseClient";
import type { QuestionItem } from "@/lib/questions";

export async function fetchPracticeQuestions(
  count = 10,
): Promise<QuestionItem[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .limit(count);

  if (error) {
    throw error;
  }

  return data as QuestionItem[];
}