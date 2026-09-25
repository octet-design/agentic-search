import { describe, expect, it } from "vitest";
import { normalizeCompare } from "../compare";
import { keepUserStatedMusts, refsInText, resolveCategories, toIntent } from "./chatAgent";
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
