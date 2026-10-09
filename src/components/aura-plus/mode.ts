/** The two tabs built on the same components: Typesense search (our catalog) and Scout (+ Shopify; formerly "Blend search"). */
export type PlusMode = {
  /** Chat surface tag in the shared chat store. */
  surface: "aura" | "blend";
  /** Route prefix. */
  base: "/aura-plus" | "/scout";
  title: string;
  /** Mix Shopify Global Catalog results in and show source chips. */
  blend: boolean;
  /** Home page wording. */
  headline: { lead: string; em: string; tail: string };
  subtitle: string;
  placeholder: string;
  /** Scout: the feed's rotation of searches across categories (Shopify side). Unset = the fashion rotation. */
  feedQueries?: string[];
};

export const TYPESENSE_MODE: PlusMode = {
  surface: "aura",
  base: "/aura-plus",
  title: "Typesense search",
  blend: false,
  headline: { lead: "Style that speaks ", em: "your", tail: " language" },
  subtitle: "Describe what you're looking for in English, Hinglish or Hindi, and we'll curate tasteful results from our catalog.",
  placeholder: "Describe what you're looking for…",
};
/** surface stays "blend" so chats saved before the rename still belong to this tab. */
export const SCOUT_MODE: PlusMode = {
  surface: "blend",
  base: "/scout",
  title: "Scout",
  blend: true,
  headline: { lead: "Find anything, ", em: "the smart", tail: " way" },
  subtitle: "Tell Scout what you need in English, Hinglish or Hindi. It asks what matters, then finds the best options from our catalog and partner stores.",
  placeholder: "What are you shopping for today?",
  feedQueries: [
    "wireless earbuds",
    "linen shirt men",
    "insulated water bottle",
    "kurta set women",
    "smart watch",
    "skincare gift set",
    "running shoes",
    "bluetooth speaker",
    "stainless steel cookware set",
    "leather backpack",
    "yoga mat",
    "silk saree",
    "ceramic coffee mugs",
    "phone stand for desk",
    "sneakers women",
    "scented candles gift",
  ],
};
