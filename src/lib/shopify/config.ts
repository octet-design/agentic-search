/** Name and promise of the conversational Shopify fashion experience (/aura, formerly "Aura"). A rename is a one-line change. */
export const AGENT_NAME = "Shopify search";
export const AGENT_TAGLINE = "Describe what you're looking for, and we curate real fashion from stores across Shopify. You always check out on the store's own site.";

/**
 * Both Shopify tabs are fashion-only for now: Shopify's "Apparel & Accessories" taxonomy branch
 * (clothing, shoes, bags, jewellery, watches, eyewear, accessories). The agent's prompt enforces the rest.
 */
export const FASHION_CATEGORIES = ["gid://shopify/TaxonomyCategory/aa"];

export const AUDIENCES = [
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "girls", label: "Girls" },
  { id: "boys", label: "Boys" },
] as const;
export type Audience = (typeof AUDIENCES)[number]["id"];
export const AUDIENCE_IDS = AUDIENCES.map((a) => a.id) as [Audience, ...Audience[]];
