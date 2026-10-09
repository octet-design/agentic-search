import { z } from "zod";

// ---------------------------------------------------------------------------
// Intent (brief §6.1). Optional fields are nullable so the same schema works as
// a strict OpenAI structured-output schema.
// ---------------------------------------------------------------------------

export const StrengthSchema = z.enum(["must", "prefer"]);
export type Strength = z.infer<typeof StrengthSchema>;

export const ConstraintSchema = z.object({
  include: z.array(z.string()),
  exclude: z.array(z.string()),
  strength: StrengthSchema,
});
export type Constraint = z.infer<typeof ConstraintSchema>;

export const AudienceSchema = z.object({
  segment: z.enum(["women", "men", "kids", "unisex", "unknown"]),
  kidGender: z.enum(["girl", "boy", "any"]).nullable(),
  ageYears: z.number().nullable(),
  source: z.enum(["explicit", "implied", "profile", "unknown"]),
});
export type IntentAudience = z.infer<typeof AudienceSchema>;

export const IntentSchema = z.object({
  kind: z.enum(["product", "occasion", "vibe", "gift", "similar", "browse"]),
  language: z.enum(["en", "hinglish", "hi"]),
  audience: AudienceSchema,
  semanticQuery: z.string(),
  mustKeywords: z.array(z.string()),
  categories: ConstraintSchema,
  colors: ConstraintSchema,
  fabrics: ConstraintSchema,
  patterns: ConstraintSchema,
  fits: ConstraintSchema,
  useCases: ConstraintSchema,
  brands: ConstraintSchema,
  price: z
    .object({ min: z.number().nullable(), max: z.number().nullable(), strength: StrengthSchema })
    .nullable(),
  sizes: z.object({ values: z.array(z.string()), strength: StrengthSchema }).nullable(),
  textExclusions: z.array(z.string()),
  softPreferences: z.array(z.string()),
  occasion: z
    .object({
      name: z.string(),
      location: z.string().nullable(),
      timeOfYear: z.string().nullable(),
      role: z.string().nullable(),
    })
    .nullable(),
  bodyType: z.string().nullable(),
  sort: z.enum(["relevance", "price_asc", "price_desc"]),
  needsClarification: z.object({ question: z.string(), options: z.array(z.string()) }).nullable(),
});
export type Intent = z.infer<typeof IntentSchema>;

export const CONSTRAINT_FIELDS = ["categories", "colors", "fabrics", "patterns", "fits", "useCases", "brands"] as const;
export type ConstraintField = (typeof CONSTRAINT_FIELDS)[number];

/** Intent constraint field → taxonomy field. */
export const TAXONOMY_FIELD = {
  categories: "category",
  colors: "color",
  fabrics: "fabric",
  patterns: "pattern",
  fits: "fit",
  useCases: "useCase",
  brands: "brand",
} as const;

export const emptyConstraint = (strength: Strength = "prefer"): Constraint => ({ include: [], exclude: [], strength });

export function emptyIntent(query = ""): Intent {
  return {
    kind: "product",
    language: "en",
    audience: { segment: "unknown", kidGender: null, ageYears: null, source: "unknown" },
    semanticQuery: query,
    mustKeywords: [],
    categories: emptyConstraint("must"),
    colors: emptyConstraint(),
    fabrics: emptyConstraint(),
    patterns: emptyConstraint(),
    fits: emptyConstraint(),
    useCases: emptyConstraint(),
    brands: emptyConstraint(),
    price: null,
    sizes: null,
    textExclusions: [],
    softPreferences: [],
    occasion: null,
    bodyType: null,
    sort: "relevance",
    needsClarification: null,
  };
}

/** Partial intent used by overrides, planner rails and the refine agent. */
export const IntentPatchSchema = IntentSchema.partial();
export type IntentPatch = z.infer<typeof IntentPatchSchema>;

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type RawProduct = {
  id: string;
  title: string;
  brand: string;
  category: string;
  gender: string;
  color: string;
  fabric?: string;
  fit?: string;
  pattern?: string;
  use_case?: string[];
  sizes?: string[];
  price: number;
  in_stock: boolean;
  description?: string;
  image_url?: string;
  product_url: string;
};

export type ProductCard = {
  id: string;
  title: string;
  brand: string;
  category: string;
  gender: string;
  color: string;
  fabric: string | null;
  fit: string | null;
  pattern: string | null;
  useCase: string[];
  price: number;
  sizes: string[];
  image: string | null;
  url: string;
  domain: string;
  reason: string;
  matched: string[];
  score: number;
  /** Stable "#n" reference within a chat (conversational mode). */
  ref?: number;
  /** Where the product comes from: our Typesense catalog (default) or Shopify's Global Catalog (blended in Typesense search). */
  source?: "typesense" | "shopify";
  /** Shopify products: one-click checkout for the default variant. */
  checkoutUrl?: string | null;
  /** Shopify products priced in another currency: `price` is converted at Shopify's rate. */
  priceApprox?: boolean;
  /** Shopify products on discount: the original price (higher than `price`), in the same units. */
  listPrice?: number;
  /** Shopify products: merchant highlights and default options, also searched for exact matches. */
  extraText?: string;
};

/** Minimal product data kept client-side for taste signals (no embeddings). */
export type ProductLite = {
  id: string;
  brand: string;
  category: string;
  color: string;
  fabric: string | null;
  pattern: string | null;
  fit: string | null;
  price: number;
  title?: string;
  image?: string | null;
};

