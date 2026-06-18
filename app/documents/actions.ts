"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import {
  collectHomePhotoFiles,
  DOCUMENT_BUCKET,
  getDocumentFileKind,
  getStoredDocumentFileName,
  getVerificationSaveMode,
  isHeicDocumentFile,
  MAX_DOCUMENT_BYTES,
  MAX_HOME_PHOTOS,
  parseUploadedDocumentMetadata,
} from "@/utils/adopter-documents";
import type { Database, Json } from "@/types/database";
import type { DocumentSubmissionState } from "./state";

function parseBoolean(value: FormDataEntryValue | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function parseNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function parseJsonArray(value: FormDataEntryValue | null): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function splitName(fullName: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

async function convertHeicDocumentToJpeg(buffer: Buffer) {
  try {
    const heicConvert = (await import("heic-convert")).default;
    const jpeg = await heicConvert({
      buffer: buffer as unknown as ArrayBufferLike,
      format: "JPEG",
      quality: 0.82,
    });

    return Buffer.from(jpeg);
  } catch {
    throw new Error("We couldn't convert that HEIC photo. Please export it as JPG or upload a different photo.");
  }
}

async function prepareDocumentUpload(file: File, kind: "image" | "pdf") {
  const sourceBuffer = Buffer.from(await file.arrayBuffer());

  if (kind === "pdf") {
    return {
      buffer: sourceBuffer,
      extension: "pdf",
      mimeType: "application/pdf",
      originalFileName: getStoredDocumentFileName(file),
    };
  }

  const imageBuffer = isHeicDocumentFile(file)
    ? await convertHeicDocumentToJpeg(sourceBuffer)
    : sourceBuffer;

  try {
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(imageBuffer, { failOn: "none" })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return {
      buffer,
      extension: "jpg",
      mimeType: "image/jpeg",
      originalFileName: getStoredDocumentFileName(file),
    };
  } catch {
    throw new Error("We couldn't process that image. Please upload a different photo or a PDF.");
  }
}

async function uploadDocumentFile({
  adopterId,
  documentType,
  file,
  userId,
}: {
  adopterId: string;
  documentType: Database["public"]["Enums"]["adopter_document_type"];
  file: File;
  userId: string;
}) {
  const fileKind = getDocumentFileKind(file);
  if (!fileKind) {
    throw new Error("Only JPG, PNG, WEBP, HEIC, HEIF, or PDF files are supported.");
  }

  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("Each document must be smaller than 15 MB.");
  }

  const admin = createAdminClient();
  const preparedFile = await prepareDocumentUpload(file, fileKind);
  const { buffer } = preparedFile;
  const digest = createHash("sha1").update(buffer).digest("hex").slice(0, 10);
  const storagePath = `${userId}/${adopterId}/${documentType}-${Date.now()}-${digest}.${preparedFile.extension}`;

  const { error } = await admin.storage.from(DOCUMENT_BUCKET).upload(storagePath, buffer, {
    contentType: preparedFile.mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return {
    mimeType: preparedFile.mimeType,
    originalFileName: preparedFile.originalFileName,
    storagePath,
  };
}

export async function submitVerificationDocuments(
  _prevState: DocumentSubmissionState,
  formData: FormData,
): Promise<DocumentSubmissionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "Please sign in to submit your verification details.",
      status: "error",
    };
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: existingDocuments } = await admin
    .from("adopter_documents")
    .select("id, document_type")
    .eq("adopter_id", adopter.id);
  const saveMode = getVerificationSaveMode(formData);
  const isFinalSubmit = saveMode === "submit";

  const idFile = formData.get("idFile");
  const uploadedDocuments = parseUploadedDocumentMetadata(formData).filter((document) =>
    document.storagePath.startsWith(`${user.id}/${adopter.id}/`)
  );
  const uploadedIdDocuments = uploadedDocuments.filter((document) => document.documentType === "id_copy");
  const uploadedHomeDocuments = uploadedDocuments.filter((document) => document.documentType === "house_image");
  if (uploadedHomeDocuments.length > MAX_HOME_PHOTOS) {
    return {
      message: `Please upload no more than ${MAX_HOME_PHOTOS} home environment files.`,
      status: "error",
    };
  }
  const homePhotoResult = collectHomePhotoFiles(formData);
  if (homePhotoResult.error) {
    return {
      message: homePhotoResult.error,
      status: "error",
    };
  }
  const homePhotoFiles = homePhotoResult.files;
  const hasExistingId = (existingDocuments ?? []).some((doc) => doc.document_type === "id_copy");
  const hasExistingHome = (existingDocuments ?? []).some((doc) => doc.document_type === "house_image");

  // ID/passport upload + number removed from the verification UI. The data
  // model still tolerates it being attached later (e.g. post-adoption flow),
  // so the server keeps reading/writing the column when supplied — just no
  // longer requires it at submit time.

  if (isFinalSubmit && homePhotoFiles.length === 0 && uploadedHomeDocuments.length === 0 && !hasExistingHome) {
    return {
      message: "Please upload at least one home environment photo or PDF.",
      status: "error",
    };
  }

  const fullName = parseString(formData.get("fullName"));
  const phoneNumber = parseString(formData.get("phone"));
  const address = parseString(formData.get("address"));
  const occupation = parseString(formData.get("occupation"));
  const dateOfBirth = parseString(formData.get("dateOfBirth"));
  const governmentIdNumber = parseString(formData.get("idNumber"));
  const hadPetsBeforeLabel = parseString(formData.get("hadPetsBefore"));
  const otherPets = parseJsonArray(formData.get("otherPets"));
  const bondingPlan = parseJsonArray(formData.get("bondingPlan"));
  const agreementAccepted = parseBoolean(formData.get("agreementAccepted")) === true;

  if (isFinalSubmit && !agreementAccepted) {
    return {
      message: "Please confirm the long-term commitment statement before submitting.",
      status: "error",
    };
  }

  const nextStatus =
    adopter.verification_status === "approved"
      ? "approved"
      : ("submitted" as Database["public"]["Enums"]["adopter_verification_status"]);

  const { firstName, lastName } = splitName(fullName);

  await admin.from("profiles").update({
    full_name: fullName,
    phone_number: phoneNumber,
  }).eq("id", user.id);

  const adopterUpdates: Database["public"]["Tables"]["adopters"]["Update"] = {
    address_line: address,
    date_of_birth: dateOfBirth,
    email: user.email ?? adopter.email,
    first_name: firstName,
    government_id_number: governmentIdNumber,
    last_name: lastName,
    occupation,
    phone_number: phoneNumber,
  };
  if (isFinalSubmit) {
    adopterUpdates.verification_status = nextStatus;
    adopterUpdates.verification_submitted_at =
      adopter.verification_submitted_at ?? new Date().toISOString();
  }

  await admin.from("adopters").update(adopterUpdates).eq("id", adopter.id);

  const profilePayload: Database["public"]["Tables"]["adopter_profiles"]["Insert"] = {
    adopter_id: adopter.id,
    adoption_reason: parseString(formData.get("reason")),
    agreement_accepted: agreementAccepted,
    behavior_response: parseString(formData.get("behaviorResponse")),
    bonding_plan: bondingPlan as Json,
    current_pets: null,
    daily_time_available: parseString(formData.get("timeAvailable")),
    dog_experience: parseString(formData.get("petExperience")),
    emergency_plan: parseString(formData.get("emergency")),
    financial_preparedness: parseString(formData.get("financialReady")),
    had_pets_before:
      hadPetsBeforeLabel === "Yes"
        ? true
        : hadPetsBeforeLabel === "No"
          ? false
          : null,
    home_ownership: parseString(formData.get("ownRent")),
    household_allergies: parseString(formData.get("allergies")),
    household_member_count: parseNumber(formData.get("householdMembers")),
    housing_type: parseString(formData.get("homeType")),
    landlord_permission: parseString(formData.get("landlordPermission")),
    other_pets: otherPets as Json,
    patience_awareness: parseString(formData.get("patienceAwareness")),
    rescue_dog_experience: parseString(formData.get("rescueCareExp")),
    trauma_response: parseString(formData.get("traumaResponse")),
    travel_plan: parseString(formData.get("travelPlan")),
    yard_space: parseString(formData.get("yardSpace")),
  };
  if (isFinalSubmit) {
    profilePayload.completed_at = new Date().toISOString();
  }

  const { error: profileError } = await admin.from("adopter_profiles").upsert(profilePayload);
  if (profileError) {
    return {
      message: profileError.message,
      status: "error",
    };
  }

  const documentRows: Database["public"]["Tables"]["adopter_documents"]["Insert"][] = [];

  try {
    if (uploadedIdDocuments.length > 0) {
      await admin.from("adopter_documents").delete().eq("adopter_id", adopter.id).eq("document_type", "id_copy");
      const uploaded = uploadedIdDocuments.at(-1)!;
      documentRows.push({
        adopter_id: adopter.id,
        document_type: "id_copy",
        mime_type: uploaded.mimeType,
        original_file_name: uploaded.originalFileName,
        storage_path: uploaded.storagePath,
      });
    }

    if (uploadedHomeDocuments.length > 0) {
      await admin
        .from("adopter_documents")
        .delete()
        .eq("adopter_id", adopter.id)
        .eq("document_type", "house_image");

      for (const uploaded of uploadedHomeDocuments) {
        documentRows.push({
          adopter_id: adopter.id,
          document_type: "house_image",
          mime_type: uploaded.mimeType,
          original_file_name: uploaded.originalFileName,
          storage_path: uploaded.storagePath,
        });
      }
    }

    if (uploadedIdDocuments.length === 0 && idFile instanceof File && idFile.size > 0) {
      const uploaded = await uploadDocumentFile({
        adopterId: adopter.id,
        documentType: "id_copy",
        file: idFile,
        userId: user.id,
      });
      await admin.from("adopter_documents").delete().eq("adopter_id", adopter.id).eq("document_type", "id_copy");
      documentRows.push({
        adopter_id: adopter.id,
        document_type: "id_copy",
        mime_type: uploaded.mimeType,
        original_file_name: uploaded.originalFileName,
        storage_path: uploaded.storagePath,
      });
    }

    if (homePhotoFiles.length > 0 && uploadedHomeDocuments.length === 0) {
      const uploadedHomePhotos: Awaited<ReturnType<typeof uploadDocumentFile>>[] = [];
      for (const file of homePhotoFiles) {
        const uploaded = await uploadDocumentFile({
          adopterId: adopter.id,
          documentType: "house_image",
          file,
          userId: user.id,
        });
        uploadedHomePhotos.push(uploaded);
      }
      // Replace prior set with new set
      await admin
        .from("adopter_documents")
        .delete()
        .eq("adopter_id", adopter.id)
        .eq("document_type", "house_image");
      for (const uploaded of uploadedHomePhotos) {
        documentRows.push({
          adopter_id: adopter.id,
          document_type: "house_image",
          mime_type: uploaded.mimeType,
          original_file_name: uploaded.originalFileName,
          storage_path: uploaded.storagePath,
        });
      }
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Document upload failed.",
      status: "error",
    };
  }

  if (documentRows.length > 0) {
    const { error: documentError } = await admin.from("adopter_documents").insert(documentRows);
    if (documentError) {
      return {
        message: documentError.message,
        status: "error",
      };
    }
  }

  revalidatePath("/appointments");
  revalidatePath("/documents");
  revalidatePath(`/dogs`);
  revalidatePath("/profile");

  return {
    completed: isFinalSubmit,
    message: isFinalSubmit
      ? nextStatus === "approved"
        ? "Your verification details were updated successfully."
        : "Your verification details were submitted successfully."
      : "Your progress was saved.",
    status: "success",
  };
}
