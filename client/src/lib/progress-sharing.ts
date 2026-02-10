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
  watched: Set<number>,
  maxEpisodeId: number,
  progressParam: string,
  seriesParam: string
): string {
  const encoded = encodeProgress(watched, maxEpisodeId);
  const base = window.location.origin + window.location.pathname;
  if (seriesParam === 'naruto') {
    return `${base}?${progressParam}=${encoded}`;
  }
  return `${base}?s=${seriesParam}&${progressParam}=${encoded}`;
}

/**
 * Remove the progress parameter from the URL without reload.
 */
export function clearProgressFromURL(progressParam: string): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(progressParam);
  url.searchParams.delete('s');
  const search = url.searchParams.toString();
  window.history.replaceState({}, '', url.pathname + (search ? `?${search}` : ''));
}
