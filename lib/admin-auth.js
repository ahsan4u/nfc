import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.ADMIN || 'Nawab.Sahab@18';

/**
 * Computes a secure SHA-256 HMAC hash for a given string
 */
export function hashString(value) {
  return crypto.createHmac('sha256', SECRET_KEY).update(value).digest('hex');
}

/**
 * Generates the expected admin authentication session token
 */
export function getAdminSessionToken() {
  return hashString('nfc_admin_authenticated_session_token');
}

/**
 * Verifies if the provided password matches the ADMIN environment setting
 */
export function verifyAdminPassword(password) {
  const adminPassword = process.env.ADMIN || 'Nawab.Sahab@18';
  return password === adminPassword;
}

/**
 * Checks whether the current request holds a valid admin session cookie
 */
export async function isAdminAuthenticated() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('nfc_admin_session')?.value;
    if (!sessionCookie) return false;
    return sessionCookie === getAdminSessionToken();
  } catch {
    return false;
  }
}
