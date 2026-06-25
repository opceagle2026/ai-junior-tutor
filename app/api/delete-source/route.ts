import { NextRequest, NextResponse } from "next/server";
import { SOURCE_FILES_BUCKET } from "@/types/sources";
import { supabase } from "@/lib/supabaseClient";

type QuestionRow = {
  id: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sourceId = body.sourceId;

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json({ error: "缺少 sourceId" }, { status: 400 });
    }

    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("id, file_path")
      .eq("id", sourceId)
      .single();

    if (sourceError || !source) {
      throw new Error(sourceError?.message || "找不到教材資料");
    }

    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id")
      .eq("source_id", sourceId);

    if (questionsError) {
      throw new Error(questionsError.message);
    }

    const questionIds = ((questions ?? []) as QuestionRow[]).map(
      (question) => question.id,
    );

    if (questionIds.length > 0) {
      const { error: wrongAnswerError } = await supabase
        .from("wrong_answers")
        .delete()
        .in("question_id", questionIds);

      if (wrongAnswerError) {
        throw new Error(wrongAnswerError.message);
      }
    }

    const { error: questionDeleteError } = await supabase
      .from("questions")
      .delete()
      .eq("source_id", sourceId);

    if (questionDeleteError) {
      throw new Error(questionDeleteError.message);
    }

    if (source.file_path) {
      const { error: storageError } = await supabase.storage
        .from(SOURCE_FILES_BUCKET)
        .remove([source.file_path]);

      if (storageError) {
        throw new Error(storageError.message);
      }
    }

    const { error: sourceDeleteError } = await supabase
      .from("sources")
      .delete()
      .eq("id", sourceId);

    if (sourceDeleteError) {
      throw new Error(sourceDeleteError.message);
    }

    return NextResponse.json({
      ok: true,
      sourceId,
      deletedQuestionCount: questionIds.length,
    });
  } catch (error) {
    console.error("Delete source error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "刪除教材失敗",
      },
      { status: 500 },
    );
  }
}