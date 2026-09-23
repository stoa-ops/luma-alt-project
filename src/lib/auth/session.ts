import "server-only";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { Resend } from "resend";
import { db, schema } from "@/lib/db/client";

const COOKIE_NAME = "luma_session";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const MAGIC_LINK_TTL_MS = 1000 * 60 * 15; // 15 minutes

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET must be set");
  return s;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function verify(value: string, signature: string) {
  const expected = sign(value);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isAllowedAdmin(email: string) {
  const configured = process.env.ADMIN_EMAIL_ALLOWLIST;
  if (!configured) {
    return process.env.NODE_ENV !== "production" && email === "admin@example.com";
  }

  return configured
    .split(",")
    .map(normalizeEmail)
    .includes(email);
}

function hashMagicToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createMagicLink(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedAdmin(normalizedEmail)) return {};

  const isProduction = process.env.NODE_ENV === "production";
  const appUrl = process.env.APP_URL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (isProduction && (!appUrl || !apiKey || !from)) {
    throw new Error(
      "APP_URL, RESEND_API_KEY, and AUTH_EMAIL_FROM must be set in production"
    );
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashMagicToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);
  await db.insert(schema.magicLinks).values({
    tokenHash,
    email: normalizedEmail,
    expiresAt,
  });

  const base = appUrl ?? "http://localhost:3000";
  const url = `${base}/api/auth/callback?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
  if (!isProduction) {
    console.log(`\n[auth] magic link for ${normalizedEmail}:\n  ${url}\n`);
    return { devUrl: url };
  }

  if (!apiKey || !from) throw new Error("Email delivery is not configured");

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: normalizedEmail,
    subject: "Sign in to Luma Alt",
    text: `Use this link to sign in. It expires in 15 minutes:\n\n${url}`,
  });
  if (error) {
    await db
      .delete(schema.magicLinks)
      .where(eq(schema.magicLinks.tokenHash, tokenHash));
    throw new Error(`Unable to send magic link: ${error.message}`);
  }

  return {};
}

export async function consumeMagicLink(token: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedAdmin(normalizedEmail)) return null;

  const tokenHash = hashMagicToken(token);
  const consumed = await db
    .update(schema.magicLinks)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(schema.magicLinks.tokenHash, tokenHash),
        eq(schema.magicLinks.email, normalizedEmail),
        isNull(schema.magicLinks.consumedAt),
        gt(schema.magicLinks.expiresAt, new Date())
      )
    )
    .returning();
  if (consumed.length === 0) return null;

  await db
    .insert(schema.users)
    .values({ email: normalizedEmail })
    .onConflictDoNothing({ target: schema.users.email });

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalizedEmail))
    .limit(1);
  return user ?? null;
}

export async function createSession(userId: string) {
  const value = `${userId}.${Date.now()}`;
  const signature = sign(value);
  const token = `${value}.${signature}`;

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_MS / 1000,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  if (!verify(`${userId}.${ts}`, sig)) return null;
  const createdAt = Number(ts);
  if (!Number.isFinite(createdAt)) return null;
  if (createdAt > Date.now() || Date.now() - createdAt > TOKEN_TTL_MS) return null;

  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}
