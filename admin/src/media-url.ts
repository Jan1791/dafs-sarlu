export function getLocalMediaUrl(storagePath: string) {
  const path = storagePath.slice("local:".length);
  const publicSiteUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return publicSiteUrl ? `${publicSiteUrl}${path}` : path;
}
