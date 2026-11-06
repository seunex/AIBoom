export type StoredStory = {
  slug: string;
  title: string;
  summary: string;
  quote?: string;
  quoteAttribution?: string;
  sourceName: string;
  sourceHeadline: string;
  sourceUrl: string;
  sourceAuthor?: string;
  publishedAt: string;
  companies: string[];
  industries: string[];
  impact: string;
  linkType: string;
  figure?: string;
};

export function seedFromMarkdownIfEmpty(): number;
export function ensureTitleSlugs(): number;
export function listStories(): StoredStory[];
export type Subscriber = {
  email: string;
  status: string;
  confirm_token: string;
  unsubscribe_token: string;
  created_at: string;
  confirmed_at: string | null;
};

export function findSubscriber(email: string): Subscriber | null;
export function findSubscriberByConfirmToken(token: string): Subscriber | null;
export function findSubscriberByUnsubscribeToken(token: string): Subscriber | null;
export function saveSubscriber(
  email: string,
  confirmToken: string,
  unsubscribeToken: string,
): Subscriber;
export function confirmSubscriber(token: string): Subscriber | null;
export function unsubscribeSubscriber(token: string): Subscriber | null;
export function confirmedSubscribers(): Subscriber[];
export function digestCursor(): string | null;
export function setDigestCursor(iso: string): void;
export function alreadyDigested(email: string, sentOn: string): boolean;
export function markDigested(email: string, sentOn: string): void;

export function storyRedirects(): {
  source: string;
  destination: string;
  permanent: true;
}[];
export function redirectTarget(fromSlug: string): string | null;
export function slugFromTitle(title: string): string;
export function sourceUrls(): string[];
export function slugTaken(slug: string): boolean;
export function nextSlug(base: string): string;
export function insertStory(story: StoredStory): void;
