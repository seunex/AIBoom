import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  alreadyDigested,
  confirmedSubscribers,
  digestCursor,
  listStories,
  markDigested,
  setDigestCursor,
} from "../lib/db.mjs";
import { sendMail } from "../lib/mail.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(path.join(root, ".env.local"));
loadEnv(path.join(root, ".env"));

const siteUrl = (process.env.SITE_URL || "http://127.0.0.1:3456").replace(/\/$/, "");
const now = new Date();
const sentOn = now.toISOString().slice(0, 10);
const since = digestCursor() || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const stories = listStories().filter((story) => story.publishedAt > since);

if (stories.length === 0) {
  console.log("No new stories for the digest.");
  process.exit(0);
}

const subscribers = confirmedSubscribers();
if (subscribers.length === 0) {
  console.log(`${stories.length} stories ready. No confirmed subscribers.`);
  process.exit(0);
}

let failed = 0;
for (const subscriber of subscribers) {
  if (alreadyDigested(subscriber.email, sentOn)) continue;
  const unsubscribeUrl = `${siteUrl}/subscribe/unsubscribe?token=${subscriber.unsubscribe_token}`;
  const result = await sendMail({
    to: subscriber.email,
    subject: `Downstream · ${sentOn}`,
    text: textDigest(stories, unsubscribeUrl),
    html: htmlDigest(stories, unsubscribeUrl),
    headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
  });
  if (!result.ok) {
    failed += 1;
    console.error(`Digest failed for ${subscriber.email}: ${result.reason}`);
    continue;
  }
  markDigested(subscriber.email, sentOn);
  console.log(`Sent digest to ${subscriber.email}`);
}

if (failed === 0) setDigestCursor(now.toISOString());
console.log(
  failed === 0
    ? `Digest covered ${stories.length} ${stories.length === 1 ? "story" : "stories"}.`
    : `${failed} digest ${failed === 1 ? "send" : "sends"} failed. The window stays open.`,
);

function textDigest(items, unsubscribeUrl) {
  const lines = ["Downstream", "", "New on the desk:", ""];
  for (const story of items) {
    lines.push(story.title);
    lines.push(story.summary);
    lines.push(`${siteUrl}/stories/${story.slug}`);
    lines.push(`Source: ${story.sourceName} ${story.sourceUrl}`);
    lines.push("");
  }
  lines.push(`Unsubscribe: ${unsubscribeUrl}`);
  return lines.join("\n");
}

function htmlDigest(items, unsubscribeUrl) {
  const cards = items
    .map(
      (story) => `<h2 style="font-size:20px;line-height:1.3;margin:28px 0 8px"><a href="${siteUrl}/stories/${story.slug}" style="color:#132421">${escapeHtml(story.title)}</a></h2>
<p style="font-size:16px;line-height:1.6;margin:0 0 8px">${escapeHtml(story.summary)}</p>
<p style="font-size:14px;margin:0"><a href="${escapeHtml(story.sourceUrl)}">Read at ${escapeHtml(story.sourceName)}</a></p>`,
    )
    .join("\n");
  return `<div style="font-family:Georgia,serif;color:#132421;max-width:640px">
<p style="letter-spacing:.14em;font-size:12px">DOWNSTREAM</p>
<p>New on the desk.</p>
${cards}
<p style="margin-top:32px;font-size:13px"><a href="${unsubscribeUrl}">Unsubscribe</a></p>
</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
