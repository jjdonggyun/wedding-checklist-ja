import { NextResponse } from "next/server";
import type { Language } from "@/types/wedding";

type TranslateRequest = {
  source: Language;
  target: Language;
  text: string;
};

type GoogleTranslateResponse = {
  data?: {
    translations?: Array<{
      translatedText?: string;
    }>;
  };
  error?: {
    message?: string;
  };
};

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_TRANSLATE_API_KEY is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as Partial<TranslateRequest>;
  const text = body.text?.trim();
  if (!text || !body.source || !body.target || body.source === body.target) {
    return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
  }

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      body: JSON.stringify({
        format: "text",
        q: text,
        source: body.source,
        target: body.target,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  const result = (await response.json()) as GoogleTranslateResponse;
  if (!response.ok) {
    return NextResponse.json(
      { error: result.error?.message || "Translation request failed." },
      { status: response.status },
    );
  }

  return NextResponse.json({
    translatedText: result.data?.translations?.[0]?.translatedText || "",
  });
}
