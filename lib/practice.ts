import { supabase } from "@/lib/supabaseClient";
import type { QuestionItem } from "@/lib/questions";

export type QuestionTypeCounts = {
  選擇題: number;
  填充題: number;
  計算題: number;
  簡答題: number;
};

type FetchPracticeQuestionsOptions = {
  count?: number;
  subject?: string;
  grade?: string;
  questionTypeCounts?: QuestionTypeCounts;
};

const QUESTION_TYPES = ["選擇題", "填充題", "計算題", "簡答題"] as const;

function shuffleItems<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeCount(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  return Math.floor(value);
}

function getTotalQuestionCount(counts: QuestionTypeCounts): number {
  return (
    normalizeCount(counts.選擇題) +
    normalizeCount(counts.填充題) +
    normalizeCount(counts.計算題) +
    normalizeCount(counts.簡答題)
  );
}

async function fetchQuestionsByType(params: {
  questionType: string;
  count: number;
  subject: string;
  grade: string;
}): Promise<QuestionItem[]> {
  const count = normalizeCount(params.count);

  if (count === 0) {
    return [];
  }

  let query = supabase
    .from("questions")
    .select("*")
    .eq("question_type", params.questionType);

  if (params.subject !== "全部科目") {
    query = query.eq("subject", params.subject);
  }

  if (params.grade !== "全部年級") {
    query = query.eq("grade", params.grade);
  }

  const fetchLimit = Math.max(count * 5, 50);

  const { data, error } = await query.limit(fetchLimit);

  if (error) {
    throw error;
  }

  return shuffleItems(data as QuestionItem[]).slice(0, count);
}

export async function fetchPracticeQuestions(
  options: FetchPracticeQuestionsOptions | number = 10,
): Promise<QuestionItem[]> {
  const normalizedOptions =
    typeof options === "number" ? { count: options } : options;

  const subject = normalizedOptions.subject ?? "全部科目";
  const grade = normalizedOptions.grade ?? "全部年級";
  const questionTypeCounts = normalizedOptions.questionTypeCounts;

  if (questionTypeCounts) {
    const totalCount = getTotalQuestionCount(questionTypeCounts);

    if (totalCount === 0) {
      return [];
    }

    const questionGroups = await Promise.all(
      QUESTION_TYPES.map((questionType) =>
        fetchQuestionsByType({
          questionType,
          count: questionTypeCounts[questionType],
          subject,
          grade,
        }),
      ),
    );

    return shuffleItems(questionGroups.flat());
  }

  const count = normalizedOptions.count ?? 10;

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