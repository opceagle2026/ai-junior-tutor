import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { genAI } from "@/lib/gemini";

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

  return JSON.parse(cleaned) as GeminiAnalysis;
}

export async function POST(request: NextRequest) {
  try {
    const { sourceId } = await request.json();

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

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("source-files")
      .download(source.file_path);

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message || "下載檔案失敗");
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
你是一位熟悉台灣國中課程的家教老師。

請分析上傳的教材。

請判斷：
1. 科目（國文、英文、數學、自然、社會）
2. 所屬單元
3. 三到十個知識點
4. 從教材擷取主要文字內容
5. 100字以內摘要

只能回傳 JSON。

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

檔名：
${source.file_name}

不要加入 markdown。
不要加入 \`\`\`json。
不要加入任何說明。
`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: source.file_type || "application/pdf",
        },
      },
      prompt,
    ]);

    const text = result.response.text();
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

    const message = error instanceof Error ? error.message : "AI 分析失敗";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}