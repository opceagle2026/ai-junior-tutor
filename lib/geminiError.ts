export function getGeminiErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  const lowerMessage = message.toLowerCase();

  if (message.includes("429") || lowerMessage.includes("quota")) {
    return "Gemini 免費額度已用完，請稍後再試或開啟 Billing。";
  }

  if (message.includes("503") || lowerMessage.includes("overloaded")) {
    return "Gemini 服務暫時忙碌，請稍後再試。";
  }

  if (message.includes("500")) {
    return "Gemini 伺服器發生錯誤，請稍後再試。";
  }

  if (lowerMessage.includes("api key")) {
    return "Gemini API Key 設定有問題，請檢查 .env.local。";
  }

  return message || "AI 服務發生未知錯誤";
}