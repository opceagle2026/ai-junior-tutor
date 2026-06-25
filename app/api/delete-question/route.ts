import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const questionId = body.questionId;

    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json({ error: "缺少 questionId" }, { status: 400 });
    }

    const { error: wrongAnswerError } = await supabase
      .from("wrong_answers")
      .delete()
      .eq("question_id", questionId);

    if (wrongAnswerError) {
      throw new Error(wrongAnswerError.message);
    }

    const { error: questionError } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (questionError) {
      throw new Error(questionError.message);
    }

    return NextResponse.json({
      ok: true,
      questionId,
    });
  } catch (error) {
    console.error("Delete question error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "刪除題目失敗",
      },
      { status: 500 },
    );
  }
}