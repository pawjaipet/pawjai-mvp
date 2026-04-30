import "server-only";

function toBase64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=+$/g, "");
}

function isOneDriveUrl(url: URL) {
  return (
    url.hostname.includes("1drv.ms") ||
    url.hostname.includes("onedrive.live.com") ||
    url.hostname.includes("sharepoint.com")
  );
}

export async function fetchRemoteAsset(sourceUrl: string) {
  const parsed = new URL(sourceUrl);

  if (isOneDriveUrl(parsed)) {
    const shareId = `u!${toBase64Url(sourceUrl)}`;
    const directUrl = `https://api.onedrive.com/v1.0/shares/${shareId}/root/content`;
    const response = await fetch(directUrl, {
      method: "GET",
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`OneDrive download failed with status ${response.status}.`);
    }

    return response;
  }

  const response = await fetch(sourceUrl, {
    method: "GET",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status}.`);
  }

  return response;
}
