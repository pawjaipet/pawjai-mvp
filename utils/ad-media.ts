import "server-only";

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { AdCreativeSettings } from "@/utils/ad-creative-settings";

const execFileAsync = promisify(execFile);
const AD_IMAGE_JPEG_QUALITY = 82;

type OptimizedAdMedia = {
  body: Buffer;
  contentType: string;
  extension: string;
  mediaType: "image" | "video";
};

function extensionFromName(name: string) {
  return path.extname(name).replace(/^\./, "").toLowerCase();
}

function normalizedMimeType(file: File) {
  return file.type.split(";")[0]?.trim().toLowerCase() || "";
}

function isHeicImage(contentType: string, extension: string) {
  return (
    contentType === "image/heic" ||
    contentType === "image/heif" ||
    extension === "heic" ||
    extension === "heif"
  );
}

function isImageAsset(contentType: string, extension: string) {
  return (
    contentType.startsWith("image/") ||
    ["heic", "heif", "jpeg", "jpg", "png", "webp"].includes(extension)
  );
}

function isVideoAsset(contentType: string, extension: string) {
  return (
    contentType.startsWith("video/") ||
    ["mov", "mp4"].includes(extension)
  );
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function convertHeicToJpeg(body: Buffer) {
  try {
    const heicConvert = (await import("heic-convert")).default;
    const jpeg = await heicConvert({
      buffer: body as unknown as ArrayBufferLike,
      format: "JPEG",
      quality: AD_IMAGE_JPEG_QUALITY / 100,
    });

    return Buffer.from(jpeg);
  } catch (heicConvertError) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pawjai-ad-heic-"));
    const inputPath = path.join(tempDir, "input.heic");
    const outputPath = path.join(tempDir, "output.jpg");

    try {
      await fs.writeFile(inputPath, body);
      await execFileAsync("/usr/bin/sips", ["-s", "format", "jpeg", inputPath, "--out", outputPath]);
      return await fs.readFile(outputPath);
    } catch {
      throw new Error(
        `This HEIC image could not be converted to JPG. Please try exporting it as JPG or PNG. ${
          heicConvertError instanceof Error ? heicConvertError.message : ""
        }`,
      );
    } finally {
      await fs.rm(tempDir, { force: true, recursive: true });
    }
  }
}

async function optimizeAdImage({
  body,
  contentType,
  extension,
  settings,
}: {
  body: Buffer;
  contentType: string;
  extension: string;
  settings: AdCreativeSettings;
}): Promise<OptimizedAdMedia> {
  const sourceBody = isHeicImage(contentType, extension) ? await convertHeicToJpeg(body) : body;

  try {
    const { default: sharp } = await import("sharp");
    const optimizedBody = await sharp(sourceBody, { failOn: "none" })
      .rotate()
      .resize({
        fit: "inside",
        height: settings.height * 2,
        width: settings.width * 2,
        withoutEnlargement: true,
      })
      .jpeg({
        mozjpeg: true,
        quality: AD_IMAGE_JPEG_QUALITY,
      })
      .toBuffer();

    return {
      body: optimizedBody,
      contentType: "image/jpeg",
      extension: "jpg",
      mediaType: "image",
    };
  } catch {
    throw new Error("This image could not be optimized. Please upload JPG, PNG, WebP, HEIC, or HEIF.");
  }
}

function parseFfmpegDuration(output: string) {
  const match = output.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (![hours, minutes, seconds].every(Number.isFinite)) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

async function getVideoDurationSeconds(ffmpegPath: string, inputPath: string) {
  try {
    await execFileAsync(ffmpegPath, ["-i", inputPath], { maxBuffer: 1024 * 1024 });
  } catch (error) {
    const output = [
      error instanceof Error ? error.message : "",
      typeof error === "object" && error && "stderr" in error ? String(error.stderr) : "",
      typeof error === "object" && error && "stdout" in error ? String(error.stdout) : "",
    ].join("\n");
    return parseFfmpegDuration(output);
  }

  return null;
}

async function optimizeAdVideo({
  body,
  settings,
}: {
  body: Buffer;
  settings: AdCreativeSettings;
}): Promise<OptimizedAdMedia> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pawjai-ad-video-"));
  const inputPath = path.join(tempDir, "input");
  const outputPath = path.join(tempDir, "output.mp4");

  try {
    const ffmpegModule = await import("ffmpeg-static");
    const ffmpegPath = ffmpegModule.default;

    if (!ffmpegPath || !(await fileExists(ffmpegPath))) {
      throw new Error(`Video compression is unavailable. Please upload a compressed MP4 under ${settings.maxVideoSeconds} seconds.`);
    }

    await fs.writeFile(inputPath, body);
    const duration = await getVideoDurationSeconds(ffmpegPath, inputPath);
    if (duration !== null && duration > settings.maxVideoSeconds + 0.25) {
      throw new Error(`Ad videos must be ${settings.maxVideoSeconds} seconds or shorter.`);
    }

    await execFileAsync(ffmpegPath, [
      "-y",
      "-i",
      inputPath,
      "-t",
      String(settings.maxVideoSeconds),
      "-an",
      "-vf",
      `scale='if(gt(iw/ih,${settings.width}/${settings.height}),${settings.width * 2},-2)':'if(gt(iw/ih,${settings.width}/${settings.height}),-2,${settings.height * 2})'`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "29",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath,
    ], {
      timeout: 120_000,
    });

    return {
      body: await fs.readFile(outputPath),
      contentType: "video/mp4",
      extension: "mp4",
      mediaType: "video",
    };
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true });
  }
}

export async function optimizeAdMedia(file: File, settings: AdCreativeSettings): Promise<OptimizedAdMedia> {
  const contentType = normalizedMimeType(file);
  const extension = extensionFromName(file.name);
  const body = Buffer.from(await file.arrayBuffer());

  if (isVideoAsset(contentType, extension)) {
    if (!["mp4", "mov"].includes(extension) && contentType !== "video/mp4" && contentType !== "video/quicktime") {
      throw new Error("File must be an MP4 or MOV video.");
    }
    return optimizeAdVideo({ body, settings });
  }

  if (isImageAsset(contentType, extension)) {
    return optimizeAdImage({ body, contentType, extension, settings });
  }

  throw new Error("File must be JPG, PNG, WebP, HEIC, HEIF, MP4, or MOV.");
}
