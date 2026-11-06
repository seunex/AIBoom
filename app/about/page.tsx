import type { Metadata } from "next";
import { LabelGuide } from "@/components/LabelGuide";
import { SiteFrame } from "@/components/SiteFrame";
import { site, suggestionMailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Downstream chooses stories, labels the AI link, and sends readers back to the original reporting.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About",
    description:
      "How Downstream chooses stories, labels the AI link, and sends readers back to the original reporting.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <SiteFrame>
      <article className="max-w-2xl">
        <h1 className="font-serif text-4xl tracking-tight">About this desk</h1>
        <div className="mt-6 space-y-5 text-base leading-7">
          <p>
            Downstream is a reading room for what AI is doing to work, and for
            attacks outlets say were carried out with AI. The desk follows
            layoffs, hiring freezes, role changes, reskilling, shifts in
            demand, and reported fraud or breaches, including the cases where
            one team shrinks and another kind of hiring grows.
          </p>
          <p>
            We write the headline and a short summary in our own words. When a
            source has a line worth hearing, we quote a short passage and name
            who said it. The article stays where it was published. Read at the
            source is the action on every item.
          </p>
        </div>

        <h2 className="mt-12 font-serif text-2xl tracking-tight">
          What counts as AI-linked
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7">
          A story is filed when the company tied the decision to AI, or when a
          credible outlet reported that link. The label on the card says which.
          A chief executive saying the tool now does the work is a different
          claim from a company spending heavily on AI in the same season it
          cuts jobs. Both can belong here. They should not look like the same
          sentence.
        </p>
        <div className="mt-6">
          <LabelGuide open />
        </div>

        <h2 className="mt-12 font-serif text-2xl tracking-tight">Figures</h2>
        <p className="mt-4 text-base leading-7">
          Job numbers stay in the wording of the source: about 4,800, under
          4,000, up to 15%. They are not independently verified. Ranges,
          repeats, and percentages stay on their own cards. This desk does not
          turn them into one total.
        </p>

        <h2 className="mt-12 font-serif text-2xl tracking-tight">
          What we leave alone
        </h2>
        <div className="mt-4 space-y-5 text-base leading-7">
          <p>
            The full article stays at the source. A card without a named outlet
            and a link does not get published. If a summary drifts from the
            reporting, the source wins, and the card should be corrected.
          </p>
          <p>
            Suggestions need a link. The mailbox below is a placeholder until
            it is pointed at a real inbox in the site settings.
          </p>
        </div>
        <p className="mt-6">
          <a
            href={suggestionMailto}
            className="inline-flex bg-ink px-4 py-2.5 text-sm text-paper transition-colors hover:bg-accent"
          >
            Send a source link
          </a>
        </p>
        <p className="mt-3 text-sm text-muted">{site.suggestionEmail}</p>
      </article>
    </SiteFrame>
  );
}
