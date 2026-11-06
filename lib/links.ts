export function feedHref({
  impact,
  industry,
  q,
  page,
}: {
  impact?: string;
  industry?: string;
  q?: string;
  page?: number;
} = {}) {
  const params = new URLSearchParams();
  if (impact) params.set("impact", impact);
  if (industry) params.set("industry", industry);
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
