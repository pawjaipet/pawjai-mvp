import { prepareDogMediaUpload } from "@/app/admin/dogs/new/media-upload";

export async function stageDogMedia(formData: FormData, onProgress: (message: string) => void) {
  const files = formData.getAll("media_files").filter((value): value is File => value instanceof File && value.size > 0);
  const staged: { path: string; name: string; type: string }[] = [];
  const keyMap = new Map<string, string>();
  const warnings: string[] = [];
  for (const [index, file] of files.entries()) {
    try {
    const target = await prepareDogMediaUpload(String(formData.get("shelter_id") ?? ""), file.name, file.size);
    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("PUT", target.signedUrl);
      request.timeout = 180000;
      request.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      request.upload.onprogress = (event) => {
        const percent = event.lengthComputable ? Math.round(event.loaded / event.total * 100) : 0;
        onProgress(`Uploading ${index + 1} of ${files.length}: ${file.name} (${percent}%)`);
      };
      request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`${file.name}: upload failed. Please try again.`));
      request.onerror = () => reject(new Error(`${file.name}: connection lost during upload. Please try again.`));
      request.ontimeout = () => reject(new Error(`${file.name}: upload timed out. Please try again.`));
      request.send(file);
    });
      keyMap.set(`file-${index}`, `file-${staged.length}`);
      staged.push({ path: target.path, name: file.name, type: file.type });
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `${file.name}: upload failed.`);
    }
  }
  const order = formData.getAll("media_order").map((key) => keyMap.get(String(key))).filter((key): key is string => Boolean(key));
  formData.delete("media_order");
  order.forEach((key) => formData.append("media_order", key));
  formData.set("cover_media_key", keyMap.get(String(formData.get("cover_media_key"))) ?? order[0] ?? "");
  if (warnings.length) {
    formData.set("media_upload_warning", warnings.join(" "));
    formData.set("adoption_status", "draft");
  }
  formData.delete("media_files");
  formData.set("staged_media", JSON.stringify(staged));
  onProgress(files.some((file) => /\.(mp4|mov)$/i.test(file.name)) ? "Upload complete. Compressing video and saving the profile..." : "Saving profile...");
}
