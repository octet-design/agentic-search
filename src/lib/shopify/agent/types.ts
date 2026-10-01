import { z } from "zod";
import { AUDIENCE_IDS } from "../config";
import { isCountryCode } from "../countries";
import type { SearchSpec } from "../search";
import type { Money, ShopifyCard } from "../types";

/** A product the chat has already shown, so follow-ups ("the second one", "#3") can point back at it. */
export const ShownSchema = z.object({
  ref: z.number().int().min(1),
  id: z.string().regex(/^[\w-]{1,64}$/),
  title: z.string().max(300),
  store: z.string().max(120).nullable(),
  price: z.string().max(40),
});
export type Shown = z.infer<typeof ShownSchema>;

/** "Not for me": hidden from future results, and the reason tells the agent what to avoid. */
export const ExcludedSchema = z.object({
  id: z.string().regex(/^[\w-]{1,64}$/),
  title: z.string().max(300),
  reason: z.string().max(40),
});
export type Excluded = z.infer<typeof ExcludedSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(20),
  country: z.string().refine(isCountryCode, "Unsupported country"),
  /** The "Shopping for" pick (null = anyone). */
  audience: z.enum(AUDIENCE_IDS).nullable().default(null),
  /** What this chat currently remembers (the chips above the composer). */
  remembered: z.array(z.string().max(60)).max(12).default([]),
  excluded: z.array(ExcludedSchema).max(60).default([]),
  shown: z.array(ShownSchema).max(150).default([]),
  nextRef: z.number().int().min(1).max(100_000).default(1),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** One product column in a comparison. */
export type CompareItem = {
  ref: number;
  id: string;
  title: string;
  image: string | null;
  store: string | null;
  price: Money | null;
  rating: { value: number; count: number | null } | null;
  available: boolean;
  /** Option name → labels in stock, e.g. { Size: ["S", "M"] }. */
  options: Record<string, string[]>;
  highlights: string[];
  returnsUrl: string | null;
  buyUrl: string | null;
};

/** Server → browser stream events for one turn. */
export type FindsEvent =
  | { type: "status"; label: string }
  /** A product row is on its way (skeleton). */
  | { type: "section_start"; id: string; title: string; why: string }
  | { type: "section"; id: string; title: string; why: string; search: SearchSpec; products: ShopifyCard[]; hasMore: boolean; note?: string }
  | { type: "compare"; items: CompareItem[]; focus: string | null }
  | { type: "chips"; items: string[] }
  | { type: "text"; delta: string }
  | { type: "followups"; items: string[] }
  | { type: "done"; ms: number }
  | { type: "error"; message: string; retryable: boolean };

export type Emit = (e: FindsEvent) => void;

