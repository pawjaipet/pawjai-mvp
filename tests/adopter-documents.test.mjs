import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAdopterDocuments() {
  const source = readFileSync(new URL("../utils/adopter-documents.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({
    exports: module.exports,
    module,
    File,
    FormData,
  });
  return module.exports;
}

function imageFile(name) {
  return new File(["image-bytes"], name, { type: "image/jpeg" });
}

test("appends selected document files from client state into the submitted form data", () => {
  const { syncVerificationFileFields } = loadAdopterDocuments();
  const formData = new FormData();
  const idFile = imageFile("passport.jpg");
  const homePhotos = [imageFile("living-room.jpg"), imageFile("front-yard.jpg")];

  syncVerificationFileFields(formData, { idFile, homePhotos });

  assert.equal(formData.get("idFile"), idFile);
  assert.deepEqual(formData.getAll("homePhotos"), homePhotos);
});

test("rejects more than five home environment uploads", () => {
  const { collectHomePhotoFiles, MAX_HOME_PHOTOS } = loadAdopterDocuments();
  const formData = new FormData();

  for (let index = 0; index < MAX_HOME_PHOTOS + 1; index += 1) {
    formData.append("homePhotos", imageFile(`home-${index}.jpg`));
  }

  const result = collectHomePhotoFiles(formData);

  assert.equal(result.files.length, 0);
  assert.match(result.error, /no more than 5/i);
});

test("replaces file fields with uploaded document metadata for server actions", () => {
  const { setUploadedDocumentFields } = loadAdopterDocuments();
  const formData = new FormData();
  formData.append("idFile", imageFile("passport.jpg"));
  formData.append("homePhotos", imageFile("living-room.jpg"));

  setUploadedDocumentFields(formData, [
    {
      documentType: "id_copy",
      mimeType: "image/jpeg",
      originalFileName: "passport.jpg",
      storagePath: "user/adopter/id_copy.jpg",
    },
    {
      documentType: "house_image",
      mimeType: "image/jpeg",
      originalFileName: "living-room.jpg",
      storagePath: "user/adopter/living-room.jpg",
    },
  ]);

  assert.equal(formData.get("idFile"), null);
  assert.deepEqual(formData.getAll("homePhotos"), []);
  assert.deepEqual(JSON.parse(String(formData.get("uploadedDocuments"))), [
    {
      documentType: "id_copy",
      mimeType: "image/jpeg",
      originalFileName: "passport.jpg",
      storagePath: "user/adopter/id_copy.jpg",
    },
    {
      documentType: "house_image",
      mimeType: "image/jpeg",
      originalFileName: "living-room.jpg",
      storagePath: "user/adopter/living-room.jpg",
    },
  ]);
});

test("parses uploaded document metadata and ignores invalid records", () => {
  const { parseUploadedDocumentMetadata } = loadAdopterDocuments();
  const formData = new FormData();
  formData.set("uploadedDocuments", JSON.stringify([
    {
      documentType: "id_copy",
      mimeType: "image/jpeg",
      originalFileName: "passport.jpg",
      storagePath: "user/adopter/id_copy.jpg",
    },
    {
      documentType: "bad_type",
      mimeType: "image/jpeg",
      originalFileName: "bad.jpg",
      storagePath: "user/adopter/bad.jpg",
    },
    {
      documentType: "house_image",
      mimeType: "application/pdf",
      originalFileName: "home.pdf",
      storagePath: "user/adopter/home.pdf",
    },
  ]));

  assert.equal(JSON.stringify(parseUploadedDocumentMetadata(formData)), JSON.stringify([
    {
      documentType: "id_copy",
      mimeType: "image/jpeg",
      originalFileName: "passport.jpg",
      storagePath: "user/adopter/id_copy.jpg",
    },
    {
      documentType: "house_image",
      mimeType: "application/pdf",
      originalFileName: "home.pdf",
      storagePath: "user/adopter/home.pdf",
    },
  ]));
});
