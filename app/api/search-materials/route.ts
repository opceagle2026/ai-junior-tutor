import { NextRequest, NextResponse } from "next/server";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "缺少 keyword" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `${keyword} 國中 教材`,
        search_depth: "advanced",
        max_results: 10,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error("Tavily 搜尋失敗");
    }

    const data = await response.json();

    const materials: TavilyResult[] = (data.results || []).map(
      (item: {
        title?: string;
        url?: string;
        content?: string;
      }) => ({
        title: item.title ?? "",
        url: item.url ?? "",
        content: item.content ?? "",
      }),
    );

    return NextResponse.json({
      keyword,
      count: materials.length,
      materials,
    });
  } catch (error) {
    console.error("Search materials error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "搜尋教材失敗";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}