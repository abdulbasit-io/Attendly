export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

/**
 * Get current position with retry logic and progressive accuracy relaxation.
 * First attempts high accuracy; if that times out, retries with lower accuracy.
 */
export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    let attempt = 0;
    const maxAttempts = 2;

    function attemptGetPosition(enableHighAccuracy: boolean, timeout: number, attemptNum: number) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Accept any position; accuracy requirement is informational only
          // Students may legitimately be far away (different building, outdoor area, etc.)
          if (pos.coords.accuracy > 300000) {
            // Only reject if accuracy is unreasonably bad (> 300km, likely invalid data)
            reject(
              new Error(
                'GPS accuracy is severely degraded. Please ensure location services are enabled and try again.'
              )
            );
            return;
          }
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          // Handle errors with retry logic
          if (err.code === err.TIMEOUT && attemptNum < maxAttempts) {
            // Timeout: retry with lower accuracy requirement and longer timeout
            console.log(`[GPS] Attempt ${attemptNum} timed out, retrying with lower accuracy...`);
            setTimeout(
              () => attemptGetPosition(false, 60000, attemptNum + 1),
              500
            );
            return;
          }

          // Final error after all attempts
          switch (err.code) {
            case err.PERMISSION_DENIED:
              reject(new Error('Location access denied. Please enable location permissions in your browser settings.'));
              break;
            case err.POSITION_UNAVAILABLE:
              reject(new Error('Location unavailable. Ensure location services are enabled on your device. If on a laptop, enable Wi-Fi-based location services.'));
              break;
            case err.TIMEOUT:
              reject(new Error('Location request timed out after multiple attempts. Please ensure GPS/location services are working and try again.'));
              break;
            default:
              reject(new Error('Unable to get your location. Please check your device settings and try again.'));
          }
        },
        { enableHighAccuracy, timeout, maximumAge: 0 }
      );
    }

    // First attempt: high accuracy with 45 second timeout
    attemptGetPosition(true, 45000, 1);
  });
}
