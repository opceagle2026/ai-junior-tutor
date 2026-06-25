import { NextRequest, NextResponse } from "next/server";
import {
  generateAiText,
  generateAiTextFromInlineData,
} from "@/lib/aiProvider";
import { getGeminiErrorMessage } from "@/lib/geminiError";
import { supabase } from "@/lib/supabaseClient";
import {
  isSupportedSubject,
  SUBJECT_UNITS,
  SUPPORTED_SUBJECTS,
} from "@/types/subjects";

type GeminiAnalysis = {
  isJuniorHighRelevant: boolean;
  suggestedGrade: string;
  gradeConfidence: string;
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

function normalizeGrade(
  value: unknown,
  fallbackGrade: string,
): "國一" | "國二" | "國三" {
  if (value === "國一" || value === "國二" || value === "國三") {
    return value;
  }

  if (
    fallbackGrade === "國一" ||
    fallbackGrade === "國二" ||
    fallbackGrade === "國三"
  ) {
    return fallbackGrade;
  }

  return "國一";
}

function buildSupportedSubjectText() {
  return SUPPORTED_SUBJECTS.map((subject) => {
    const units = SUBJECT_UNITS[subject].join("、");
    return `${subject}：${units}`;
  }).join("\n");
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

    const selectedGrade = source.grade || "AI 自動判斷";

    const prompt = `
你是一位熟悉台灣國中課程綱要與國中會考命題方向的家教老師。

請先判斷這份教材是否適合作為「台灣國中一年級、二年級、三年級」的學習教材。
如果適合，請進一步判斷：
1. 最適合年級
2. 科目
3. 單元或題型
4. 知識點

重要限制：
1. 本系統目前只支援以下 9 個國中主要科目：
${SUPPORTED_SUBJECTS.join("、")}

2. subject 欄位只能填以下 9 個科目之一：
${SUPPORTED_SUBJECTS.join("、")}

3. 不可以回傳「語文」、「社會」、「自然」、「其他」、「不適用」作為 subject。
4. 如果教材不屬於這 9 個支援科目，請直接判斷 isJuniorHighRelevant 為 false。
5. 如果教材是本土語文、新住民語、藝術、健康與體育、綜合活動、科技、成人職場、法律文件、商業簡報、AI工具介紹、大學教材、研究報告，請判斷為不適用。
6. 不要因為使用者選了年級，就硬把教材套成國中課程。
7. 如果教材只有很少文字，且無法判斷是否為國中教材，也請判斷為不適用。
8. 只有在「明確適合國中主要科目」時，isJuniorHighRelevant 才能是 true。
9. 如果使用者選擇「AI 自動判斷」，請你自行判斷 suggestedGrade。
10. 如果使用者手動選擇國一、國二或國三，請把它當作參考，但如果內容明顯屬於其他年級，仍請依教材內容判斷。

支援科目與常見單元如下：
${buildSupportedSubjectText()}

請只能回傳 JSON，不要加入 markdown、不要加入說明。

格式：
{
  "isJuniorHighRelevant": true,
  "suggestedGrade": "國一",
  "gradeConfidence": "高",
  "rejectReason": "",
  "subject": "數學",
  "unit": "函數",
  "knowledgePoints": [],
  "extractedText": "",
  "summary": ""
}

suggestedGrade 只能填以下三種其中一種：
國一
國二
國三

gradeConfidence 只能填以下三種其中一種：
高
中
低

subject 只能填以下 9 種其中一種：
${SUPPORTED_SUBJECTS.join("、")}

unit 請填具體單元或題型，例如：
閱讀理解、作文、文法、單字、會考英聽、函數、幾何、臺灣史、世界史、臺灣地理、法律、經濟、細胞、遺傳、物理、化學、天文、板塊等。

如果不適合作為目前支援的國中主要科目教材，請回傳：
{
  "isJuniorHighRelevant": false,
  "suggestedGrade": "",
  "gradeConfidence": "低",
  "rejectReason": "簡短說明為什麼不適合目前支援的國中主要科目",
  "subject": "",
  "unit": "",
  "knowledgePoints": [],
  "extractedText": "盡量摘錄可辨識的主要文字",
  "summary": "簡短摘要這份資料大概是什麼"
}

使用者選擇的年級：
${selectedGrade}

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
        "這份資料不屬於目前支援的國中主要科目，已停止分析與出題。";

      await supabase
        .from("sources")
        .update({
          status: "failed",
          subject: "不適用",
          unit: "非支援科目",
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

    if (!isSupportedSubject(analysis.subject)) {
      const reason = `AI 判斷的科目「${analysis.subject || "未提供"}」不在目前支援的 9 個國中主要科目內。`;

      await supabase
        .from("sources")
        .update({
          status: "failed",
          subject: "不適用",
          unit: "非支援科目",
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

    const suggestedGrade = normalizeGrade(
      analysis.suggestedGrade,
      selectedGrade,
    );

    const { data: updated, error: updateError } = await supabase
      .from("sources")
      .update({
        status: "completed",
        grade: suggestedGrade,
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