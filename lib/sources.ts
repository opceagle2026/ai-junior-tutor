import { supabase } from "@/lib/supabaseClient";
import {
  AI_PENDING_LABEL,
  SOURCE_FILES_BUCKET,
  type Grade,
  type SourceItem,
  type SourceRow,
  type SourceStatus,
} from "@/types/sources";

function mapRowToSourceItem(row: SourceRow): SourceItem {
  return {
    id: row.id,
    title: row.title,
    grade: row.grade as Grade,
    filePath: row.file_path,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    status: row.status as SourceStatus,
    subject: row.subject,
    unit: row.unit,
    knowledgePoints: row.knowledge_points ?? [],
    createdAt: row.created_at,
  };
}

function getSafeStoragePath(file: File): string {
  const rawExtension = file.name.split(".").pop();
  const extension = rawExtension
    ? rawExtension.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";

  const safeExtension = extension || "bin";

  return `sources/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;
}

export async function fetchSources(): Promise<SourceItem[]> {
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as SourceRow[]).map(mapRowToSourceItem);
}

export async function uploadSource(params: {
  title: string;
  grade: Grade;
  file: File;
  fileType: string;
}): Promise<SourceItem> {
  const id = crypto.randomUUID();
  const filePath = getSafeStoragePath(params.file);

  const { error: uploadError } = await supabase.storage
    .from(SOURCE_FILES_BUCKET)
    .upload(filePath, params.file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("sources")
    .insert({
      id,
      title: params.title,
      grade: params.grade,
      file_path: filePath,
      file_name: params.file.name,
      file_type: params.fileType,
      file_size: params.file.size,
      status: "uploaded",
      subject: AI_PENDING_LABEL,
      unit: AI_PENDING_LABEL,
      knowledge_points: [],
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(SOURCE_FILES_BUCKET).remove([filePath]);
    throw error;
  }

  return mapRowToSourceItem(data as SourceRow);
}

export async function updateSourceStatus(
  id: string,
  status: SourceStatus,
): Promise<void> {
  const { error } = await supabase.from("sources").update({ status }).eq("id", id);

  if (error) throw error;
}

export async function updateSourceAnalysis(
  id: string,
  updates: {
    status: SourceStatus;
    subject: string;
    unit: string;
    knowledgePoints: string[];
  },
): Promise<SourceItem> {
  const { data, error } = await supabase
    .from("sources")
    .update({
      status: updates.status,
      subject: updates.subject,
      unit: updates.unit,
      knowledge_points: updates.knowledgePoints,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapRowToSourceItem(data as SourceRow);
}