import { describe, expect, it } from "vitest";
import type { ProductLite } from "./agent/types";
import { decay, deriveTaste, seedIds, type Interaction, type TasteInputs } from "./taste";

const DAY = 24 * 60 * 60 * 1000;
const p = (id: string, color: string, extra: Partial<ProductLite> = {}): ProductLite => ({
  id,
  brand: "B",
  category: "kurtas",
  color,
  fabric: "cotton",
  pattern: "solid",
  fit: "regular",
  price: 1500,
  ...extra,
});
const profile: TasteInputs["profile"] = { audiences: [], sizes: {}, budget: null, styles: [], avoidColors: [], avoidFabrics: [], onlyMySize: false };
const inputs = (interactions: Interaction[], extra: Partial<TasteInputs["signals"]> = {}): TasteInputs => ({
  profile,
  signals: { liked: [], disliked: [], clicked: [], interactions, ...extra },
});

describe("decay", () => {
  it("halves every 14 days", () => {
    const now = Date.now();
    expect(decay(now, now)).toBe(1);
    expect(decay(now - 14 * DAY, now)).toBeCloseTo(0.5);
    expect(decay(now - 28 * DAY, now)).toBeCloseTo(0.25);
  });
});

describe("interaction-based taste", () => {
  it("learns from clicks and views, not only saves", () => {
    const now = Date.now();
    const t = deriveTaste(
      inputs([
        { kind: "click", p: p("1", "navy"), at: now },
        { kind: "view", p: p("2", "navy"), at: now },
        { kind: "view", p: p("3", "red"), at: now },
      ]),
    );
    expect(t.colors[0]).toBe("navy");
    expect(t.empty).toBe(false);
  });

  it("lets recent engagement outweigh old engagement", () => {
    const now = Date.now();
    const t = deriveTaste(
      inputs([
        { kind: "click", p: p("1", "red"), at: now - 60 * DAY },
        { kind: "click", p: p("2", "red"), at: now - 60 * DAY },
        { kind: "click", p: p("3", "green"), at: now },
      ]),
    );
    expect(t.colors[0]).toBe("green");
  });

  it("seeds For you from the strongest engagement, never from dislikes or single glances", () => {
    const now = Date.now();
    const seeds = seedIds(
      inputs(
        [
          { kind: "click", p: p("clicked", "navy"), at: now },
          { kind: "view", p: p("glanced", "navy"), at: now },
          { kind: "view", p: p("studied", "navy"), at: now },
          { kind: "dwell", p: p("studied", "navy"), at: now },
          { kind: "click", p: p("nope", "navy"), at: now },
        ],
        { liked: [p("saved", "pink")], disliked: [{ p: p("nope", "navy"), reason: "style" }] },
      ),
    );
    expect(seeds).toEqual(["saved", "clicked", "studied"]);
  });

  it("falls back to the legacy click list for old sessions", () => {
    const t = deriveTaste({ profile, signals: { liked: [], disliked: [], clicked: [p("1", "olive"), p("2", "olive")] } });
    expect(t.colors).toEqual(["olive"]);
  });
});

describe("fabric normalisation", () => {
  it("merges 100%/pure variants of the same fabric", () => {
    const now = Date.now();
    const t = deriveTaste(
      inputs([
        { kind: "click", p: p("1", "navy", { fabric: "100% cotton" }), at: now },
        { kind: "click", p: p("2", "navy", { fabric: "Pure Cotton" }), at: now },
        { kind: "click", p: p("3", "navy", { fabric: "cotton 100%" }), at: now },
      ]),
    );
    expect(t.fabrics).toEqual(["cotton"]);
  });
});
