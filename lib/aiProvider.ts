import OpenAI from "openai";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { withGeminiRetry } from "@/lib/geminiRetry";

type AiProvider = "gemini" | "openai";

function normalizeProvider(provider: string | undefined): AiProvider | null {
  if (provider === "gemini" || provider === "openai") {
    return provider;
  }

  return null;
}

function getPrimaryProvider(): AiProvider {
  const provider =
    normalizeProvider(process.env.PRIMARY_AI_PROVIDER) ??
    normalizeProvider(process.env.AI_PROVIDER) ??
    "gemini";

  return provider;
}

function getFallbackProvider(): AiProvider | null {
  return normalizeProvider(process.env.FALLBACK_AI_PROVIDER);
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

function isRetryableAiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  const lowerMessage = message.toLowerCase();

  return (
    message.includes("429") ||
    message.includes("500") ||
    message.includes("503") ||
    lowerMessage.includes("quota") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("overloaded") ||
    lowerMessage.includes("temporarily unavailable")
  );
}

async function generateGeminiText(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
  });

  const result = await withGeminiRetry(() => model.generateContent(prompt));

  return result.response.text();
}

async function generateGeminiTextFromInlineData(params: {
  prompt: string;
  data: string;
  mimeType: string;
}): Promise<string> {
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

async function generateOpenAiText(prompt: string): Promise<string> {
  const client = getOpenAiClient();

  const response = await client.responses.create({
    model: getOpenAiModel(),
    input: prompt,
  });

  return response.output_text;
}

async function generateOpenAiTextFromInlineData(params: {
  prompt: string;
  data: string;
  mimeType: string;
}): Promise<string> {
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

async function generateTextWithProvider(
  provider: AiProvider,
  prompt: string,
): Promise<string> {
  if (provider === "gemini") {
    return generateGeminiText(prompt);
  }

  if (provider === "openai") {
    return generateOpenAiText(prompt);
  }

  throw new Error(`尚未支援的 AI Provider：${provider}`);
}

async function generateTextFromInlineDataWithProvider(
  provider: AiProvider,
  params: {
    prompt: string;
    data: string;
    mimeType: string;
  },
): Promise<string> {
  if (provider === "gemini") {
    return generateGeminiTextFromInlineData(params);
  }

  if (provider === "openai") {
    return generateOpenAiTextFromInlineData(params);
  }

  throw new Error(`尚未支援的 AI Provider：${provider}`);
}

export async function generateAiText(prompt: string): Promise<string> {
  const primaryProvider = getPrimaryProvider();
  const fallbackProvider = getFallbackProvider();

  try {
    return await generateTextWithProvider(primaryProvider, prompt);
  } catch (error) {
    if (
      fallbackProvider &&
      fallbackProvider !== primaryProvider &&
      isRetryableAiError(error)
    ) {
      console.warn(
        `Primary AI provider ${primaryProvider} failed. Falling back to ${fallbackProvider}.`,
        error,
      );

      return generateTextWithProvider(fallbackProvider, prompt);
    }

    throw error;
  }
}

export async function generateAiTextFromInlineData(params: {
  prompt: string;
  data: string;
  mimeType: string;
}): Promise<string> {
  const primaryProvider = getPrimaryProvider();
  const fallbackProvider = getFallbackProvider();

  try {
    return await generateTextFromInlineDataWithProvider(primaryProvider, params);
  } catch (error) {
    if (
      fallbackProvider &&
      fallbackProvider !== primaryProvider &&
      isRetryableAiError(error)
    ) {
      console.warn(
        `Primary AI provider ${primaryProvider} failed. Falling back to ${fallbackProvider}.`,
        error,
      );

      return generateTextFromInlineDataWithProvider(fallbackProvider, params);
    }

    throw error;
  }
}