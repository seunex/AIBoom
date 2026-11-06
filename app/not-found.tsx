import Link from "next/link";
import { SiteFrame } from "@/components/SiteFrame";

export default function NotFound() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl tracking-tight">That page is not on the desk</h1>
      <p className="mt-4 max-w-xl text-lg leading-8">
        The story may have moved, or the link may be off by a character.
      </p>
      <p className="mt-6">
        <Link
          href="/"
          className="inline-flex bg-ink px-4 py-2.5 text-sm text-paper hover:bg-accent"
        >
          Back to the desk
        </Link>
      </p>
    </SiteFrame>
  );
}
