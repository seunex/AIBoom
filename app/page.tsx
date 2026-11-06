import type { Metadata } from "next";
import { Suspense } from "react";
import { Feed, FeedFallback } from "@/components/Feed";
import { JsonLd } from "@/components/JsonLd";
import { SiteFrame } from "@/components/SiteFrame";
import { feedHref } from "@/lib/links";
import { absoluteUrl, site } from "@/lib/site";
import { getStories } from "@/lib/stories";
import { impactLabels, isImpact } from "@/lib/taxonomy";

export async function generateMetadata({
  searchParams,
}: PageProps<"/">): Promise<Metadata> {
  const params = await searchParams;
  const impact = firstParam(params.impact);
  const industry = firstParam(params.industry);
  const query = firstParam(params.q)?.trim();
  const page = Number(firstParam(params.page) || "1");
  const path = feedHref({
    impact: isImpact(impact) ? impact : undefined,
    industry,
    q: query || undefined,
    page: Number.isFinite(page) ? page : 1,
  });
  const bits: string[] = [];
  if (query) bits.push(`Search: ${query}`);
  else {
    if (isImpact(impact)) bits.push(impactLabels[impact]);
    if (industry) bits.push(industry);
  }
  if (page > 1) bits.push(`Page ${page}`);

  return {
    title: bits.length > 0 ? bits.join(" · ") : { absolute: site.name },
    description: site.description,
    alternates: { canonical: path },
    robots: query
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <SiteFrame isHome>
      <Suspense fallback={<FeedFallback />}>
        <Feed searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <DeskIndex />
      </Suspense>
    </SiteFrame>
  );
}

async function DeskIndex() {
  const stories = await getStories();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            name: site.name,
            url: absoluteUrl("/"),
            description: site.description,
            potentialAction: {
              "@type": "SearchAction",
              target: `${absoluteUrl("/")}?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@type": "ItemList",
            name: "Downstream stories",
            itemListOrder: "https://schema.org/ItemListOrderDescending",
            numberOfItems: stories.length,
            itemListElement: stories.map((story, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/stories/${story.slug}`),
              name: story.title,
            })),
          },
        ],
      }}
    />
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
