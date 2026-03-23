export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos.coords.accuracy > 200) {
          reject(
            new Error(
              'GPS accuracy is too low. Enable Wi-Fi or move to an open area and try again.'
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
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location access denied. Please enable location permissions.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Please check your GPS or Wi-Fi.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('Unable to get your location.'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}
