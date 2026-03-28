const DEVICE_ID_KEY = 'attendly_device_id';

// FNV-1a 64-bit hash — no dependencies, 16 hex chars, ~18 quintillion possible
// values. Uses BigInt for the 64-bit multiply; supported in all modern browsers.
function fnv1a(str: string): string {
  let hash = 14695981039346656037n; // 64-bit offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = BigInt.asUintN(64, hash * 1099511628211n); // 64-bit FNV prime
  }
  return hash.toString(16).padStart(16, '0');
}

// Only MAX_TEXTURE_SIZE and MAX_RENDERBUFFER_SIZE are hardware-capped values —
// every other WebGL param is set by the browser's own implementation and differs
// between Chrome/Firefox/Safari on the same device. These two are consistent
// across all browsers and vary meaningfully between GPU generations.
function getWebGLSignal(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
      ?? canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return 'no-webgl';
    return [
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    ].join(',');
  } catch {
    return 'webgl-error';
  }
}

// Hardware-only signals — identical across all browsers on the same device.
// userAgent and language are intentionally excluded: they differ between
// Chrome/Firefox/Safari on the same phone, which would allow cross-browser bypass.
function generateFingerprint(): string {
  const parts = [
    `${screen.width}x${screen.height}x${screen.colorDepth}x${screen.pixelDepth}`,
    String(window.devicePixelRatio ?? 1),
    String(navigator.hardwareConcurrency ?? 0),
    String(navigator.maxTouchPoints ?? 0),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    getWebGLSignal(),
  ];
  return fnv1a(parts.join('|'));
}

// Persistent UUID — survives across sessions on the same browser profile
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// Hardware fingerprint — consistent across incognito and localStorage clears
export function getDeviceFingerprint(): string {
  return generateFingerprint();
}
