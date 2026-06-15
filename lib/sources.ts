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

function normalizeSummary(content: string, maxLength = 300): string {
  return content.replace(/\s+/g, " ").trim().slice(0, maxLength);
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
  const fileType = params.file.type || params.fileType || "application/octet-stream";

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
      file_type: fileType,
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

export async function addWebSource(params: {
  title: string;
  grade: Grade;
  url: string;
  content: string;
  keyword: string;
}): Promise<SourceItem> {
  const id = crypto.randomUUID();
  const normalizedContent = params.content.trim();
  const title = params.title.trim() || params.keyword.trim() || params.url;

  const { data, error } = await supabase
    .from("sources")
    .insert({
      id,
      title,
      grade: params.grade,
      file_path: params.url,
      file_name: title,
      file_type: "web",
      file_size: normalizedContent.length,
      status: "uploaded",
      subject: AI_PENDING_LABEL,
      unit: AI_PENDING_LABEL,
      knowledge_points: [],
      extracted_text: normalizedContent,
      summary: normalizeSummary(normalizedContent),
      source_url: params.url,
      search_keyword: params.keyword,
    })
    .select()
    .single();

  if (error) throw error;

  return mapRowToSourceItem(data as SourceRow);
}

export async function updateSourceStatus(
  id: string,
  status: SourceStatus,
): Promise<void> {
  const { error } = await supabase
    .from("sources")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function updateSourceAnalysis(
  id: string,
  updates: Partial<{
    status: SourceStatus;
    subject: string;
    unit: string;
    knowledgePoints: string[];
  }>,
): Promise<SourceItem> {
  const payload: {
    status?: SourceStatus;
    subject?: string;
    unit?: string;
    knowledge_points?: string[];
  } = {};

  if (updates.status !== undefined) {
    payload.status = updates.status;
  }

  if (updates.subject !== undefined) {
    payload.subject = updates.subject;
  }

  if (updates.unit !== undefined) {
    payload.unit = updates.unit;
  }

  if (updates.knowledgePoints !== undefined) {
    payload.knowledge_points = updates.knowledgePoints;
  }

  if (Object.keys(payload).length === 0) {
    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return mapRowToSourceItem(data as SourceRow);
  }

  const { data, error } = await supabase
    .from("sources")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapRowToSourceItem(data as SourceRow);
}