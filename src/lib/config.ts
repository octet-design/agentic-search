/** Brand name lives here only, so a rename is a one-line change. */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Drape";

export const LOCALE = "en-IN";
export const CURRENCY = "INR";

/** Feature switches (conversational branch). Code behind a disabled flag is kept, just not shown. */
export const FEATURES = {
  /** Photo search: camera button + drag-and-drop. Hidden for now (stakeholder request). */
  imageSearch: false,
  /** Per-product AI "why this" line and ✓ badges on cards. The chat explains at section level instead. */
  productReasons: false,
} as const;
