import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_SECRET = process.env.SESSION_SECRET || "super-secure-local-session-secret-for---house-erp-app";
const COOKIE_NAME = "erp_session";

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: "owner" | "accountant" | "auditor";
  companyId: string | null;
}

/**
 * Hash a password using secure PBKDF2 with a unique random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored salt:hash string
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(":");
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
  } catch (error) {
    return false;
  }
}

/**
 * Sign a session payload using HMAC SHA-256 signature
 */
export function signSession(payload: SessionUser): string {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
  return `${Buffer.from(data).toString("base64")}.${signature}`;
}

/**
 * Verify a signed session token
 */
export function verifySession(token: string): SessionUser | null {
  try {
    const [base64Data, signature] = token.split(".");
    if (!base64Data || !signature) return null;
    const data = Buffer.from(base64Data, "base64").toString("utf-8");
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
    if (signature !== expectedSignature) return null;
    return JSON.parse(data) as SessionUser;
  } catch (error) {
    return null;
  }
}

/**
 * Retrieve the current session from Next.js request cookies
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie) return null;
  return verifySession(sessionCookie.value);
}

/**
 * Set the session cookie in Next.js response headers
 */
export async function setSession(user: SessionUser) {
  const token = signSession(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

/**
 * Destroy the session cookie to log out
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
