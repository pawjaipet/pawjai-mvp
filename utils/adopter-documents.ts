export const MAX_HOME_PHOTOS = 5;
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_BUCKET = "adopter-documents";
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const DOCUMENT_TYPES = new Set(["id_copy", "house_image", "income_statement", "other"]);
const DOCUMENT_SECTIONS = ["A", "B", "C", "D"] as const;
const IMAGE_DOCUMENT_EXTENSIONS = new Set(["heic", "heif", "jpeg", "jpg", "png", "webp"]);
const IMAGE_DOCUMENT_MIME_TYPES = new Set(["image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"]);
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

function fileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  return fromName && /^[a-z0-9]{2,5}$/.test(fromName) ? fromName : "";
}

function fileBaseName(file: File) {
  return file.name.replace(/\.[^.]+$/, "") || "document";
}

export function getDocumentFileKind(file: File): "image" | "pdf" | null {
  const mimeType = file.type.toLowerCase();
  const extension = fileExtension(file);

  if (mimeType === "application/pdf" || extension === "pdf") return "pdf";
  if (IMAGE_DOCUMENT_MIME_TYPES.has(mimeType) || IMAGE_DOCUMENT_EXTENSIONS.has(extension)) return "image";
  return null;
}

export function isHeicDocumentFile(file: File) {
  const mimeType = file.type.split(";")[0]?.trim().toLowerCase();
  const extension = fileExtension(file);

  return mimeType === "image/heic" || mimeType === "image/heif" || extension === "heic" || extension === "heif";
}

export function getStoredDocumentFileName(file: File) {
  const kind = getDocumentFileKind(file);
  if (kind === "image") return `${fileBaseName(file)}.jpg`;
  if (kind === "pdf") return `${fileBaseName(file)}.pdf`;
  return file.name || "document";
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

function joinSectionNumbers(numbers: number[]) {
  if (numbers.length === 1) return String(numbers[0]);
  if (numbers.length === 2) return `${numbers[0]} and ${numbers[1]}`;
  return `${numbers.slice(0, -1).join(", ")}, and ${numbers.at(-1)}`;
}

export function getDocumentExitSaveSummary(section: string) {
  const sectionIndex = DOCUMENT_SECTIONS.indexOf(section as (typeof DOCUMENT_SECTIONS)[number]);
  if (sectionIndex <= 0) {
    return "No sections have been saved yet.";
  }

  const savedSections = Array.from({ length: sectionIndex }, (_, index) => index + 1);
  const savedCopy = savedSections.length === 1
    ? `Section ${savedSections[0]} is`
    : `Sections ${joinSectionNumbers(savedSections)} are`;
  return `${savedCopy} already saved. Changes in section ${
    sectionIndex + 1
  } will not be saved until you press Continue.`;
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
