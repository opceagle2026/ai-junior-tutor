export const GRADES = ["國一", "國二", "國三"] as const;

export type Grade = (typeof GRADES)[number];

export type SourceStatus = "uploaded" | "analyzing" | "completed" | "failed";

export const AI_PENDING_LABEL = "AI 尚未分析";

export type SourceItem = {
  id: string;
  title: string;
  grade: Grade;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: SourceStatus;
  subject: string;
  unit: string;
  knowledgePoints: string[];
  createdAt: string;
};

export type SourceRow = {
  id: string;
  title: string;
  grade: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  subject: string;
  unit: string;
  knowledge_points: string[];
  created_at: string;
};

export const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"] as const;

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const SOURCE_FILES_BUCKET = "source-files";
