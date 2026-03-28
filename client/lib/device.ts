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

// WebGL GPU parameters — sourced from the hardware chip, identical in every
// browser on the same device. Values like MAX_TEXTURE_SIZE differ between GPU
// models so they meaningfully distinguish different phones.
function getWebGLSignal(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
      ?? canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return 'no-webgl';

    const params = [
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      gl.getParameter(gl.MAX_VARYING_VECTORS),
      gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    ];

    // UNMASKED_RENDERER gives the actual GPU model (e.g. "Adreno (TM) 650",
    // "Apple GPU"). Available in Chrome/Safari; gracefully absent in Firefox.
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      params.push(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
    }

    return params.join(',');
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
