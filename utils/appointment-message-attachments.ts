import { createAdminClient } from "@/utils/supabase/admin";

export const APPOINTMENT_MESSAGE_ATTACHMENTS_BUCKET = "appointment-message-attachments";
export const APPOINTMENT_MESSAGE_ATTACHMENT_MAX_BYTES = 200 * 1024 * 1024;
export const APPOINTMENT_MESSAGE_ATTACHMENT_SIGNED_URL_SECONDS = 60 * 60;
export const APPOINTMENT_MESSAGE_ATTACHMENT_ACCEPT = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".mp4",
  ".mov",
  "application/pdf",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
].join(",");

type AttachmentTypePolicy = {
  extension: string;
  label: string;
  type: string;
};

const APPOINTMENT_MESSAGE_ATTACHMENT_TYPES: Record<string, AttachmentTypePolicy> = {
  "application/pdf": { extension: "pdf", label: "PDF", type: "application/pdf" },
  "image/heic": { extension: "heic", label: "HEIC", type: "image/heic" },
  "image/heif": { extension: "heif", label: "HEIF", type: "image/heif" },
  "image/jpeg": { extension: "jpg", label: "JPEG", type: "image/jpeg" },
  "image/png": { extension: "png", label: "PNG", type: "image/png" },
  "image/webp": { extension: "webp", label: "WebP", type: "image/webp" },
  "video/mp4": { extension: "mp4", label: "MP4", type: "video/mp4" },
  "video/quicktime": { extension: "mov", label: "MOV", type: "video/quicktime" },
};

const APPOINTMENT_MESSAGE_ATTACHMENT_EXTENSIONS: Record<string, AttachmentTypePolicy> = {
  heic: APPOINTMENT_MESSAGE_ATTACHMENT_TYPES["image/heic"],
  heif: APPOINTMENT_MESSAGE_ATTACHMENT_TYPES["image/heif"],
  jpeg: APPOINTMENT_MESSAGE_ATTACHMENT_TYPES["image/jpeg"],
  jpg: APPOINTMENT_MESSAGE_ATTACHMENT_TYPES["image/jpeg"],
  mov: APPOINTMENT_MESSAGE_ATTACHMENT_TYPES["video/quicktime"],
  mp4: APPOINTMENT_MESSAGE_ATTACHMENT_TYPES["video/mp4"],
  pdf: APPOINTMENT_MESSAGE_ATTACHMENT_TYPES["application/pdf"],
  png: APPOINTMENT_MESSAGE_ATTACHMENT_TYPES["image/png"],
  webp: APPOINTMENT_MESSAGE_ATTACHMENT_TYPES["image/webp"],
};

function getExtensionFromName(name: string) {
  const match = name.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? "";
}

export function getAppointmentMessageAttachmentFile(formData: FormData) {
  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size <= 0) return null;
  return file;
}

function getAppointmentMessageAttachmentPolicy(file: File) {
  const type = file.type.toLowerCase();
  const extension = getExtensionFromName(file.name);
  const policy = APPOINTMENT_MESSAGE_ATTACHMENT_TYPES[type] ?? APPOINTMENT_MESSAGE_ATTACHMENT_EXTENSIONS[extension];

  if (!policy) {
    throw new Error("Only PDF, JPEG, PNG, WebP, HEIC, HEIF, MP4, or MOV files can be attached to appointment messages.");
  }

  if (file.size > APPOINTMENT_MESSAGE_ATTACHMENT_MAX_BYTES) {
    throw new Error("Files must be 200 MB or smaller.");
  }

  return {
    extension: extension && APPOINTMENT_MESSAGE_ATTACHMENT_EXTENSIONS[extension] ? extension : policy.extension,
    type: policy.type,
  };
}

export async function uploadAppointmentMessageAttachment({
  appointmentId,
  file,
  userId,
}: {
  appointmentId: string;
  file: File;
  userId: string | null;
}) {
  const policy = getAppointmentMessageAttachmentPolicy(file);
  const admin = createAdminClient();
  const storagePath = `appointment-messages/${appointmentId}/${crypto.randomUUID()}.${policy.extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(APPOINTMENT_MESSAGE_ATTACHMENTS_BUCKET).upload(storagePath, buffer, {
    contentType: policy.type,
    metadata: {
      appointmentId,
      originalName: file.name,
      uploadedBy: userId ?? "unknown",
    },
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Supabase attachment upload failed: ${uploadError.message}`);
  }

  const { data } = admin.storage.from(APPOINTMENT_MESSAGE_ATTACHMENTS_BUCKET).getPublicUrl(storagePath);

  return {
    name: file.name,
    storagePath,
    type: policy.type,
    url: data.publicUrl,
  };
}

type AppointmentMessageAttachmentFields = {
  attachment_storage_path?: string | null;
  attachment_url: string | null;
};

type SupabaseStorageLikeClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{ data: { signedUrl?: string | null } | null; error: { message?: string } | null }>;
    };
  };
};

export async function signAppointmentMessageAttachments<
  T extends AppointmentMessageAttachmentFields,
>(
  admin: SupabaseStorageLikeClient,
  messages: T[],
): Promise<T[]> {
  const storagePaths = [
    ...new Set(messages
      .map((message) => message.attachment_storage_path)
      .filter((path): path is string => Boolean(path))),
  ];

  if (storagePaths.length === 0) return messages;

  const signedUrls = new Map<string, string>();
  await Promise.all(storagePaths.map(async (path) => {
    const { data, error } = await admin.storage
      .from(APPOINTMENT_MESSAGE_ATTACHMENTS_BUCKET)
      .createSignedUrl(path, APPOINTMENT_MESSAGE_ATTACHMENT_SIGNED_URL_SECONDS);

    if (error) {
      console.error("Appointment attachment signed URL failed", { path, error });
      return;
    }

    if (data?.signedUrl) signedUrls.set(path, data.signedUrl);
  }));

  return messages.map((message) => {
    const storagePath = message.attachment_storage_path;
    if (!storagePath) return message;

    return {
      ...message,
      attachment_url: signedUrls.get(storagePath) ?? null,
    };
  });
}
