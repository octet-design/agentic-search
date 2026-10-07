import { describe, expect, it } from "vitest";
import { normalizeCompare } from "../compare";
import { shopifyQuery } from "./chatAgent";
import { forSomeoneElse, keepUserStatedMusts, lastAsked, pickedAudience, recipientAudience, sameQuestion, refsInText, resolveCategories, toIntent, wantsChange } from "./chatAgent";
import { fixtureTax as tax, intentWith } from "./testFixture";

describe("refsInText", () => {
  it("finds #n references, with or without a space, deduplicated", () => {
    expect(refsInText("compare #1 and # 12, also #1")).toEqual([1, 12]);
    expect(refsInText("no refs here, #hashtag")).toEqual([]);
  });
});

describe("resolveCategories", () => {
  it("expands department ids to their top-level categories and keeps category ids", () => {
    expect(resolveCategories(["dresses-jumpsuits"], tax)).toEqual(["dress"]);
    expect(resolveCategories(["saree", "ethnic-wear"], tax)).toEqual(["saree", "kurta-set"]);
    expect(resolveCategories(["unknown-thing"], tax)).toEqual(["unknown-thing"]);
  });
});

describe("toIntent", () => {
  const base = {
    audience: { segment: "women" as const, kidGender: null, ageYears: null },
    budgetMin: null,
    budgetMax: 2000,
    budgetStrict: true,
    mustColors: [],
    mustFabrics: ["cotton"],
    excludeColors: ["red"],
    excludeFabrics: ["polyester"],
    excludePatterns: [],
    excludeBrands: [],
    textExclusions: ["cutouts"],
    preferences: ["breathable"],
    occasion: "office",
    sort: "price_asc" as const,
    summary: "comfortable office wear",
  };

  it("maps the planner base to a sanitized Intent without mustKeywords", () => {
    const i = toIntent(base, tax, "msg");
    expect(i.audience.segment).toBe("women");
    expect(i.price).toEqual({ min: null, max: 2000, strength: "must" });
    expect(i.fabrics).toEqual({ include: ["cotton"], exclude: ["polyester"], strength: "must" });
    expect(i.colors.exclude).toEqual(["red"]);
    expect(i.textExclusions).toEqual(["cutouts"]);
    expect(i.softPreferences).toEqual(["breathable"]);
    expect(i.mustKeywords).toEqual([]);
    expect(i.semanticQuery).toBe("comfortable office wear");
    expect(i.sort).toBe("price_asc");
  });

  it("makes a non-strict budget a preference", () => {
    expect(toIntent({ ...base, budgetStrict: false }, tax, "m").price?.strength).toBe("prefer");
  });
});

describe("keepUserStatedMusts", () => {
  const i = intentWith({
    colors: { include: ["navy"], exclude: [], strength: "must" },
    fabrics: { include: ["cotton", "linen"], exclude: ["polyester"], strength: "must" },
  });

  it("demotes musts the user never mentioned, keeps the ones they did", () => {
    const out = keepUserStatedMusts(i, "office wear for women, only cotton please, no polyester", tax);
    expect(out.fabrics).toEqual({ include: ["cotton"], exclude: ["polyester"], strength: "must" });
    expect(out.colors.strength).toBe("prefer");
  });

  it("leaves exclusions alone even when musts are demoted", () => {
    const out = keepUserStatedMusts(i, "something comfortable", tax);
    expect(out.fabrics.strength).toBe("prefer");
    expect(out.fabrics.exclude).toEqual(["polyester"]);
  });
});

