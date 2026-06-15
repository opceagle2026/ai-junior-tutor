import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { sourceId } = await request.json();

    if (!sourceId) {
      return NextResponse.json(
        { error: "缺少 sourceId" },
        { status: 400 }
      );
    }

    // 1. AI分析教材
    const analyzeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/analyze-source`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceId,
        }),
      }
    );

    const analyzeResult = await analyzeResponse.json();

    if (!analyzeResponse.ok) {
      throw new Error(
        analyzeResult.error || "教材分析失敗"
      );
    }

    // 2. AI出題
    const questionResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/generate-questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceId,
          count: 10,
        }),
      }
    );

    const questionResult = await questionResponse.json();

    if (!questionResponse.ok) {
      throw new Error(
        questionResult.error || "AI出題失敗"
      );
    }

    return NextResponse.json({
      success: true,
      count: questionResult.count,
    });
  } catch (error) {
    console.error("Auto build source error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "自動建立題庫失敗",
      },
      {
        status: 500,
      }
    );
  }
}