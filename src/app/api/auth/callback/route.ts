import { NextResponse } from "next/server";
import { consumeMagicLink, createSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=missing", req.url));
  }

  const user = await consumeMagicLink(token, email);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid", req.url));
  }
  await createSession(user.id);
  return NextResponse.redirect(new URL("/admin", req.url));
}
