import { NextRequest, NextResponse } from "next/server";
import { generateAiText } from "@/lib/aiProvider";
import { getGeminiErrorMessage } from "@/lib/geminiError";
import { supabase } from "@/lib/supabaseClient";
import {
  isSupportedSubject,
  SUBJECT_UNITS,
  SUPPORTED_SUBJECTS,
  type SupportedSubject,
} from "@/types/subjects";

type GeneratedQuestion = {
  knowledgePoint: string;
  questionType: string;
  difficulty: string;
  questionText: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  tags: string[];
};

function safeJsonParse(text: string): GeneratedQuestion[] {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const jsonStart = cleaned.indexOf("[");
  const jsonEnd = cleaned.lastIndexOf("]");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("AI 回傳格式錯誤，找不到題目 JSON 陣列。");
  }

  const jsonText = cleaned.slice(jsonStart, jsonEnd + 1);

  return JSON.parse(jsonText) as GeneratedQuestion[];
}

function buildSupportedSubjectText() {
  return SUPPORTED_SUBJECTS.map((subject) => {
    const units = SUBJECT_UNITS[subject].join("、");
    return `${subject}：${units}`;
  }).join("\n");
}

function normalizeQuestionCount(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 10;
  }

  if (value < 1) {
    return 1;
  }

  if (value > 30) {
    return 30;
  }

  return Math.floor(value);
}

function normalizeOptions(options: unknown): string[] | null {
  if (!Array.isArray(options)) {
    return null;
  }

  const normalized = options.filter(
    (option): option is string =>
      typeof option === "string" && option.trim().length > 0,
  );

  return normalized.length > 0 ? normalized : null;
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter(
    (tag): tag is string => typeof tag === "string" && tag.trim().length > 0,
  );
}

function normalizeQuestion(question: GeneratedQuestion): GeneratedQuestion {
  return {
    knowledgePoint: question.knowledgePoint || "未分類知識點",
    questionType: question.questionType || "選擇題",
    difficulty: question.difficulty || "基礎",
    questionText: question.questionText || "",
    options: normalizeOptions(question.options),
    answer: question.answer || "",
    explanation: question.explanation || "",
    tags: normalizeTags(question.tags),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sourceId = body.sourceId;
    const count = normalizeQuestionCount(body.count ?? 10);

    if (!sourceId) {
      return NextResponse.json({ error: "缺少 sourceId" }, { status: 400 });
    }

    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (sourceError || !source) {
      throw new Error(sourceError?.message || "找不到教材資料");
    }

    if (!source.extracted_text && !source.summary) {
      throw new Error("這份教材尚未完成 AI 分析，請先執行 AI 分析教材。");
    }

    if (!isSupportedSubject(source.subject)) {
      return NextResponse.json(
        {
          error: `這份教材的科目「${
            source.subject || "未提供"
          }」不在目前支援的 9 個國中主要科目內，請先重新分析教材。`,
        },
        { status: 422 },
      );
    }

    const subject = source.subject as SupportedSubject;
    const suggestedUnits = SUBJECT_UNITS[subject].join("、");
    const knowledgePoints = Array.isArray(source.knowledge_points)
      ? source.knowledge_points.join("、")
      : "";

    const prompt = `
你是一位熟悉台灣國中課程與國中會考命題方向的家教老師。

請根據以下教材內容產生國中練習題。

重要限制：
1. 本系統目前只支援以下 9 個國中主要科目：
${SUPPORTED_SUBJECTS.join("、")}

2. 這份教材已經分析完成，科目已確定為「${subject}」。
3. 你只能依「${subject}」這個科目出題。
4. 不可以自行改成「語文」、「社會」、「自然」、「其他」或任何不在 9 科清單內的分類。
5. 題目必須符合台灣國中程度。
6. 題目只能根據教材內容、教材摘要、單元與知識點產生，不要超出範圍太多。
7. 選擇題要有 4 個選項。
8. 每題都要有答案與詳解。
9. 難度請平均分配基礎、中等、進階。
10. 請產生 ${count} 題。
11. 如果教材內容不足，請產生最貼近教材主題的國中基礎練習題。
12. 題目文字要清楚，避免只寫「下列何者正確」但沒有情境。
13. 答案請與 options 格式一致，例如選擇題答案可寫「A」或「A. ...」。
14. questionType 只能使用：選擇題、填充題、計算題、簡答題。
15. difficulty 只能使用：基礎、中等、進階。

支援科目與常見單元參考：
${buildSupportedSubjectText()}

本教材科目：
${subject}

本教材科目的常見單元：
${suggestedUnits}

請只回傳 JSON array，不要加入任何說明、markdown 或 code fence。

每一題格式如下：
{
  "knowledgePoint": "知識點",
  "questionType": "選擇題/填充題/計算題/簡答題",
  "difficulty": "基礎/中等/進階",
  "questionText": "題目文字",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."] 或 null,
  "answer": "正確答案",
  "explanation": "詳解",
  "tags": ["標籤1", "標籤2"]
}

教材資訊：
年級：${source.grade}
科目：${subject}
單元：${source.unit}
知識點：${knowledgePoints}

教材摘要：
${source.summary || ""}

教材主要文字：
${source.extracted_text || ""}
`;

    const text = await generateAiText(prompt);
    const questions = safeJsonParse(text)
      .map(normalizeQuestion)
      .filter((question) => question.questionText.trim().length > 0);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("AI 沒有產生有效題目。");
    }

    const rows = questions.map((question) => ({
      source_id: source.id,
      subject,
      grade: source.grade,
      unit: source.unit,
      knowledge_point: question.knowledgePoint,
      question_type: question.questionType,
      difficulty: question.difficulty,
      question_text: question.questionText,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      tags: question.tags,
      approved: false,
    }));

    const { data, error } = await supabase
      .from("questions")
      .insert(rows)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      questions: data,
      count: data.length,
    });
  } catch (error) {
    console.error("Generate questions error:", error);

    const message = getGeminiErrorMessage(error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}