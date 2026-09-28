/** Only https links are rendered or stored (mirrors the Firestore rules). */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:" && !/\s/.test(value);
  } catch {
    return false;
  }
}

export function safeHref(value: string | undefined | null): string | undefined {
  return value && isHttpsUrl(value) ? value : undefined;
}

export function isGoogleDriveUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname;
    return host === "drive.google.com" || host === "docs.google.com";
  } catch {
    return false;
  }
}

/** Extracts a Drive file id from the common share-link formats. */
export function driveFileId(value: string): string | null {
  if (!isGoogleDriveUrl(value)) return null;
  const url = new URL(value);
  const byPath = url.pathname.match(/\/(?:file\/)?d\/([A-Za-z0-9_-]{10,})/);
  if (byPath) return byPath[1];
  const byParam = url.searchParams.get("id");
  return byParam && /^[A-Za-z0-9_-]{10,}$/.test(byParam) ? byParam : null;
}

/**
 * Drive "share" links point at an HTML page, not an image. Convert them to the
 * thumbnail endpoint so they can be used as a preview image. The file must be
 * shared as "Anyone with the link" for clients to see it.
 */
export function toPreviewImageUrl(value: string): string {
  const id = driveFileId(value);
  if (id && !value.includes("/thumbnail")) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }
  return value;
}
