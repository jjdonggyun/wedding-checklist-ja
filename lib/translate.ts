import type { Language } from "@/types/wedding";

type TranslateResponse = {
  translatedText?: string;
  error?: string;
};

export async function translateText(text: string, source: Language, target: Language) {
  const trimmed = text.trim();
  if (!trimmed || source === target) return trimmed;

  const response = await fetch("/api/translate", {
    body: JSON.stringify({ source, target, text: trimmed }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const result = (await response.json()) as TranslateResponse;
  if (!response.ok || !result.translatedText) {
    throw new Error(result.error || "Translation failed.");
  }
  return result.translatedText;
}
