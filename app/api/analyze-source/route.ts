import { NextRequest, NextResponse } from "next/server";
import {
  generateAiText,
  generateAiTextFromInlineData,
} from "@/lib/aiProvider";
import { getGeminiErrorMessage } from "@/lib/geminiError";
import { supabase } from "@/lib/supabaseClient";

type GeminiAnalysis = {
  isJuniorHighRelevant: boolean;
  rejectReason: string;
  subject: string;
  unit: string;
  knowledgePoints: string[];
  extractedText: string;
  summary: string;
};

function safeJsonParse(text: string): GeminiAnalysis {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("AI 回傳格式錯誤，找不到 JSON 內容。");
  }

  const jsonText = cleaned.slice(jsonStart, jsonEnd + 1);

  return JSON.parse(jsonText) as GeminiAnalysis;
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

export async function POST(request: NextRequest) {
  let sourceId: string | undefined;

  try {
    const body = await request.json();
    sourceId = body.sourceId;

    if (!sourceId) {
      return NextResponse.json({ error: "缺少 sourceId" }, { status: 400 });
    }

    await supabase
      .from("sources")
      .update({ status: "analyzing" })
      .eq("id", sourceId);

    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (sourceError || !source) {
      throw new Error(sourceError?.message || "找不到教材資料");
    }

    const prompt = `
你是一位熟悉台灣國中課程綱要的家教老師。

請先判斷這份教材是否適合作為「台灣國中一年級、二年級、三年級」的學習教材。

判斷標準：
1. 教材內容必須明顯對應台灣國中課程，例如國文、英文、數學、自然、社會、科技、綜合、健康與體育、藝術等。
2. 如果內容是大學、成人職場、軟體教學、AI工具介紹、商業簡報、研究報告、一般科普但不屬於國中教材，請判斷為不適用。
3. 不要因為使用者選了年級，就硬把教材套成國中課程。
4. 如果教材只有很少文字，且無法判斷是否為國中教材，也請判斷為不適用。
5. 只有在「明確適合國中課程」時，isJuniorHighRelevant 才能是 true。

請只能回傳 JSON，不要加入 markdown、不要加入說明。

格式：
{
  "isJuniorHighRelevant": true,
  "rejectReason": "",
  "subject": "",
  "unit": "",
  "knowledgePoints": [],
  "extractedText": "",
  "summary": ""
}

如果不適合作為國中教材，請回傳：
{
  "isJuniorHighRelevant": false,
  "rejectReason": "簡短說明為什麼不適合國中課程",
  "subject": "不適用",
  "unit": "非國中課程",
  "knowledgePoints": [],
  "extractedText": "盡量摘錄可辨識的主要文字",
  "summary": "簡短摘要這份資料大概是什麼"
}

年級：
${source.grade}

檔名或標題：
${source.file_name || source.title}

教材內容：
${source.extracted_text || source.summary || ""}
`;

    let text = "";

    if (source.file_type === "web") {
      text = await generateAiText(prompt);
    } else {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("source-files")
        .download(source.file_path);

      if (downloadError || !fileData) {
        throw new Error(downloadError?.message || "下載檔案失敗");
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      text = await generateAiTextFromInlineData({
        data: base64,
        mimeType: source.file_type || "application/pdf",
        prompt,
      });
    }

    const analysis = safeJsonParse(text);
    const isJuniorHighRelevant = normalizeBoolean(
      analysis.isJuniorHighRelevant,
    );

    if (!isJuniorHighRelevant) {
      const reason =
        analysis.rejectReason ||
        "這份教材不屬於台灣國中課程，已停止分析與出題。";

      await supabase
        .from("sources")
        .update({
          status: "failed",
          subject: "不適用",
          unit: "非國中課程",
          knowledge_points: [],
          extracted_text: analysis.extractedText || "",
          summary: analysis.summary || reason,
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", sourceId);

      return NextResponse.json(
        {
          error: reason,
        },
        {
          status: 422,
        },
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("sources")
      .update({
        status: "completed",
        subject: analysis.subject,
        unit: analysis.unit,
        knowledge_points: analysis.knowledgePoints,
        extracted_text: analysis.extractedText,
        summary: analysis.summary,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", sourceId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ source: updated });
  } catch (error) {
    console.error("Analyze source error:", error);

    const message = getGeminiErrorMessage(error);

    if (sourceId) {
      await supabase
        .from("sources")
        .update({
          status: "failed",
          summary: message,
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", sourceId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}