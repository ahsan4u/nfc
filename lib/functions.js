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
