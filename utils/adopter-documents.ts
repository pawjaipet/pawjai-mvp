export const MAX_HOME_PHOTOS = 5;
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_BUCKET = "adopter-documents";
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const DOCUMENT_TYPES = new Set(["id_copy", "house_image", "income_statement", "other"]);
const VERIFICATION_SAVE_MODES = new Set(["draft", "submit"]);

export type VerificationSaveMode = "draft" | "submit";

export type UploadedAdopterDocument = {
  documentType: "id_copy" | "house_image" | "income_statement" | "other";
  mimeType: string | null;
  originalFileName: string | null;
  storagePath: string;
};

function isPresentFile(value: FormDataEntryValue | File | null): value is File {
  return value instanceof File && value.size > 0;
}

export function syncVerificationFileFields(
  formData: FormData,
  {
    homePhotos,
    idFile,
  }: {
    homePhotos: File[];
    idFile: File | null;
  },
) {
  formData.delete("idFile");
  formData.delete("homePhotos");

  if (isPresentFile(idFile)) {
    formData.append("idFile", idFile);
  }

  for (const file of homePhotos) {
    if (isPresentFile(file)) {
      formData.append("homePhotos", file);
    }
  }

  return formData;
}

export function collectHomePhotoFiles(formData: FormData) {
  const files = formData
    .getAll("homePhotos")
    .filter(isPresentFile);

  if (files.length > MAX_HOME_PHOTOS) {
    return {
      error: `Please upload no more than ${MAX_HOME_PHOTOS} home environment files.`,
      files: [],
    };
  }

  return { error: null, files };
}

export function getVerificationSaveMode(formData: FormData): VerificationSaveMode {
  const mode = String(formData.get("verificationSaveMode") ?? "submit");
  return VERIFICATION_SAVE_MODES.has(mode) ? mode as VerificationSaveMode : "submit";
}

function isUploadedAdopterDocument(value: unknown): value is UploadedAdopterDocument {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.documentType === "string"
    && DOCUMENT_TYPES.has(record.documentType)
    && typeof record.storagePath === "string"
    && record.storagePath.trim() !== ""
    && (typeof record.mimeType === "string" || record.mimeType === null)
    && (typeof record.originalFileName === "string" || record.originalFileName === null)
  );
}

export function setUploadedDocumentFields(
  formData: FormData,
  uploadedDocuments: UploadedAdopterDocument[],
) {
  formData.delete("idFile");
  formData.delete("homePhotos");
  formData.delete("uploadedDocuments");

  if (uploadedDocuments.length > 0) {
    formData.set("uploadedDocuments", JSON.stringify(uploadedDocuments));
  }

  return formData;
}

export function parseUploadedDocumentMetadata(formData: FormData): UploadedAdopterDocument[] {
  const raw = String(formData.get("uploadedDocuments") ?? "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isUploadedAdopterDocument) : [];
  } catch {
    return [];
  }
}
