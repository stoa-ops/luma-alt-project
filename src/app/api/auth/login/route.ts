import { NextResponse } from "next/server";
import { z } from "zod";
import { createMagicLink } from "@/lib/auth/session";

const Body = z.object({ email: z.email() });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const result = await createMagicLink(parsed.data.email);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Unable to create magic link", error);
    return NextResponse.json(
      { error: "Sign-in email could not be sent. Try again shortly." },
      { status: 503 }
    );
  }
}
