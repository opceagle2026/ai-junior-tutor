export function getGeminiErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (message.includes("429")) {
    return "Gemini 免費額度已用完，請稍後再試或開啟 Billing。";
  }

  if (message.toLowerCase().includes("quota")) {
    return "Gemini 使用額度不足，請稍後再試。";
  }

  if (message.includes("503")) {
    return "Gemini 服務暫時忙碌，請稍後再試。";
  }

  if (message.includes("500")) {
    return "Gemini 伺服器發生錯誤，請稍後再試。";
  }

  return message || "AI 服務發生未知錯誤";
}
