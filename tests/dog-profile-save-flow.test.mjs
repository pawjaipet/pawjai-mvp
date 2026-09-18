import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("admin create form lets server-side video compression run instead of blocking on warnings", () => {
  const createForm = source("../app/admin/dogs/new/DogListingForm.tsx");

  assert.match(createForm, /const \[mediaError, setMediaError\] = useState\(""\)/);
  assert.match(createForm, /const \[mediaWarning, setMediaWarning\] = useState\(""\)/);
  assert.match(createForm, /CLIENT_MAX_VIDEO_UPLOAD_BYTES = 50 \* 1024 \* 1024/);
  assert.match(createForm, /SUPPORTED_VIDEO_EXTENSIONS = new Set\(\["mov", "mp4"\]\)/);
  assert.match(createForm, /SUPPORTED_VIDEO_MIME_TYPES = new Set\(\["video\/mp4", "video\/quicktime"\]\)/);
  assert.match(createForm, /Upload JPG, PNG, WEBP, HEIC, MP4, or MOV/);
  assert.match(createForm, /isSupportedVideoFile\(item\.file\) \? \("video" as const\) : \("photo" as const\)/);
  assert.match(createForm, /setMediaWarning\(warnings\.join\(" "\)\)/);
  assert.match(createForm, /disabled=\{pending \|\| mediaPreparing \|\| Boolean\(mediaError\)\}/);
  assert.doesNotMatch(createForm, /disabled=\{pending \|\| mediaPreparing \|\| Boolean\(mediaWarning\)\}/);
  assert.match(createForm, /PawJai compresses videos on the server after upload/);
  assert.match(createForm, /Uploading and compressing video/);
  assert.match(createForm, /compressing the video on the server/);
  assert.match(createForm, /Required/);
});

test("admin edit form treats oversized photo preparation feedback as a warning when possible", () => {
  const editForm = source("../app/admin/dogs/[id]/edit/DogEditForm.tsx");

  assert.match(editForm, /const \[newPhotoUploadError, setNewPhotoUploadError\] = useState\(""\)/);
  assert.match(editForm, /const \[newPhotoUploadWarning, setNewPhotoUploadWarning\] = useState\(""\)/);
  assert.match(editForm, /setNewPhotoUploadWarning\(warnings\.join\(" "\)\)/);
  assert.match(editForm, /disabled=\{pending \|\| newPhotosPreparing \|\| Boolean\(newPhotoUploadError\)\}/);
  assert.doesNotMatch(editForm, /disabled=\{pending \|\| newPhotosPreparing \|\| Boolean\(newPhotoUploadWarning\)\}/);
});

test("dog creation publishes only after media processing succeeds", () => {
  const actions = source("../app/admin/dogs/new/actions.ts");

  assert.match(actions, /const requestedAdoptionStatus = getEnumValue/);
  assert.match(actions, /const initialAdoptionStatus = requestedAdoptionStatus === "available" \? "draft" : requestedAdoptionStatus/);
  assert.match(actions, /adoption_status: initialAdoptionStatus/);
  assert.match(actions, /\.update\(\{ adoption_status: requestedAdoptionStatus \}\)/);
  assert.match(actions, /VIDEO_EXTENSIONS = new Set\(\["\.mov", "\.mp4"\]\)/);
  assert.match(actions, /VIDEO_MIME_TYPES = new Set\(\["video\/mp4", "video\/quicktime"\]\)/);
  assert.match(actions, /VIDEO_EXTENSIONS\.has\(extension\)/);
  assert.match(actions, /The dog was saved as a draft so it is not public yet/);
  assert.match(actions, /publishState: "draft"/);
  assert.match(actions, /const publishState = requestedAdoptionStatus === "available" \? "published" : "draft"/);
  assert.match(actions, /Dog listing published successfully\. It is live on the public dog profile\./);
  assert.match(actions, /newDogId/);
  assert.match(actions, /newDogState/);
  assert.match(actions, /Upload an MP4 or MOV video under 50MB/);
  assert.match(actions, /DOG_MEDIA_BUCKET_FILE_SIZE_LIMIT_BYTES = 25 \* 1024 \* 1024/);
  assert.match(actions, /The compressed video is still/);
  assert.match(actions, /Video compression is unavailable on the server/);
  assert.doesNotMatch(actions, /contentType === "video\/mp4"\) return body/);
  assert.match(actions, /revalidatePath\("\/dogs"\)/);
  assert.match(actions, /revalidatePath\(`\/dogs\/\$\{insertedDog\.id\}`\)/);
});

test("workspace save banner links to the saved dog and shows visibility state", () => {
  const panel = source("../components/admin/AdminReorgDraftPanel.tsx");
  const shelterPage = source("../app/shelter/[slug]/page.tsx");
  const adminPage = source("../app/admin/AdminWorkspacePage.tsx");

  assert.match(panel, /initialMessageDogId/);
  assert.match(panel, /initialMessageDogState/);
  assert.match(panel, /Open live public profile/);
  assert.match(panel, /Open saved draft/);
  assert.match(shelterPage, /newDogId/);
  assert.match(shelterPage, /newDogState/);
  assert.match(adminPage, /newDogId/);
  assert.match(adminPage, /newDogState/);
});

test("public dog listings remain dynamic and only show available profiles", () => {
  const dogsPage = source("../app/dogs/page.tsx");
  const feedPage = source("../components/dogs/DogFeedPage.tsx");

  assert.match(dogsPage, /export const dynamic = "force-dynamic"/);
  assert.match(feedPage, /\.eq\("adoption_status", "available"\)/);
  assert.match(feedPage, /\.order\("created_at", \{ ascending: false \}\)/);
});
