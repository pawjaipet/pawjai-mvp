import "server-only";

const DEFAULT_B2_PUBLIC_BASE_URL = "https://media.pawjaipet.com/file/pawjai";

type B2AuthorizeResponse = {
  absoluteMinimumPartSize: number;
  accountId: string;
  allowed: {
    bucketId?: string;
    bucketName?: string;
    capabilities: string[];
    namePrefix?: string | null;
  };
  apiInfo?: {
    storageApi?: {
      apiUrl: string;
      bucketId: string;
      downloadUrl: string;
    };
  };
  apiUrl?: string;
  authorizationToken: string;
  downloadUrl?: string;
};

type B2UploadUrlResponse = {
  authorizationToken: string;
  bucketId: string;
  uploadUrl: string;
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required Backblaze environment variable: ${name}`);
  }

  return value;
}

function getPublicBaseUrl() {
  return (process.env.PAWJAI_B2_PUBLIC_BASE_URL ?? DEFAULT_B2_PUBLIC_BASE_URL).replace(/\/+$/, "");
}

export function extensionFromContentType(contentType: string | null) {
  const type = contentType?.split(";")[0]?.trim().toLowerCase();

  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

export function buildBackblazePublicUrl(storagePath: string) {
  return `${getPublicBaseUrl()}/${storagePath}`;
}

async function authorizeBackblaze() {
  const keyId = requireEnv("B2_KEY_ID");
  const applicationKey = requireEnv("B2_APPLICATION_KEY");

  const response = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${applicationKey}`).toString("base64")}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Backblaze authorization failed with status ${response.status}.`);
  }

  return (await response.json()) as B2AuthorizeResponse;
}

async function getUploadUrl(auth: B2AuthorizeResponse, bucketId: string) {
  const apiUrl = auth.apiInfo?.storageApi?.apiUrl ?? auth.apiUrl;

  if (!apiUrl) {
    throw new Error("Backblaze authorization did not return an API URL.");
  }

  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    body: JSON.stringify({ bucketId }),
    headers: {
      Authorization: auth.authorizationToken,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Backblaze upload URL request failed with status ${response.status}.`);
  }

  return (await response.json()) as B2UploadUrlResponse;
}

async function sha1Hex(buffer: Buffer) {
  const { createHash } = await import("node:crypto");
  return createHash("sha1").update(buffer).digest("hex");
}

export async function uploadBufferToBackblaze({
  body,
  contentType,
  desiredPath,
}: {
  body: Buffer;
  contentType: string | null;
  desiredPath: string;
}) {
  const bucketId = requireEnv("B2_BUCKET_ID");
  const auth = await authorizeBackblaze();
  const upload = await getUploadUrl(auth, bucketId);
  const fileName = desiredPath.replace(/^\/+/, "");
  const checksum = await sha1Hex(body);
  const resolvedContentType =
    contentType?.split(";")[0]?.trim() || "b2/x-auto";

  const response = await fetch(upload.uploadUrl, {
    body: new Uint8Array(body),
    headers: {
      Authorization: upload.authorizationToken,
      "Content-Length": String(body.byteLength),
      "Content-Type": resolvedContentType,
      "X-Bz-Content-Sha1": checksum,
      "X-Bz-File-Name": encodeURIComponent(fileName),
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Backblaze upload failed with status ${response.status}: ${errorText}`,
    );
  }

  return {
    contentType: resolvedContentType,
    extension: extensionFromContentType(contentType),
    publicUrl: buildBackblazePublicUrl(fileName),
    storagePath: fileName,
  };
}
