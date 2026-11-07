import { NextResponse } from "next/server";
import { unsubscribeSubscriber } from "@/lib/db.mjs";
import { digestSentUrl } from "@/lib/site";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const subscriber = token ? unsubscribeSubscriber(token) : null;
  return NextResponse.redirect(digestSentUrl(subscriber ? "unsubscribed" : "invalid"), 303);
}
