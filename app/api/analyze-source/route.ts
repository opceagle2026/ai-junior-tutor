import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { getGeminiErrorMessage } from "@/lib/geminiError";
import { withGeminiRetry } from "@/lib/geminiRetry";
import { supabase } from "@/lib/supabaseClient";

type GeminiAnalysis = {
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

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
    });

    const prompt = `
你是一位熟悉台灣國中課程的家教老師。

請分析以下教材內容，判斷科目、單元與知識點。

只能回傳 JSON，不要加入 markdown、不要加入說明。

格式：
{
  "subject": "",
  "unit": "",
  "knowledgePoints": [],
  "extractedText": "",
  "summary": ""
}

年級：
${source.grade}

檔名或標題：
${source.file_name}

教材內容：
${source.extracted_text || source.summary || ""}
`;

    let text = "";

    if (source.file_type === "web") {
      const result = await withGeminiRetry(() =>
        model.generateContent(prompt),
      );

      text = result.response.text();
    } else {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("source-files")
        .download(source.file_path);

      if (downloadError || !fileData) {
        throw new Error(downloadError?.message || "下載檔案失敗");
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      const result = await withGeminiRetry(() =>
        model.generateContent([
          {
            inlineData: {
              data: base64,
              mimeType: source.file_type || "application/pdf",
            },
          },
          prompt,
        ]),
      );

      text = result.response.text();
    }

    const analysis = safeJsonParse(text);

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
        .update({ status: "failed" })
        .eq("id", sourceId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}