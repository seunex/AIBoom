import { NextResponse } from "next/server";
import { confirmSubscriber } from "@/lib/db.mjs";
import { digestSentUrl } from "@/lib/site";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const subscriber = token ? confirmSubscriber(token) : null;
  return NextResponse.redirect(digestSentUrl(subscriber ? "confirmed" : "invalid"), 303);
}
