import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { OriginalLink } from "@/components/OriginalLink";
import { ShareBar } from "@/components/ShareBar";
import { SiteFrame } from "@/components/SiteFrame";
import { StoryLabels } from "@/components/StoryLabels";
import { redirectTarget } from "@/lib/db.mjs";
import { absoluteUrl, site } from "@/lib/site";
import {
  formatStoryDate,
  getStories,
  getStory,
  relatedStories,
  storyDateTime,
} from "@/lib/stories";
import { impactLabels } from "@/lib/taxonomy";

export async function generateStaticParams() {
  const stories = await getStories();
  return stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) return { title: "Story" };

  const path = `/stories/${story.slug}`;
  const keywords = [
    ...story.companies,
    ...story.industries,
    impactLabels[story.impact],
    story.sourceName,
    "AI",
  ];

  return {
    title: story.title,
    description: story.summary,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: story.title,
      description: story.summary,
      url: path,
      publishedTime: storyDateTime(story.publishedAt),
      tags: keywords,
      siteName: site.name,
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.summary,
    },
    robots: { index: true, follow: true },
  };
}

export default async function StoryPage({
  params,
}: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) {
    const target = redirectTarget(slug);
    if (target) permanentRedirect(`/stories/${target}`);
    notFound();
  }

  const related = relatedStories(story, await getStories());
  const path = `/stories/${story.slug}`;
  const published = storyDateTime(story.publishedAt);

  return (
    <SiteFrame>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: story.title,
          description: story.summary,
          datePublished: published,
          dateModified: published,
          inLanguage: "en",
          mainEntityOfPage: absoluteUrl(path),
          url: absoluteUrl(path),
          articleSection: story.industries.join(", "),
          keywords: [...story.companies, ...story.industries, impactLabels[story.impact]].join(", "),
          isBasedOn: {
            "@type": "NewsArticle",
            headline: story.sourceHeadline,
            url: story.sourceUrl,
            publisher: { "@type": "Organization", name: story.sourceName },
            ...(story.sourceAuthor
              ? { author: { "@type": "Person", name: story.sourceAuthor } }
              : {}),
          },
          citation: story.sourceUrl,
          author: { "@type": "Organization", name: site.name, url: absoluteUrl("/") },
          publisher: { "@type": "Organization", name: site.name, url: absoluteUrl("/") },
          about: story.companies.map((company) => ({
            "@type": "Organization",
            name: company,
          })),
        }}
      />
      <article>
        <p className="text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            The desk
          </Link>
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.14em] text-muted">
          <span>{story.companies.join(", ")}</span>
          <span aria-hidden="true"> · </span>
          <span>{story.industries.join(", ")}</span>
          <span aria-hidden="true"> · </span>
          <time dateTime={story.publishedAt}>
            {formatStoryDate(story.publishedAt)}
          </time>
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          {story.title}
        </h1>
        <StoryLabels story={story} className="mt-4 text-sm text-accent" />
        <ShareBar url={absoluteUrl(path)} title={story.title} />
        <p className="mt-6 max-w-2xl text-lg leading-8">{story.summary}</p>
        {story.quote ? (
          <blockquote className="mt-8 max-w-2xl border-l-2 border-accent pl-5">
            <p className="font-serif text-2xl leading-snug text-ink">
              “{story.quote}”
            </p>
            <footer className="mt-3 text-sm leading-6 text-muted">
              {story.quoteAttribution}
            </footer>
          </blockquote>
        ) : null}

        <section className="mt-10 max-w-2xl border border-line bg-white/50 p-6 sm:p-8">
          <h2 className="text-xs uppercase tracking-[0.16em] text-muted">
            The original
          </h2>
          <p className="mt-4 font-serif text-2xl leading-snug">
            {story.sourceHeadline}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            {story.sourceName}
            {story.sourceAuthor ? ` · ${story.sourceAuthor}` : ""}
            {` · ${formatStoryDate(story.publishedAt)}`}
          </p>
          <div className="mt-6">
            <OriginalLink
              href={story.sourceUrl}
              sourceName={story.sourceName}
              prominent
            />
          </div>
        </section>
      </article>

      {related.length > 0 ? (
        <section className="mt-14 border-t border-line pt-8">
          <h2 className="font-serif text-2xl tracking-tight">Related</h2>
          <ul className="mt-4 divide-y divide-line">
            {related.map((item) => (
              <li key={item.slug} className="py-4">
                <p className="text-sm text-accent">{item.companies.join(", ")}</p>
                <Link
                  href={`/stories/${item.slug}`}
                  className="mt-1 block font-serif text-xl leading-snug hover:text-accent"
                >
                  {item.title}
                </Link>
                <p className="mt-2 text-sm text-muted">{item.sourceName}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </SiteFrame>
  );
}
