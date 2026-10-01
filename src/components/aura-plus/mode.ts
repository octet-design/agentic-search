/** The two tabs built on the same components: Typesense search (our catalog) and Blend search (+ Shopify). */
export type PlusMode = {
  /** Chat surface tag in the shared chat store. */
  surface: "aura" | "blend";
  /** Route prefix. */
  base: "/aura-plus" | "/blend";
  title: string;
  /** Mix Shopify Global Catalog results in and show source chips. */
  blend: boolean;
};

export const TYPESENSE_MODE: PlusMode = { surface: "aura", base: "/aura-plus", title: "Typesense search", blend: false };
export const BLEND_MODE: PlusMode = { surface: "blend", base: "/blend", title: "Blend search", blend: true };
