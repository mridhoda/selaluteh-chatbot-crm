export function buildManagedFileUrl(storedName) {
  return `/files/${storedName}`;
}

export function buildPublicFileUrl(storedName) {
  return `/public-files/${storedName}`;
}

export function extractStoredNameFromUrl(url = '') {
  const match = String(url).match(/\/(?:files|public-files)\/([^/?#]+)/i);
  return match ? match[1] : null;
}
