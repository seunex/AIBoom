import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  insertStory,
  nextSlug,
  seedFromMarkdownIfEmpty,
  slugFromTitle,
  sourceUrls,
} from "../lib/db.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const statePath = path.join(root, "content", "ingest-state.json");
const feedsPath = path.join(root, "scripts", "feeds.json");
const dryRun = process.argv.includes("--dry");

const impacts = new Set([
  "layoff",
  "hiring-freeze",
  "role-change",
  "reskilling",
  "demand-shift",
  "reported-attack",
]);
const linkTypes = new Set([
  "company-stated",
  "reported",
  "demand-shift",
  "funding-shift",
  "adaptation",
]);

const blockedPattern =
  /\b(payload|shellcode|metasploit|proof of concept|proof-of-concept|exploit code|step 1|sudo |curl \|)\b/i;

loadEnv(path.join(root, ".env.local"));
loadEnv(path.join(root, ".env"));

const maxStories = numberFromEnv("DOWNSTREAM_MAX_STORIES", 12);
const maxAgeMs = 10 * 24 * 60 * 60 * 1000;
const layoffTitle = /layoff|layoffs|job cut|jobs cut|cutting jobs|cut jobs|cut thousands|workforce|redundan|buyout/i;

await main();

async function main() {
  const provider = chooseProvider();
  const feeds = JSON.parse(fs.readFileSync(feedsPath, "utf8"));
  const seen = loadSeen();
  const candidates = [];

  for (const feed of feeds) {
    try {
      const items = await loadFeed(feed);
      const unseen = items
        .filter((item) => !seen.has(item.url))
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      const newest = unseen.slice(0, 5);
      const cuts = unseen
        .filter((item) => layoffTitle.test(item.title) && !newest.includes(item))
        .slice(0, 5);
      const fresh = [...newest, ...cuts];
      console.log(`${feed.name}: ${fresh.length} new of ${items.length} recent`);
      candidates.push(...fresh);
    } catch (error) {
      console.error(`Feed failed (${feed.url}): ${error.message}`);
    }
  }

  candidates.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const batch = candidates.slice(0, 24);
  console.log(`${batch.length} unseen items to consider`);

  if (dryRun) {
    for (const item of batch) {
      console.log(`- ${item.publishedAt} [${item.sourceName}] ${item.title}`);
    }
    return;
  }

  if (!provider) {
    console.error(
      "Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local, then run npm run ingest.",
    );
    process.exitCode = 1;
    return;
  }

  if (batch.length === 0) {
    console.log("Nothing new.");
    return;
  }

  const drafted = await draftStories(provider, batch);
  const written = [];
  const writtenUrls = new Set();
  const recentCutoff = Date.now() - 36 * 60 * 60 * 1000;
  const newest = [...drafted].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  for (const story of newest.slice(0, maxStories)) {
    const file = writeStory(story);
    written.push(file);
    writtenUrls.add(story.sourceUrl);
    console.log(`Added ${file}`);
  }

  for (const item of batch) {
    const recent = Date.parse(item.publishedAt) >= recentCutoff;
    if (writtenUrls.has(item.url) || !recent) seen.add(item.url);
  }
  saveSeen(seen);
  console.log(
    `Using ${provider.name}. Wrote ${written.length} ${written.length === 1 ? "story" : "stories"}.`,
  );
}

function chooseProvider() {
  const preference = (process.env.DOWNSTREAM_PROVIDER || "").toLowerCase();
  const anthropic = process.env.ANTHROPIC_API_KEY;
  const openai = process.env.OPENAI_API_KEY;

  if (preference === "openai" && openai) {
    return {
      name: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      key: openai,
    };
  }
  if (preference === "anthropic" && anthropic) {
    return {
      name: "anthropic",
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      key: anthropic,
    };
  }
  if (anthropic) {
    return {
      name: "anthropic",
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      key: anthropic,
    };
  }
  if (openai) {
    return {
      name: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      key: openai,
    };
  }
  return null;
}

