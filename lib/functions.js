/**
 * Helper functions for Nawab Sahab Cafe (NFC)
 */
import blobUrls from "./blob-urls.json";

/**
 * Resolves a local path (e.g. /icons/logo2.png) to its Vercel Blob URL.
 * Falls back to local path if not in map.
 * @param {string} localPath
 * @returns {string}
 */
export function getBlobUrl(localPath) {
  if (!localPath) return "";
  if (localPath.startsWith("http://") || localPath.startsWith("https://")) {
    return localPath;
  }
  const formattedPath = localPath.startsWith("/") ? localPath : `/${localPath}`;
  return blobUrls[formattedPath] || localPath;
}

/**
 * Formats a numeric price into a currency string with the Rupee symbol.
 * @param {number|string} price - The price of the dish
 * @returns {string} The formatted price
 */
export function formatPrice(price) {
  return `${price}₹`;
}

/**
 * Generates the expected image URL for a dish based on its name,
 * and provides a fallback category image URL if the main image is missing.
 * Resolves to Vercel Blob CDN URLs.
 * @param {string} dishName - The name of the dish
 * @param {string} categoryKey - The key/image identifier for the category
 * @returns {{dishImgUrl: string, fallbackImgUrl: string}} Image URLs
 */
export function getDishImageUrl(dishName, categoryKey) {
  const dishFileName = dishName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_+|_+$)/g, "");
  
  const dishPath = `/images/dishes/${dishFileName}.png`;
  const fallbackPath = `/images/categories/${categoryKey}.png`;

  return {
    dishImgUrl: getBlobUrl(dishPath),
    fallbackImgUrl: getBlobUrl(fallbackPath)
  };
}

/**
 * Filters the list of dishes by category.
 * @param {Array} dishesList - The full array of dishes
 * @param {string} category - The active category filter
 * @returns {Array} Filtered list of dishes
 */
export function filterDishes(dishesList, category) {
  if (!category || category === "All") {
    return dishesList;
  }
  return dishesList.filter((item) => item.head === category);
}

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using Haversine formula.
 * @param {number} lat1 - Point 1 Latitude
 * @param {number} lon1 - Point 1 Longitude
 * @param {number} lat2 - Point 2 Latitude
 * @param {number} lon2 - Point 2 Longitude
 * @returns {number|null} Distance in KM
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const p1Lat = Number(lat1);
  const p1Lon = Number(lon1);
  const p2Lat = Number(lat2);
  const p2Lon = Number(lon2);
  if (isNaN(p1Lat) || isNaN(p1Lon) || isNaN(p2Lat) || isNaN(p2Lon)) return null;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((p2Lat - p1Lat) * Math.PI) / 180;
  const dLon = ((p2Lon - p1Lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1Lat * Math.PI) / 180) *
      Math.cos((p2Lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place (e.g. 3.4 km)
}

export function parseGrams(str) {
  if (!str) return 0;
  const s = String(str).toLowerCase().trim();
  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  if (s.includes("kg")) {
    return Math.round(num * 1000);
  }
  return Math.round(num);
}

/**
 * Formats weight batch count into readable grams / kg string (e.g. 250g, 500g, 1 Kg, 1.5 Kg).
 * @param {number} batches - Number of batches
 * @param {number|string} stepGrams - Grams per batch (e.g. 250)
 * @param {string} unitLabel - Custom unit label
 * @returns {string} Formatted weight string
 */
export function formatWeightDisplay(batches, stepGrams = 250, unitLabel = "") {
  if (!batches || batches <= 0) return "";
  const numericStep = parseInt(stepGrams) || 250;
  const totalGrams = batches * numericStep;

  if (totalGrams >= 1000) {
    const inKg = totalGrams / 1000;
    if (totalGrams % 1000 === 0) {
      return `${inKg} Kg`;
    }
    return `${inKg.toFixed(2).replace(/\.?0+$/, '')} Kg (${totalGrams}g)`;
  }
  return `${totalGrams}g`;
}

