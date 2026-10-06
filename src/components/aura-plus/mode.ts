/** The two tabs built on the same components: Typesense search (our catalog) and Scout (+ Shopify; formerly "Blend search"). */
export type PlusMode = {
  /** Chat surface tag in the shared chat store. */
  surface: "aura" | "blend";
  /** Route prefix. */
  base: "/aura-plus" | "/scout";
  title: string;
  /** Mix Shopify Global Catalog results in and show source chips. */
  blend: boolean;
};

export const TYPESENSE_MODE: PlusMode = { surface: "aura", base: "/aura-plus", title: "Typesense search", blend: false };
/** surface stays "blend" so chats saved before the rename still belong to this tab. */
export const SCOUT_MODE: PlusMode = { surface: "blend", base: "/scout", title: "Scout", blend: true };
