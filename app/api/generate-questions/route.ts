import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { getGeminiErrorMessage } from "@/lib/geminiError";
import { supabase } from "@/lib/supabaseClient";

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

export async function POST(request: NextRequest) {
  try {
    const { sourceId, count = 10 } = await request.json();

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

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
    });

    const prompt = `
你是一位台灣國中家教老師，請根據以下教材內容產生國中練習題。

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

限制：
1. 題目必須符合台灣國中程度。
2. 題目只能根據教材內容與相關知識點產生，不要超出範圍太多。
3. 選擇題要有 4 個選項。
4. 每題都要有答案與詳解。
5. 難度請平均分配基礎、中等、進階。
6. 請產生 ${count} 題。
7. 如果教材內容不足，請產生最貼近教材主題的國中基礎練習題。
8. 題目文字要清楚，避免只寫「下列何者正確」但沒有情境。
9. 答案請與 options 格式一致，例如選擇題答案可寫「A」或「A. ...」。

教材資訊：
年級：${source.grade}
科目：${source.subject}
單元：${source.unit}
知識點：${(source.knowledge_points || []).join("、")}

教材摘要：
${source.summary || ""}

教材主要文字：
${source.extracted_text || ""}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const questions = safeJsonParse(text);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("AI 沒有產生有效題目。");
    }

    const rows = questions.map((question) => ({
      source_id: source.id,
      subject: source.subject,
      grade: source.grade,
      unit: source.unit,
      knowledge_point: question.knowledgePoint,
      question_type: question.questionType,
      difficulty: question.difficulty,
      question_text: question.questionText,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      tags: question.tags ?? [],
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