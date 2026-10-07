import { describe, expect, it } from "vitest";
import { tidyLinks } from "./RichText";

describe("tidyLinks", () => {
  it("keeps only the product link when the model wraps it in its own name", () => {
    expect(tidyLinks("I recommend the [Men's White Juttis ([Men's White Juttis](#3))]. They are comfy.")).toBe("I recommend the [Men's White Juttis](#3). They are comfy.");
    expect(tidyLinks("Fabric juttis ([White Juttis](#3) and [Blue Juttis](#4)) breathe better")).toBe("Fabric juttis ([White Juttis](#3) and [Blue Juttis](#4)) breathe better");
    expect(tidyLinks("Pick the velvet pair ([Black Velvet Jutti](#7)) for evenings")).toBe("Pick the velvet pair [Black Velvet Jutti](#7) for evenings");
  });
  it("turns 'Name (#n)' list items into product links", () => {
    expect(tidyLinks("1. Men's Leather Formal Shoes WF6051 (#8): genuine leather\n2. **Brogue Lace Up** (#5): classic")).toBe("1. [Men's Leather Formal Shoes WF6051](#8): genuine leather\n2. [Brogue Lace Up](#5): classic");
  });
});
