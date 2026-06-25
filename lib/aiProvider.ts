import OpenAI from "openai";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { withGeminiRetry } from "@/lib/geminiRetry";

type AiProvider = "gemini" | "openai";

function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER || "gemini";

  if (provider === "gemini" || provider === "openai") {
    return provider;
  }

  throw new Error(`尚未支援的 AI_PROVIDER：${provider}`);
}

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in environment variables.");
  }

  return new OpenAI({
    apiKey,
  });
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

function toDataUrl(params: { data: string; mimeType: string }) {
  return `data:${params.mimeType};base64,${params.data}`;
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

  if (provider === "openai") {
    const client = getOpenAiClient();

    const response = await client.responses.create({
      model: getOpenAiModel(),
      input: prompt,
    });

    return response.output_text;
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

  if (provider === "openai") {
    const client = getOpenAiClient();

    const response = await client.responses.create({
      model: getOpenAiModel(),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: params.prompt,
            },
            {
              type: "input_image",
              image_url: toDataUrl({
                data: params.data,
                mimeType: params.mimeType,
              }),
              detail: "auto",
            },
          ],
        },
      ],
    });

    return response.output_text;
  }

  throw new Error(`尚未支援的 AI_PROVIDER：${provider}`);
}