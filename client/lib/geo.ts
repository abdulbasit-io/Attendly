export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type GeoCaptureOptions = {
  maxAccuracyM?: number;
  attempts?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get current position with retry logic and an accuracy threshold.
 * Returns the best reading it can get within the configured attempts.
 */
export async function getCurrentPosition(options: GeoCaptureOptions = {}): Promise<GeoPosition> {
  const {
    maxAccuracyM = Number.POSITIVE_INFINITY,
    attempts = 3,
    timeoutMs = 60000,
    retryDelayMs = 750,
  } = options;

  let best: GeoPosition | null = null;

  async function captureOnce(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              reject(new Error('Location access denied. Please enable location permissions in your browser settings.'));
              break;
            case err.POSITION_UNAVAILABLE:
              reject(new Error('Location unavailable. Ensure location services are enabled on your device. If on a laptop, enable Wi-Fi-based location services.'));
              break;
            case err.TIMEOUT:
              reject(new Error('Location request timed out. Try again with better GPS signal or move closer to a window/outdoors.'));
              break;
            default:
              reject(new Error('Unable to get your location. Please check your device settings and try again.'));
          }
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
      );
    });
  }

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const position = await captureOnce();

      if (!best || position.accuracy < best.accuracy) {
        best = position;
      }

      if (position.accuracy <= maxAccuracyM) {
        return position;
      }
    } catch (err) {
      if (attempt === attempts) {
        throw err;
      }
    }

    if (attempt < attempts) {
      await delay(retryDelayMs);
    }
  }

  const bestAccuracy = best ? Math.round(best.accuracy) : null;
  throw new Error(
    bestAccuracy === null
      ? 'Unable to get a usable location fix. Please try again in a clearer GPS environment.'
      : `We could not get a precise enough location fix. Best reading was ±${bestAccuracy}m. Move outdoors, enable precise location, or try again near a window.`
  );
}
