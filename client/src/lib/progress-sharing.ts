/**
 * Progress sharing via URL encoding.
 * Encodes watched episode IDs as a compact bitfield in URL-safe base64.
 * Series-aware: each series has its own maxEpisodeId and URL param.
 */

/**
 * Encode a watched set into a compact URL-safe base64 string.
 */
export function encodeProgress(watched: Set<number>, maxEpisodeId: number): string {
  const byteCount = Math.ceil(maxEpisodeId / 8);
  const bytes = new Uint8Array(byteCount);
  for (const id of watched) {
    if (id >= 1 && id <= maxEpisodeId) {
      const byteIndex = Math.floor((id - 1) / 8);
      const bitIndex = (id - 1) % 8;
      bytes[byteIndex] |= 1 << bitIndex;
    }
  }
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode a URL-safe base64 string back into a watched set.
 */
export function decodeProgress(encoded: string, maxEpisodeId: number): Set<number> {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const watched = new Set<number>();
    for (let id = 1; id <= maxEpisodeId; id++) {
      const byteIndex = Math.floor((id - 1) / 8);
      const bitIndex = (id - 1) % 8;
      if (byteIndex < bytes.length && bytes[byteIndex] & (1 << bitIndex)) {
        watched.add(id);
      }
    }
    return watched;
  } catch {
    return new Set<number>();
  }
}

/**
 * Extract progress parameter from the current URL.
 */
export function getProgressFromURL(paramName: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(paramName);
}

/**
 * Generate a shareable URL with encoded progress.
 */
export function generateShareURL(
  encoded: string | null,
  progressParam: string,
  seriesParam: string
): string {
  const url = new URL(window.location.pathname, window.location.origin);
  if (seriesParam !== 'naruto') url.searchParams.set('s', seriesParam);
  if (encoded) {
    url.searchParams.set(progressParam, encoded);
  }
  return url.href;
}

/**
 * Remove the progress parameter from the URL without reload.
 */
export function clearProgressFromURL(progressParam: string, seriesParam: string): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(progressParam);
  // Older Boruto links identify the series only through the progress parameter.
  if (seriesParam !== 'naruto') url.searchParams.set('s', seriesParam);
  window.history.replaceState(window.history.state, '', url);
}
