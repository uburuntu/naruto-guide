/**
 * Progress sharing via URL encoding.
 * Encodes watched episode IDs as a compact bitfield in URL-safe base64.
 * 175 episodes = 22 bytes = ~30 chars in base64.
 */

const MAX_EPISODE_ID = 175;
const BYTE_COUNT = Math.ceil(MAX_EPISODE_ID / 8);

/**
 * Encode a watched set into a compact URL-safe base64 string.
 */
export function encodeProgress(watched: Set<number>): string {
  const bytes = new Uint8Array(BYTE_COUNT);
  for (const id of watched) {
    if (id >= 1 && id <= MAX_EPISODE_ID) {
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
export function decodeProgress(encoded: string): Set<number> {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const watched = new Set<number>();
    for (let id = 1; id <= MAX_EPISODE_ID; id++) {
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
export function getProgressFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('p');
}

/**
 * Generate a shareable URL with encoded progress.
 */
export function generateShareURL(watched: Set<number>): string {
  const encoded = encodeProgress(watched);
  const base = window.location.origin + window.location.pathname;
  return `${base}?p=${encoded}`;
}

/**
 * Remove the progress parameter from the URL without reload.
 */
export function clearProgressFromURL(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('p');
  window.history.replaceState({}, '', url.pathname);
}
