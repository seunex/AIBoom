import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteFrame } from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Daily digest",
  robots: { index: false, follow: false },
};

const copy: Record<string, string> = {
  sent: "Check that inbox for a confirmation note. The daily digest starts after you confirm.",
  saved:
    "That address is saved. The confirmation note goes out once Resend is connected in the desk settings.",
  held: "That address is saved. The confirmation note did not go out, so try the form again in a moment.",
  confirmed: "You are on the daily digest. It arrives when the desk has new stories.",
  unsubscribed: "That address is off the daily digest.",
  invalid: "That signup link is not one this desk recognises.",
};

export default function SubscribeSentPage({
  searchParams,
}: PageProps<"/subscribe/sent">) {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl tracking-tight">Daily digest</h1>
      <Suspense
        fallback={<p className="mt-6 max-w-xl text-lg leading-8">Saving that address.</p>}
      >
        <SentMessage searchParams={searchParams} />
      </Suspense>
    </SiteFrame>
  );
}

async function SentMessage({
  searchParams,
}: {
  searchParams: PageProps<"/subscribe/sent">["searchParams"];
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "sent";
  const message = copy[status] || copy.sent;

  return (
    <>
      <p className="mt-6 max-w-xl text-lg leading-8">{message}</p>
      <p className="mt-8">
        <Link href="/" className="text-sm underline decoration-line underline-offset-4 hover:decoration-accent">
          Back to the desk
        </Link>
      </p>
    </>
  );
}
