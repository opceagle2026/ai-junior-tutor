import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { withGeminiRetry } from "@/lib/geminiRetry";

type AiProvider = "gemini";

function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER || "gemini";

  if (provider === "gemini") {
    return "gemini";
  }

  throw new Error(`尚未支援的 AI_PROVIDER：${provider}`);
}

export async function generateAiText(prompt: string): Promise<string> {
  const provider = getAiProvider();

  if (provider === "gemini") {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
    });

    const result = await withGeminiRetry(() => model.generateContent(prompt));

    return result.response.text();
  }

  throw new Error(`尚未支援的 AI_PROVIDER：${provider}`);
}

export async function generateAiTextFromInlineData(params: {
  prompt: string;
  data: string;
  mimeType: string;
}): Promise<string> {
  const provider = getAiProvider();

  if (provider === "gemini") {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
    });

    const result = await withGeminiRetry(() =>
      model.generateContent([
        {
          inlineData: {
            data: params.data,
            mimeType: params.mimeType,
          },
        },
        params.prompt,
      ]),
    );

    return result.response.text();
  }

  throw new Error(`尚未支援的 AI_PROVIDER：${provider}`);
}