describe("normalizeCompare", () => {
  it("maps letters to indexes, fills missing fits, caps rows", () => {
    const res = normalizeCompare(
      {
        summary: "s",
        verdict: ["Pick A if…", "Pick B if…", "x", "y"],
        occasions: [
          { occasion: "Office", best: "B", fits: [{ product: "B", fit: "great", note: "crisp" }] },
          { occasion: "Wedding", best: "none", fits: [{ product: "A", fit: "poor", note: "" }, { product: "B", fit: "ok", note: "" }] },
          { occasion: "Bad", best: "C", fits: [] },
        ],
      },
      2,
    );
    expect(res.occasions[0]).toEqual({ occasion: "Office", best: 1, fits: [{ fit: "ok", note: "" }, { fit: "great", note: "crisp" }] });
    expect(res.occasions[1].best).toBeNull();
    expect(res.occasions[2].best).toBeNull();
    expect(res.verdict).toHaveLength(3);
  });
});

describe("forSomeoneElse", () => {
  it("spots gifts and other wearers in English and Hinglish", () => {
    for (const m of ["Gift for my dad's 60th", "saree for my mom", "kurta for my little son", "papa ke liye kuch", "meri didi ki liye lehenga", "something for her birthday", "gifting ideas"]) {
      expect(forSomeoneElse(m), m).toBe(true);
    }
  });
  it("leaves the user's own asks alone", () => {
    for (const m of ["new tops for college", "what should I wear to my friend's wedding", "outfit for my sister's sangeet", "shoes for my trip", "bolder than usual for a party"]) {
      expect(forSomeoneElse(m), m).toBe(false);
    }
  });
});

describe("wantsChange", () => {
  it("spots asks to move away from the usual", () => {
    for (const m of ["something bolder than usual", "I want a completely new look", "kuch alag chahiye", "try something different for Diwali"]) expect(wantsChange(m), m).toBe(true);
    for (const m of ["new tops for college", "bold red lipstick shade saree", "what to wear to brunch"]) expect(wantsChange(m), m).toBe(false);
  });
});

describe("lastAsked / sameQuestion", () => {
  it("reads the question the last assistant message closed with", () => {
    const history = [
      { role: "user" as const, content: "purse for my lehenga" },
      { role: "assistant" as const, content: "Guidance… [Showed: Potli Bags (#1–#8)] I asked: What colour is your lehenga?" },
      { role: "user" as const, content: "red" },
    ];
    expect(lastAsked(history)).toBe("What colour is your lehenga?");
    expect(lastAsked([])).toBeUndefined();
  });
  it("matches questions ignoring case and punctuation", () => {
    expect(sameQuestion("What colour is your lehenga?", "what colour is your lehenga")).toBe(true);
    expect(sameQuestion("What's your budget?", "What colour is your lehenga?")).toBe(false);
    expect(sameQuestion("Anything?", undefined)).toBe(false);
  });
});

describe("recipientAudience / pickedAudience", () => {
  it("reads the recipient's audience from the message", () => {
    expect(recipientAudience("saree as a gift for my mom")).toBe("women");
    expect(recipientAudience("kurta for my dad's 60th")).toBe(null); // possessive = an occasion, not the wearer
    expect(recipientAudience("kurta for my dad")).toBe("men");
    expect(recipientAudience("papa ke liye kurta")).toBe("men");
    expect(recipientAudience("party dress for my 6 year old daughter")).toBe("girls");
    expect(recipientAudience("shoes for my trip")).toBe(null);
  });
  it("maps picker values to an audience", () => {
    expect(pickedAudience("boys")).toEqual({ segment: "kids", kidGender: "boy", ageYears: null, source: "explicit" });
    expect(pickedAudience("women").segment).toBe("women");
  });
});

describe("shopifyQuery", () => {
  it("keeps the section's angle and always names the item", () => {
    expect(shopifyQuery({ terms: ["chaniya choli"] }, "mirror work garba outfit for navratri")).toBe("chaniya choli mirror work garba outfit for navratri");
    expect(shopifyQuery({ terms: ["chaniya choli"] }, "printed Chaniya-Choli for women")).toBe("printed Chaniya-Choli for women");
    expect(shopifyQuery(undefined, "linen kurta for men")).toBe("linen kurta for men");
  });
});