// ---------------------------------------------------------------------------
// Chips, rails, SSE events (brief §6.8)
// ---------------------------------------------------------------------------

export type ChipKind = "include" | "exclude" | "price" | "audience" | "soft" | "keyword" | "size";
export type Chip = {
  /** Stable key, used to remove/edit the chip: e.g. "colors:include:black". */
  key: string;
  kind: ChipKind;
  label: string;
  field?: ConstraintField | "price" | "audience" | "softPreferences" | "textExclusions" | "mustKeywords" | "sizes";
  value?: string;
};

export type SmartFilter = {
  field: ConstraintField | "price";
  label: string;
  options: { id: string; label: string; count: number; min?: number; max?: number }[];
};

export type RailPlan = { id: string; title: string; why: string };

export type StepId = "understand" | "plan" | "search" | "relax" | "curate" | "adapt";

export type AgentEvent =
  | { type: "step"; id: StepId; label: string; status: "running" | "done" | "skipped"; ms?: number; detail?: string }
  | { type: "intent"; intent: Intent; chips: Chip[]; personalized: string[] }
  | { type: "clarify"; question: string; options: string[] }
  | { type: "plan"; stylistNote: string; rails: RailPlan[] }
  | {
      type: "results";
      railId: string;
      title?: string;
      products: ProductCard[];
      more: ProductCard[];
      relaxedNote?: string;
      smartFilters?: SmartFilter[];
      total: number;
    }
  | { type: "reasons"; railId: string; items: { id: string; reason: string; matched: string[] }[] }
  | { type: "text"; delta: string }
  | { type: "suggestions"; items: string[] }
  | { type: "action"; action: "compare"; ids: string[]; criterion?: string }
  | { type: "ask"; question: string; options: string[] }
  | { type: "debug"; data: unknown }
  | {
      type: "done";
      timings: Record<string, number>;
      tokens: { in: number; out: number };
      costUsd: number;
      cacheHit: boolean;
    }
  | { type: "error"; message: string; retryable: boolean }
  // Conversational mode
  | { type: "chat_text"; block: "intro" | "outro" | "answer"; delta: string }
  | { type: "sections_plan"; sections: { id: string; title: string; why: string }[] }
  | {
      type: "section";
      id: string;
      title: string;
      why: string;
      query: string;
      products: ProductCard[];
      more: ProductCard[];
      relaxedNote?: string;
      /** The exact filters this section used (after relaxation), for "See all". */
      intent?: Intent;
      /** Scout: what counts as an exact match here, and the note when nothing does. */
      anchor?: Anchor;
      emptyNote?: string;
    }
  | { type: "compare"; data: CompareBlockData }
  | { type: "memory"; facts: string[] }
  /** What the photo attached to the user's message shows (kept on that message for later turns). */
  | { type: "photo"; description: string }
  /** Scout: further segments of this answer, offered as pills and fetched only when tapped. */
  | { type: "segments"; items: SegmentOffer[] }
  /** Drape's picks: products (by ref) explained in detail. Sent again, longer, as picks complete. */
  | { type: "picks"; items: ChatPick[] }
  | { type: "chat_state"; intent: Intent; chips: Chip[]; lastSections: ChatSectionSpec[]; personalized: string[] };

/** A planned segment not fetched yet: everything needed to fetch it exactly as the agent planned it. */
export type SegmentOffer = { id: string; title: string; why: string; intent: Intent; anchor?: Anchor; categories: string[] };

export type ChatPick = { ref: number; headline: string; why: string; tip: string };

export type CompareBlockData = {
  products: ProductCard[];
  occasions: { occasion: string; best: number | null; fits: { fit: "great" | "ok" | "poor"; note: string }[] }[];
  verdict: string[];
  summary: string;
  /** Scout: product-specific spec rows (one value per product), shown instead of fabric / fit / pattern / colour. */
  attributes?: { name: string; values: string[] }[];
};

/** What a chat section searched for; sent back each turn so "cheaper" can re-run the same sections. */
export type ChatSectionSpec = {
  title: string;
  categories: string[];
  colors: string[];
  fabrics: string[];
  patterns: string[];
  useCases: string[];
  softPreferences: string[];
  semanticQuery: string;
  budgetMax: number | null;
  /** Scout: the product words a result must contain to count as an exact match. */
  anchor?: Anchor;
};

/**
 * What "exactly what the user asked for" means for a section. terms: the item's name and spellings of the
 * same item ("chaniya choli", "chaniyacholi"). categoryLevel: the name is a whole taxonomy category
 * ("saree"), so a catalog item in that category counts even without the word in its title.
 */
export type Anchor = {
  terms: string[];
  categoryLevel: boolean;
  /** Names the user insisted on (a person, team, brand, character): each must also appear ("kohli" for "Virat Kohli t-shirt"). */
  mustInclude?: string[];
  /** A store or brand the user asked to buy from ("from DailyObjects"): preferred, with a note when unavailable. */
  store?: string;
  /** For an accessory or part: the item it's FOR ("watch" for a watch strap). Products that ARE that item don't match. */
  forItem?: string;
};

export type Emit = (e: AgentEvent) => void;

export const STEP_LABELS: Record<StepId, string> = {
  understand: "Understanding your request",
  plan: "Planning what you'll need",
  search: "Searching 5.5L products",
  relax: "Relaxing a few filters",
  curate: "Hand-picking the best matches",
  adapt: "Trying a sharper search",
};
