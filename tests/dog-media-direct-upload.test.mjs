import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

test("a failed video upload preserves successful photos and remaps their cover order", async () => {
  const source = readFileSync(new URL("../utils/dog-media-direct-upload.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  class Upload {
    upload = {};
    status = 200;
    open() {}
    setRequestHeader() {}
    send(file) {
      this.upload.onprogress({ lengthComputable: true, loaded: file.size, total: file.size });
      this.onload();
    }
  }
  new Script(js).runInNewContext({ module, exports: module.exports, File, Error, XMLHttpRequest: Upload, require: () => ({
    prepareDogMediaUpload: async (_shelter, name) => {
      if (name.endsWith(".mov")) throw new Error("Video connection failed");
      return { path: `shelter/user/${name}`, signedUrl: "https://storage.example/upload" };
    },
  }) });
  const data = new FormData();
  data.set("shelter_id", "shelter");
  data.set("adoption_status", "available");
  data.append("media_files", new File(["video"], "clip.mov", { type: "video/quicktime" }));
  data.append("media_files", new File(["photo"], "photo.jpg", { type: "image/jpeg" }));
  data.append("media_order", "file-0");
  data.append("media_order", "file-1");
  data.set("cover_media_key", "file-0");
  await module.exports.stageDogMedia(data, () => {});
  assert.equal(data.get("adoption_status"), "draft");
  assert.equal(data.get("media_upload_warning"), "Video connection failed");
  assert.equal(data.getAll("media_files").length, 0);
  assert.equal(JSON.parse(data.get("staged_media"))[0].name, "photo.jpg");
  assert.deepEqual(data.getAll("media_order"), ["file-0"]);
  assert.equal(data.get("cover_media_key"), "file-0");
});
