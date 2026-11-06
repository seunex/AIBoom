import { NextResponse } from "next/server";
import { confirmSubscriber } from "@/lib/db.mjs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const subscriber = token ? confirmSubscriber(token) : null;
  const back = new URL("/subscribe/sent", request.url);
  back.searchParams.set("status", subscriber ? "confirmed" : "invalid");
  return NextResponse.redirect(back, 303);
}
