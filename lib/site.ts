export const site = {
  name: "Downstream",
  dek: "The other side of the AI boom",
  description:
    "A reading room for how AI is changing work. Each item has our headline, a short summary, and a link back to the original article.",
  suggestionEmail: "tips@downstream.example",
  url: (process.env.SITE_URL || "http://127.0.0.1:3456").replace(/\/$/, ""),
};

export function absoluteUrl(path = "/") {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export const suggestionMailto = `mailto:${site.suggestionEmail}?subject=${encodeURIComponent(
  "A link for Downstream",
)}&body=${encodeURIComponent("Source URL:\n\nWhat the piece reports:\n")}`;