async function loadFeed(feed) {
  const response = await fetch(feed.url, {
    headers: { "user-agent": "Downstream/1.0 (reading room ingest)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  const xml = await response.text();
  const now = Date.now();
  const blocks = xml.includes("<entry")
    ? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || []
    : xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return blocks
    .map((block) => toItem(block, feed.name))
    .filter((item) => item && now - Date.parse(item.publishedAt) <= maxAgeMs);
}

function toItem(block, sourceName) {
  const title = cleanTitle(tag(block, "title"));
  const url = normalizeUrl(tag(block, "link") || attr(block, "link", "href"));
  const description = tag(block, "description") || tag(block, "summary");
  const publishedAt = toIsoDate(
    tag(block, "pubDate") ||
      tag(block, "published") ||
      tag(block, "updated") ||
      tag(block, "dc:date"),
  );
  if (!title || !url || !publishedAt) return null;
  return {
    id: url,
    title,
    url,
    description: description.slice(0, 1200),
    publishedAt,
    sourceName,
    sourceAuthor: tag(block, "dc:creator") || tag(block, "name"),
  };
}

async function draftStories(provider, items) {
  const prompt = [
    "File cards for Downstream, a reading room about what is happening with AI.",
    "Include a concrete news event from the items when AI is part of what a company, workers, customers, investors, a government, or an attacker did. That includes layoffs, hiring, role changes, reskilling, demand shifts, deals, shutdowns, spending, regulation, market moves, and reported fraud or breaches.",
    "Prefer events from the last few days, in any country. A bank, employer, or government outside the US and UK counts the same as one inside it. Skip explainers, reviews, listicles, and opinion with no event.",
    "Use only the text you are given. Do not add names, places, or numbers that are not in that text.",
    "For an attack, name who was affected and the reported outcome. Do not describe techniques, tools, commands, prompts, payloads, or how to carry the attack out. Skip how-to and exploit writeups.",
    'Return JSON: {"stories":[{"id","title","summary","quote","quoteAttribution","companies","industries","impact","linkType","figure"}]}',
    "impact is one of layoff, hiring-freeze, role-change, reskilling, demand-shift, reported-attack.",
    "linkType is one of company-stated, reported, demand-shift, funding-shift, adaptation.",
    "title is our headline. summary is two original sentences. quote is a short exact excerpt from the description, or empty. figure is a figure copied from the item, or empty.",
    "If nothing qualifies, return {\"stories\":[]}. Return raw JSON only, with no markdown fence.",
    "",
    JSON.stringify(
      items.map((item) => ({
        id: item.id,
        source: item.sourceName,
        date: item.publishedAt,
        title: item.title,
        description: item.description,
      })),
    ),
  ].join("\n");

  const text =
    provider.name === "anthropic"
      ? await askAnthropic(provider, prompt)
      : await askOpenAI(provider, prompt);
  const parsed = JSON.parse(extractJson(text));
  const byId = new Map(items.map((item) => [item.id, item]));
  const stories = [];

  for (const raw of parsed.stories || []) {
    const item = byId.get(raw.id);
    if (!item) continue;
    const story = acceptStory(raw, item);
    if (story) stories.push(story);
    else console.log(`Skipped: ${item.title}`);
  }
  return stories;
}

function acceptStory(raw, item) {
  const sourceText = `${item.title}\n${item.description}`;
  const summary = oneLine(raw.summary);
  const title = oneLine(raw.title);
  let quote = oneLine(raw.quote);
  let quoteAttribution = oneLine(raw.quoteAttribution);
  let figure = oneLine(raw.figure);
  const companies = stringList(raw.companies);
  const industries = stringList(raw.industries);
  const impact = String(raw.impact || "");
  const linkType = String(raw.linkType || "");

  if (!title || !summary || companies.length === 0 || industries.length === 0) {
    return null;
  }
  if (!impacts.has(impact) || !linkTypes.has(linkType)) return null;
  if (wordCount(summary) > 80 || wordCount(title) > 24) return null;
  if (quote && (!sourceText.includes(quote) || wordCount(quote) > 40 || !quoteAttribution)) {
    quote = "";
    quoteAttribution = "";
  }
  if (figure && !sourceText.includes(figure)) figure = "";
  if (!numbersAreGrounded(`${summary} ${figure}`, sourceText)) return null;
  if (blockedPattern.test(`${title} ${summary} ${quote}`)) return null;

  return {
    title,
    summary,
    quote,
    quoteAttribution,
    sourceName: item.sourceName,
    sourceHeadline: item.title,
    sourceUrl: item.url,
    sourceAuthor: item.sourceAuthor,
    publishedAt: item.publishedAt,
    companies,
    industries,
    impact,
    linkType,
    figure,
  };
}

function writeStory(story) {
  const slug = nextSlug(slugFromTitle(story.title));
  insertStory({
    slug,
    title: story.title,
    summary: story.summary,
    quote: story.quote || undefined,
    quoteAttribution: story.quote ? story.quoteAttribution : undefined,
    sourceName: story.sourceName,
    sourceHeadline: story.sourceHeadline,
    sourceUrl: story.sourceUrl,
    sourceAuthor: story.sourceAuthor || undefined,
    publishedAt: story.publishedAt,
    companies: story.companies,
    industries: story.industries,
    impact: story.impact,
    linkType: story.linkType,
    figure: story.figure || undefined,
  });
  return slug;
}

async function askAnthropic(provider, prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": provider.key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error?.message || `Anthropic ${response.status}`);
  }
  return (body.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

async function askOpenAI(provider, prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error?.message || `OpenAI ${response.status}`);
  }
  return body.choices?.[0]?.message?.content || "";
}

function loadSeen() {
  seedFromMarkdownIfEmpty();
  const seen = new Set();
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    for (const url of state.seen || []) seen.add(url);
  }
  for (const url of sourceUrls()) seen.add(normalizeUrl(url));
  return seen;
}

function saveSeen(seen) {
  fs.writeFileSync(
    statePath,
    `${JSON.stringify({ seen: [...seen].sort() }, null, 2)}\n`,
  );
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function tag(block, name) {
  const cdata = block.match(
    new RegExp(`<${name}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, "i"),
  );
  if (cdata) return decode(cdata[1]).trim();
  const plain = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!plain) return "";
  return decode(plain[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function attr(block, name, attribute) {
  const match = block.match(
    new RegExp(`<${name}[^>]*\\s${attribute}="([^"]+)"`, "i"),
  );
  return match ? decode(match[1]) : "";
}

function cleanTitle(title) {
  return title.replace(/\s+[-–—|]\s+[^–—|-]+$/, "").trim();
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function toIsoDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (key.startsWith("utm_")) parsed.searchParams.delete(key);
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function numbersAreGrounded(text, source) {
  const numbers = text.match(/\d[\d,.]*/g) || [];
  return numbers.every(
    (value) => source.includes(value) || source.includes(value.replace(/,/g, "")),
  );
}

function stringList(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => oneLine(item)).filter(Boolean).slice(0, 3);
}

function oneLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function wordCount(value) {
  return value.split(/\s+/).filter(Boolean).length;
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("The model did not return a JSON object.");
  }
  return text.slice(start, end + 1);
}

function numberFromEnv(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
