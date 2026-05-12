export const MAX_HOME_PHOTOS = 5;

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
