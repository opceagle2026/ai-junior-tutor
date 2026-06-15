export async function withGeminiRetry<T>(
    action: () => Promise<T>,
    options?: {
      retries?: number;
      delayMs?: number;
    },
  ): Promise<T> {
    const retries = options?.retries ?? 1;
    const delayMs = options?.delayMs ?? 60_000;
  
    let lastError: unknown;
  
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await action();
      } catch (error) {
        lastError = error;
  
        const message =
          error instanceof Error
            ? error.message
            : String(error);
  
        const lowerMessage = message.toLowerCase();
  
        const shouldRetry =
          message.includes("429") ||
          lowerMessage.includes("rate limit") ||
          lowerMessage.includes("quota");
  
        if (!shouldRetry || attempt === retries) {
          throw error;
        }
  
        await new Promise((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }
    }
  
    throw lastError;
  }