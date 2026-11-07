import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  findSubscriber,
  saveSubscriber,
} from "@/lib/db.mjs";
import { mailConfigured, sendMail } from "@/lib/mail.mjs";
import { absoluteUrl, digestSentUrl, site } from "@/lib/site";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(digestSentUrl("invalid"), 303);
  }

  const existing = findSubscriber(email);
  if (existing?.status === "confirmed") {
    return NextResponse.redirect(digestSentUrl("confirmed"), 303);
  }
  if (existing?.status === "unsubscribed") {
    const subscriber = saveSubscriber(email, token(), token());
    return NextResponse.redirect(
      digestSentUrl(await sendConfirmation(subscriber.email, subscriber.confirm_token)),
      303,
    );
  }

  const subscriber = saveSubscriber(
    email,
    existing?.confirm_token || token(),
    existing?.unsubscribe_token || token(),
  );
  return NextResponse.redirect(
    digestSentUrl(await sendConfirmation(subscriber.email, subscriber.confirm_token)),
    303,
  );
}

async function sendConfirmation(email: string, confirmToken: string) {
  if (!mailConfigured()) return "saved";
  const confirmUrl = absoluteUrl(`/subscribe/confirm?token=${confirmToken}`);
  const result = await sendMail({
    to: email,
    subject: `Confirm the ${site.fullName} daily digest`,
    text: `Confirm the daily digest for ${site.fullName}:\n${confirmUrl}\n\nIf you did not ask for this, ignore the note.`,
    html: `<p>Confirm the daily digest for ${escapeHtml(site.fullName)}.</p><p><a href="${confirmUrl}">Confirm this address</a></p><p>If you did not ask for this, ignore the note.</p>`,
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
