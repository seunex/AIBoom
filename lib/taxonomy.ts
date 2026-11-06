export const impacts = [
  "layoff",
  "hiring-freeze",
  "role-change",
  "reskilling",
  "demand-shift",
  "reported-attack",
] as const;

export const linkTypes = [
  "company-stated",
  "reported",
  "demand-shift",
  "funding-shift",
  "adaptation",
] as const;

export type Impact = (typeof impacts)[number];
export type LinkType = (typeof linkTypes)[number];

export const impactLabels: Record<Impact, string> = {
  layoff: "Layoff",
  "hiring-freeze": "Hiring freeze",
  "role-change": "Role change",
  reskilling: "Reskilling",
  "demand-shift": "Demand shift",
  "reported-attack": "Reported attack",
};

export const impactDescriptions: Record<Impact, string> = {
  layoff: "Roles the source says are being eliminated.",
  "hiring-freeze": "A slowdown or stop in hiring, tied to AI.",
  "role-change":
    "The work is being reorganized. That can include cuts in one function and different hiring in another.",
  reskilling: "The source describes training or moving people into new work.",
  "demand-shift": "AI changed demand for the product or service.",
  "reported-attack":
    "A fraud, scam, or breach the outlet says was carried out with AI. The card names who was affected and links to the reporting.",
};

export const linkTypeLabels: Record<LinkType, string> = {
  "company-stated": "Company stated",
  reported: "Reported link",
  "demand-shift": "Demand shift",
  "funding-shift": "Funding shift",
  adaptation: "Adaptation",
};

export const linkTypeDescriptions: Record<LinkType, string> = {
  "company-stated": "The company tied AI to the decision.",
  reported: "A credible outlet reported the link.",
  "demand-shift": "AI changed demand for the product.",
  "funding-shift": "Cuts or a freeze free money or focus for AI.",
  adaptation:
    "Work changed, and the source also describes new or different hiring.",
};

export function isImpact(value: string | undefined): value is Impact {
  return impacts.some((impact) => impact === value);
}

export function isLinkType(value: string | undefined): value is LinkType {
  return linkTypes.some((linkType) => linkType === value);
}
