import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  findSubscriber,
  saveSubscriber,
} from "@/lib/db.mjs";
import { mailConfigured, sendMail } from "@/lib/mail.mjs";
import { absoluteUrl, site } from "@/lib/site";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const back = new URL("/subscribe/sent", request.url);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    back.searchParams.set("status", "invalid");
    return NextResponse.redirect(back, 303);
  }

  const existing = findSubscriber(email);
  if (existing?.status === "confirmed") {
    back.searchParams.set("status", "confirmed");
    return NextResponse.redirect(back, 303);
  }
  if (existing?.status === "unsubscribed") {
    const subscriber = saveSubscriber(email, token(), token());
    back.searchParams.set(
      "status",
      await sendConfirmation(subscriber.email, subscriber.confirm_token),
    );
    return NextResponse.redirect(back, 303);
  }

  const subscriber = saveSubscriber(
    email,
    existing?.confirm_token || token(),
    existing?.unsubscribe_token || token(),
  );
  back.searchParams.set(
    "status",
    await sendConfirmation(subscriber.email, subscriber.confirm_token),
  );
  return NextResponse.redirect(back, 303);
}

async function sendConfirmation(email: string, confirmToken: string) {
  if (!mailConfigured()) return "saved";
  const confirmUrl = absoluteUrl(`/subscribe/confirm?token=${confirmToken}`);
  const result = await sendMail({
    to: email,
    subject: `Confirm the ${site.name} daily digest`,
    text: `Confirm the daily digest for ${site.name}:\n${confirmUrl}\n\nIf you did not ask for this, ignore the note.`,
    html: `<p>Confirm the daily digest for ${escapeHtml(site.name)}.</p><p><a href="${confirmUrl}">Confirm this address</a></p><p>If you did not ask for this, ignore the note.</p>`,
  });
  return result.ok ? "sent" : "held";
}

function token() {
  return randomBytes(24).toString("hex");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
