/**
 * Haversine formula — distance between two GPS coordinates in meters.
 * Includes validation to catch coordinate errors early.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  // Convert Decimal objects to numbers if needed
  const lat1Num = typeof lat1 === 'object' ? Number(lat1) : Number(lat1);
  const lon1Num = typeof lon1 === 'object' ? Number(lon1) : Number(lon1);
  const lat2Num = typeof lat2 === 'object' ? Number(lat2) : Number(lat2);
  const lon2Num = typeof lon2 === 'object' ? Number(lon2) : Number(lon2);

  // Validate coordinates are in valid ranges
  if (!isValidCoordinate(lat1Num, lon1Num) || !isValidCoordinate(lat2Num, lon2Num)) {
    const err = new Error(
      `Invalid GPS coordinates: ` +
      `session(${lat1Num},${lon1Num}) student(${lat2Num},${lon2Num})`
    );
    err.code = 'INVALID_COORDS';
    throw err;
  }

  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2Num - lat1Num);
  const dLon = toRad(lon2Num - lon1Num);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1Num)) * Math.cos(toRad(lat2Num)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Log warning for unusually large distances (likely data errors)
  if (distance > 2000) {
    console.warn(
      `[GPS] Unusually large distance calculated: ${Math.round(distance)}m ` +
      `from [${lat1Num},${lon1Num}] to [${lat2Num},${lon2Num}]`
    );
  }

  return distance;
}

/**
 * Validate that coordinates are within valid GPS ranges.
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
function isValidCoordinate(lat, lon) {
  const isValidLat = typeof lat === 'number' && lat >= -90 && lat <= 90 && !isNaN(lat);
  const isValidLon = typeof lon === 'number' && lon >= -180 && lon <= 180 && !isNaN(lon);
  return isValidLat && isValidLon;
}

module.exports = { haversineDistance };
