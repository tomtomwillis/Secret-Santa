// Encodes a person's result into a link, so no server is needed.
// The data is scrambled (not encrypted) so it can't be read just by looking at the link.

const KEY = new TextEncoder().encode('ho-ho-ho-secret-santa');

function xor(bytes) {
  return bytes.map((b, i) => b ^ KEY[i % KEY.length]);
}

function toBase64Url(bytes) {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/**
 * @param {{ group: string, names: string[], from: number, to: number }} data
 * @returns {string} the encoded payload for the URL hash
 */
export function encode({ group, names, from, to }) {
  const json = JSON.stringify({ v: 1, g: group, n: names, f: from, t: to });
  return toBase64Url(xor(new TextEncoder().encode(json)));
}

/**
 * @param {string} payload  the URL hash without '#'
 * @returns {{ group: string, names: string[], from: number, to: number } | null}
 */
export function decode(payload) {
  try {
    const json = new TextDecoder('utf-8', { fatal: true }).decode(xor(fromBase64Url(payload)));
    const d = JSON.parse(json);
    const valid =
      d && d.v === 1 && typeof d.g === 'string' &&
      Array.isArray(d.n) && d.n.length >= 2 && d.n.every((x) => typeof x === 'string') &&
      Number.isInteger(d.f) && Number.isInteger(d.t) &&
      d.f >= 0 && d.f < d.n.length && d.t >= 0 && d.t < d.n.length && d.f !== d.t;
    return valid ? { group: d.g, names: d.n, from: d.f, to: d.t } : null;
  } catch {
    return null;
  }
}

/** Full reveal URL for a payload, based on wherever this site is hosted. */
export function revealUrl(payload) {
  const url = new URL('reveal.html', location.href);
  url.hash = payload;
  return url.href;
}
