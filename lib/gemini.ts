import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("Missing GEMINI_API_KEY in environment variables.");
}

export const genAI = new GoogleGenerativeAI(geminiApiKey);

export const GEMINI_MODEL = "gemini-2.0-flash";