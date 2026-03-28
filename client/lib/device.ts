const DEVICE_ID_KEY = 'attendly_device_id';

// FNV-1a 32-bit hash — fast, no dependencies, consistent
function fnv1a(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

// Hardware-only signals — identical across all browsers on the same device.
// userAgent and language are intentionally excluded: they differ between
// Chrome/Firefox/Safari on the same phone, which would allow cross-browser bypass.
function generateFingerprint(): string {
  const parts = [
    `${screen.width}x${screen.height}x${screen.colorDepth}x${screen.pixelDepth}`,
    String(navigator.hardwareConcurrency ?? 0),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.platform,
    String(navigator.maxTouchPoints ?? 0),
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
