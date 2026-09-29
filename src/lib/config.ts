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
  /** "Ask Drape about this" in the product drawer. Hidden (management feedback, guidance branch). */
  askDrape: false,
  /** Visible "#n" badges on chat cards. Refs still exist internally so compare / "more like" / picks work. */
  refBadges: false,
  /** Cross-chat "Drape remembers" facts. Off: each chat's context stays inside that chat. */
  memory: false,
  /** "Style it" in the product panel: occasions + real pieces that complete the look. Replaces "Ask Drape". */
  styleIt: true,
} as const;
