import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { getGeminiErrorMessage } from "@/lib/geminiError";
import { withGeminiRetry } from "@/lib/geminiRetry";

export async function POST(request: NextRequest) {
  try {
    const {
      grade,
      subject,
      unit,
      knowledgePoint,
      questionText,
      options,
      answer,
      explanation,
      studentAnswer,
    } = await request.json();

    if (!questionText) {
      return NextResponse.json(
        {
          error: "缺少題目內容",
        },
        {
          status: 400,
        },
      );
    }

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
    });

    const prompt = `
你是一位溫柔、有耐心、熟悉台灣國中課程的 AI 家教老師。

請針對學生不會的題目，提供「引導式提示」。

請遵守：
1. 不要一開始就直接給答案。
2. 先幫學生看懂題目在問什麼。
3. 接著指出這題用到的觀念。
4. 再給一步一步的解題提示。
5. 最後才可以簡短提醒正確答案與原因。
6. 語氣要像真人家教，不要像標準答案。
7. 適合 ${grade || "國中"} 學生理解。
8. 如果學生答案是錯的，請溫和指出可能錯在哪裡。

題目資訊：
年級：${grade || "未提供"}
科目：${subject || "未提供"}
單元：${unit || "未提供"}
知識點：${knowledgePoint || "未提供"}

題目：
${questionText}

選項：
${Array.isArray(options) ? options.join("\n") : "無"}

學生答案：
${studentAnswer || "未提供"}

正確答案：
${answer || "未提供"}

原本詳解：
${explanation || "未提供"}

請用以下格式回答：

先看題目：
...

這題的關鍵觀念：
...

一步一步想：
1. ...
2. ...
3. ...

小提醒：
...

最後答案：
...
`;

    const result = await withGeminiRetry(() =>
      model.generateContent(prompt),
    );

    return NextResponse.json({
      hint: result.response.text(),
    });
  } catch (error) {
    console.error("Tutor hint error:", error);

    return NextResponse.json(
      {
        error: getGeminiErrorMessage(error),
      },
      {
        status: 500,
      },
    );
  }
}