export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string;
}

export type InputMode = "files" | "youtube" | "text";

export interface YouTubeInput {
  url: string;
  captionLang: string;
}

/** A record of a previously uploaded file stored in the DB */
export interface UploadRecord {
  id: string;
  folderId: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  inputMode: InputMode;
  sourceLabel: string;
  storedPath: boolean;
  hasFile: boolean;
  quizSetId: string | null;
  createdAt: string;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  processingError: string | null;
  chunkCount: number;
}
