import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";
import matter from "gray-matter";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = path.join(root, "data", "downstream.db");
const storiesDirectory = path.join(root, "content", "stories");

let database;

export function getDb() {
  if (database) return database;
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS stories (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      quote TEXT,
      quote_attribution TEXT,
      source_name TEXT NOT NULL,
      source_headline TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_author TEXT,
      published_at TEXT NOT NULL,
      companies TEXT NOT NULL,
      industries TEXT NOT NULL,
      impact TEXT NOT NULL,
      link_type TEXT NOT NULL,
      figure TEXT
    );
    CREATE INDEX IF NOT EXISTS stories_published_at ON stories (published_at DESC, slug ASC);
    CREATE INDEX IF NOT EXISTS stories_source_url ON stories (source_url);
    CREATE TABLE IF NOT EXISTS story_redirects (
      from_slug TEXT PRIMARY KEY,
      to_slug TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscribers (
      email TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      confirm_token TEXT NOT NULL UNIQUE,
      unsubscribe_token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      confirmed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS digest_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_sent_at TEXT
    );
    CREATE TABLE IF NOT EXISTS digest_deliveries (
      email TEXT NOT NULL,
      sent_on TEXT NOT NULL,
      PRIMARY KEY (email, sent_on)
    );
  `);
  return database;
}

export function seedFromMarkdownIfEmpty() {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS n FROM stories").get().n;
  if (count > 0) return 0;

  const files = fs
    .readdirSync(storiesDirectory)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"));
  const stories = assignTitleSlugs(files.map((file) => storyFromMarkdown(file)));

  db.exec("BEGIN");
  try {
    for (const story of stories) {
      insertStory(story);
      if (story.legacySlug && story.legacySlug !== story.slug) {
        rememberRedirect(story.legacySlug, story.slug);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return stories.length;
}

export function ensureTitleSlugs() {
  const db = getDb();
  const rows = db.prepare("SELECT slug, title FROM stories").all();
  const changes = assignTitleSlugs(rows).flatMap((story, index) =>
    story.slug === rows[index].slug ? [] : [{ from: rows[index].slug, to: story.slug }],
  );
  if (changes.length === 0) return 0;

  db.exec("BEGIN");
  try {
    changes.forEach((change, index) => {
      db.prepare("UPDATE stories SET slug = ? WHERE slug = ?").run(`__rename_${index}`, change.from);
    });
    changes.forEach((change, index) => {
      db.prepare("UPDATE stories SET slug = ? WHERE slug = ?").run(change.to, `__rename_${index}`);
      db.prepare("UPDATE story_redirects SET to_slug = ? WHERE to_slug = ?").run(change.to, change.from);
      rememberRedirect(change.from, change.to);
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return changes.length;
}

export function listStories() {
  seedFromMarkdownIfEmpty();
  ensureTitleSlugs();
  return getDb()
    .prepare(
      "SELECT * FROM stories ORDER BY published_at DESC, slug ASC",
    )
    .all()
    .map(rowToStory);
}

export function sourceUrls() {
  seedFromMarkdownIfEmpty();
  return getDb()
    .prepare("SELECT source_url FROM stories")
    .all()
    .map((row) => row.source_url);
}

export function storyRedirects() {
  if (!fs.existsSync(databasePath)) return [];
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    return db
      .prepare("SELECT from_slug, to_slug FROM story_redirects")
      .all()
      .map((row) => ({
        source: `/stories/${row.from_slug}`,
        destination: `/stories/${row.to_slug}`,
        permanent: true,
      }));
  } catch {
    return [];
  } finally {
    db.close();
  }
}

export function findSubscriber(email) {
  return (
    getDb().prepare("SELECT * FROM subscribers WHERE email = ?").get(normalizeEmail(email)) ||
    null
  );
}

export function findSubscriberByConfirmToken(token) {
  return getDb().prepare("SELECT * FROM subscribers WHERE confirm_token = ?").get(token) || null;
}

export function findSubscriberByUnsubscribeToken(token) {
  return (
    getDb().prepare("SELECT * FROM subscribers WHERE unsubscribe_token = ?").get(token) || null
  );
}

export function saveSubscriber(email, confirmToken, unsubscribeToken) {
  const normalized = normalizeEmail(email);
  const existing = findSubscriber(normalized);
  const now = new Date().toISOString();
  if (!existing) {
    getDb()
      .prepare(
        `INSERT INTO subscribers (
          email, status, confirm_token, unsubscribe_token, created_at
        ) VALUES (?, 'pending', ?, ?, ?)`,
      )
      .run(normalized, confirmToken, unsubscribeToken, now);
    return findSubscriber(normalized);
  }
  if (existing.status === "confirmed") return existing;
  getDb()
    .prepare(
      `UPDATE subscribers
       SET status = 'pending', confirm_token = ?, unsubscribe_token = ?, created_at = ?
       WHERE email = ?`,
    )
    .run(confirmToken, unsubscribeToken, now, normalized);
  return findSubscriber(normalized);
}

export function confirmSubscriber(token) {
  const row = findSubscriberByConfirmToken(token);
  if (!row || row.status === "unsubscribed") return null;
  getDb()
    .prepare(
      `UPDATE subscribers SET status = 'confirmed', confirmed_at = ? WHERE confirm_token = ?`,
    )
    .run(row.confirmed_at || new Date().toISOString(), token);
  return findSubscriber(row.email);
}

export function unsubscribeSubscriber(token) {
  const row = findSubscriberByUnsubscribeToken(token);
  if (!row) return null;
  getDb().prepare("UPDATE subscribers SET status = 'unsubscribed' WHERE email = ?").run(row.email);
  return findSubscriber(row.email);
}

export function confirmedSubscribers() {
  return getDb().prepare("SELECT * FROM subscribers WHERE status = 'confirmed'").all();
}

export function digestCursor() {
  const row = getDb().prepare("SELECT last_sent_at FROM digest_state WHERE id = 1").get();
  return row?.last_sent_at || null;
}

export function setDigestCursor(iso) {
  getDb()
    .prepare(
      `INSERT INTO digest_state (id, last_sent_at) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET last_sent_at = excluded.last_sent_at`,
    )
    .run(iso);
}

export function alreadyDigested(email, sentOn) {
  return Boolean(
    getDb()
      .prepare("SELECT 1 AS ok FROM digest_deliveries WHERE email = ? AND sent_on = ?")
      .get(normalizeEmail(email), sentOn),
  );
}

export function markDigested(email, sentOn) {
  getDb()
    .prepare("INSERT OR IGNORE INTO digest_deliveries (email, sent_on) VALUES (?, ?)")
    .run(normalizeEmail(email), sentOn);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function redirectTarget(fromSlug) {
  const seen = new Set();
  let current = fromSlug;
  while (!seen.has(current)) {
    seen.add(current);
    const row = getDb()
      .prepare("SELECT to_slug FROM story_redirects WHERE from_slug = ?")
      .get(current);
    if (!row) return current === fromSlug ? null : current;
    current = row.to_slug;
  }
  return current === fromSlug ? null : current;
}

export function slugFromTitle(title) {
  const full = String(title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/(\d),(\d)/g, "$1$2")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!full) return "story";
  if (full.length <= 80) return full;
  const cut = full.slice(0, 80);
  const hyphen = cut.lastIndexOf("-");
  return (hyphen > 24 ? cut.slice(0, hyphen) : cut).replace(/-$/, "");
}

export function slugTaken(slug) {
  return Boolean(getDb().prepare("SELECT 1 AS ok FROM stories WHERE slug = ?").get(slug));
}

export function nextSlug(base) {
  let slug = base;
  let n = 2;
  while (slugTaken(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export function insertStory(story) {
  getDb()
    .prepare(
      `INSERT INTO stories (
        slug, title, summary, quote, quote_attribution,
        source_name, source_headline, source_url, source_author,
        published_at, companies, industries, impact, link_type, figure
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      story.slug,
      story.title,
      story.summary,
      story.quote ?? null,
      story.quoteAttribution ?? null,
      story.sourceName,
      story.sourceHeadline,
      story.sourceUrl,
      story.sourceAuthor ?? null,
      story.publishedAt,
      JSON.stringify(story.companies),
      JSON.stringify(story.industries),
      story.impact,
      story.linkType,
      story.figure ?? null,
    );
}

function assignTitleSlugs(stories) {
  const used = new Set();
  return stories.map((story) => {
    const base = slugFromTitle(story.title);
    let slug = base;
    let n = 2;
    while (used.has(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    used.add(slug);
    return { ...story, slug };
  });
}

function rememberRedirect(fromSlug, toSlug) {
  if (!fromSlug || fromSlug === toSlug) return;
  getDb()
    .prepare(
      `INSERT INTO story_redirects (from_slug, to_slug) VALUES (?, ?)
       ON CONFLICT(from_slug) DO UPDATE SET to_slug = excluded.to_slug`,
    )
    .run(fromSlug, toSlug);
}

function storyFromMarkdown(file) {
  const legacySlug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(storiesDirectory, file), "utf8");
  const { data } = matter(raw);
  const record = data && typeof data === "object" ? data : {};
  const publishedLine = raw.match(/^publishedAt:\s*["']?([^"'\n]+)["']?\s*$/m);
  return {
    legacySlug,
    title: requiredString(record.title, file, "title"),
    summary: requiredString(record.summary, file, "summary"),
    quote: optionalString(record.quote),
    quoteAttribution: optionalString(record.quoteAttribution),
    sourceName: requiredString(record.sourceName, file, "sourceName"),
    sourceHeadline: requiredString(record.sourceHeadline, file, "sourceHeadline"),
    sourceUrl: requiredString(record.sourceUrl, file, "sourceUrl"),
    sourceAuthor: optionalString(record.sourceAuthor),
    publishedAt: publishedLine
      ? publishedLine[1].trim()
      : publishedAtValue(record.publishedAt, file),
    companies: stringList(record.companies, file, "companies"),
    industries: stringList(record.industries, file, "industries"),
    impact: requiredString(record.impact, file, "impact"),
    linkType: requiredString(record.linkType, file, "linkType"),
    figure: optionalString(record.figure),
  };
}

function rowToStory(row) {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    quote: row.quote || undefined,
    quoteAttribution: row.quote_attribution || undefined,
    sourceName: row.source_name,
    sourceHeadline: row.source_headline,
    sourceUrl: row.source_url,
    sourceAuthor: row.source_author || undefined,
    publishedAt: row.published_at,
    companies: JSON.parse(row.companies),
    industries: JSON.parse(row.industries),
    impact: row.impact,
    linkType: row.link_type,
    figure: row.figure || undefined,
  };
}

function publishedAtValue(value, file) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error(`Invalid story ${file}: publishedAt is missing`);
}

function requiredString(value, file, field) {
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error(`Invalid story ${file}: ${field} is missing`);
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringList(value, file, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Invalid story ${file}: ${field} is missing`);
  }
  return value.map((item) => requiredString(item, file, field));
}
