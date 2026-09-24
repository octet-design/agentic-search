# Catalog notes (Milestone 0)

Source: `npm run discover` → `data/discovery/report.json`, `data/discovery/sample.json`, `data/raw-facets/*.json`.
Run on 2026-09-24 against Typesense **v30.2**, collection `products`.

The catalog is **live**: the document count grew from 5,50,692 to 5,50,980 between two runs an hour apart. Don't hard-code counts anywhere.

---

## Decisions (used by later milestones)

| Topic | Decision |
|---|---|
| **Base filter** | `in_stock:true && is_active:!=false && gender:!=[other,unidentified] && price:>=50`, plus a **non-fashion category deny-list** built in M1 (see below). Verified: 3,45,810 docs match (before the deny-list). |
| **Gender mapping** | `female→women`, `male→men`, `girl→girls`, `boy→boys`, `infant→kids (baby)`, `unisex→unisex`, `other`/`unidentified`→**excluded**. |
| **Audience expansion** | women ⇒ `[female, unisex]`; men ⇒ `[male, unisex]`; kids+girl ⇒ `[girl]` (+`infant` when `ageYears ≤ 2`); kids+boy ⇒ `[boy]` (+`infant` when ≤ 2); kids+any ⇒ `[girl, boy, infant]`. **No "unisex kids" value exists.** |
| **query_by** | `title,embedding` works. Keep `brand` out of `query_by` by default and match brands through the brand facet (see Hybrid). |
| **Hybrid** | `vector_query: embedding:([], k: 250, alpha: 0.5)` + `rerank_hybrid_matches: true` works. Latency is 38–61 ms round trip. Start with α = 0.5 and tune it in M2. |
| **Image proxy** | **Not needed.** 100% `image_url` coverage in a 1,000-doc sample, and all 10 image hosts tested returned `200 image/jpeg` both with no Referer and with a `localhost` Referer. Keep `referrerPolicy="no-referrer"` anyway. |
| **Outbound domain** | Take it from `product_url`, which is always the brand's own site (e.g. `nalli.com`, `levi.in`). Images sometimes come from `cdn.shopify.com`, so never derive the domain from `image_url`. |
| **Text cleanup** | Add a `cleanText()` for display and LLM input that fixes double-encoded UTF-8 (mojibake) and strips SEO boilerplate from titles (`Buy …`, `@ 3299`, `| Shop for <brand>`, `| <Brand> India`). |
| **Dedupe key** | `brand + normalised title + color`, not `brand + title` (the brief's §6.5). Colour variants share titles. Exact duplicates (same brand, title, colour and price) are still collapsed. |
| **Price stats for prompts** | Use the per-gender in-stock percentiles below for "cheap" (≈p25) and "premium" (≈p75). |

---

## 1. Counts

| Filter | Docs |
|---|---:|
| total | 5,50,980 |
| `in_stock:true` | 3,48,834 (63%) |
| `in_stock:false` | 2,02,146 |
| `is_active:true` | 5,50,808 |
| `is_active:false` | **0** |
| `is_active` missing | 172 |
| `in_stock:true && is_active:true` | 3,48,808 |
| `in_stock:true && is_active:!=false` | 3,48,834 (keeps the 172 docs missing `is_active`) |

`is_active:false` never occurs today. `is_active:!=false` stays in the base filter anyway. It costs nothing and protects against future deactivations. **`in_stock` is the filter that actually matters: it removes 37% of the catalog.**

## 2. Facets

| Field | Distinct values | Values with count < 5 | Coverage | Notes |
|---|---:|---:|---:|---|
| gender | 8 | 0 | 100% | Clean, lowercase. |
| category | 441 | 30 | 100% | Lowercase, fairly granular (`silk sarees`, `kurta-palazzo sets`, `polo t-shirts`). Includes an `other` bucket (15.7k docs) and non-fashion categories. |
| color | 18,188 | 15,444 | 100% | The head is clean (`black`, `blue`, `multi`, `navy blue`…). The long tail is free text. Count ≥ 5 leaves about 2.7k values to cluster. |
| fabric | 23,125 | 18,234 | 93% | Duplicates such as `cotton` / `100% cotton` / `cotton 100%` / `pure cotton`. Contains jewellery materials (`brass`). |
| fit | 1,606 | 1,242 | 100% | `regular` = 62% of docs, so it's a weak signal. Silhouettes leak into it (`flowy`, `a-line`, `flared`). |
| pattern | 10,659 | 9,268 | ~100% | Head: solid, printed, embroidered, embellished, striped, checked, floral. Duplicates like `floral`/`floral print` and `graphic`/`graphic print`. |
| use_case | 4,400 | 3,341 | multi | Head is clean: casual, daily wear, festive, party, wedding, office wear, lounge wear, formal, sports, winter wear… Synonyms: `sport`/`sports`, `streetwear`/`street wear`, `gift`/`gifting`. Also `home decor`. |
| sizes | 6,685 | 4,066 | ~71% of docs | See §5. |
| brand | 312 | 11 | 100% | Some names are squashed (`Jackjones`, `Louisphilippe`, `Houseofdesigners`) and some are mojibake (`KAPRAÃHA`). Needs a display-name map. |

Facet values beyond 10,000 needed `max_facet_values: 100000`. The first run was silently truncated at 10k for color, fabric and pattern.

Top categories: silk sarees 52k · printed sarees 23k · kurta-palazzo sets 23k · straight kurta 18k · polo t-shirts 18k · round neck t-shirts 18k · printed shirts 16k · other 16k · festive lehenga 12k. The catalog is **heavy on women's ethnic wear**.

Top brands: Monte Carlo 37k · Nalli 25k · Jackjones 21k · Houseofdesigners 15k · Kalki 14k · Libas 13k · Koskii 13k · Karagiri 13k. Single brands dominate some categories (Nalli, Karagiri and Koskii for sarees), so **brand diversity (§6.5) really matters**.

## 3. Price distribution (₹)

| Group | Docs | min | p10 | p25 | median | p75 | p90 | max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| all | 5,51,000 | 0.01 | 599 | 1,044 | 1,999 | 4,995 | 15,839 | 95,99,592 |
| all · in_stock | 3,48,836 | 0.01 | 580 | 999 | 1,875 | 4,649 | 14,991 | 15,62,500 |
| female | 3,04,066 | 0.08 | 749 | 1,350 | 2,975 | 8,950 | 22,500 | 95,99,592 |
| male | 1,53,776 | 36 | 598 | 942 | 1,499 | 2,492 | 4,614 | 6,94,995 |
| unisex | 50,359 | 0.01 | 481 | 960 | 2,031 | 5,000 | 10,501 | 8,01,125 |
| boy | 18,871 | 44 | 400 | 576 | 865 | 1,295 | 1,998 | 25,000 |
| girl | 12,096 | 44 | 381 | 583 | 923 | 1,496 | 2,195 | 68,040 |
| infant | 2,137 | 80 | 224 | 359 | 584 | 1,252 | 2,400 | 33,708 |

Percentiles are exact (bisection on `price:<=x` counts, ±₹1). The facet-stats `avg` that Typesense returns doesn't behave like a per-document mean on this version, so it isn't used.

**Price outliers:**
- 369 docs under ₹50: beauty wipes and lip balms.
- ₹99 items are real apparel (Styleunion tees and socks), so the floor is ₹50, not ₹100.
- 812 docs above ₹2L are mostly furniture, dinner sets and massage chairs, all in gender `other`. The gender filter removes them.

Women's prices are much wider (p90 ₹22.5k, because of bridal and silk). A single "cheap" threshold would be wrong, so **per-gender (and ideally per-category) percentiles go into the prompt.** M1 should compute per-department percentiles once departments exist.

## 4. Sample (30 random docs + a 1,000-doc wide sample)

- **`image_url`:** 100% coverage in both samples. Brand-site hosts, plus `cdn.shopify.com` and `image.clovia.com`.
- **`product_url`:** 61 distinct domains in 1,000 docs, each a brand's own store. Top: lilliputworld.com, houseofdesigners.in, nalli.com, karagiri.com, jackjones.in, killerjeans.com.
- **`description`:** always English, 74–148 characters (median 120), no HTML, no Devanagari. **It's templated from the facets**, not real copy:
  > "A mustard a-line kurta-palazzo set for women in cotton with printed detailing. Suited for daily wear, festive, by Libas."

  Consequences:
  - Descriptions add almost nothing beyond the facets. **Neckline, sleeve, length and details (cutouts, slits, sheer) live only in `title`.**
  - The text post-filter for `textExclusions` should rely mainly on `title`.
  - The rerank prompt can cut `desc` to ~120 chars, or drop it, to save tokens.
  - Facet values look machine-extracted. When a title and a facet disagree, the reranker should trust the title.
- **Colour variants share one title.** "White Harbour Tartan Checked Shirt" (U.S. Polo Assn.) exists as three docs, in maroon, mustard and blue. "White Harbour" is a product-line name, not the colour. So colour words in titles aren't always the product colour, and **deduping by `brand + title` alone would merge different colours** (see Decisions).
- **Fields** (1,000-doc sample): fabric 88%, sizes 71%, everything else ~100%. Sarees, jewellery and bags usually have no sizes.

## 5. Size formats

`sizes` mixes many formats. Normalisation is needed before any size filter (M1/M6):

| Format | Examples |
|---|---|
| Letter | `XS S M L XL XXL`, with duplicates `2XL`=`XXL`, `3XL`=`XXXL`, `3X`, `XXS`, up to `6XL` |
| Numeric (waist/chest/UK) | `26`–`46` |
| Combined | `38/M`, `40/L`, `XS/36`, and inconsistently `38/L` (brand-specific) |
| Kids age | `5-6Y`, `9-10Y`, `13-14Y` |
| Kids footwear | `7C/24`, `10C/28` |
| US dress sizes | `US 2`…`US 16` |
| Free/one size | `Free Size`, `Onesize`, `Custom Size` |
| Non-apparel | `30 ML` (fragrance) |

A `sizes:=[…]` filter drops every doc with no sizes (29% of the catalog). So "only my size" must never apply to categories that don't have sizes (sarees, jewellery, bags).

## 6. Hybrid search check

Five queries, three variants each (`data/discovery/report.json → hybrid`). All succeeded on v30.2. Hybrid hits carry both `vector_distance` and `hybrid_search_info`.

| Variant | Round-trip latency |
|---|---|
| keyword `title` | 28–37 ms |
| hybrid `title,embedding`, α 0.5, `rerank_hybrid_matches` | 38–57 ms |
| hybrid `title,brand,embedding`, α 0.5 | 39–61 ms |

These are far inside the 400 ms budget.

Quality:
- Keyword-only is brittle. "black cotton kurta set for office" found 3 docs, and "warm winter jacket for women" found 3, mostly men's.
- Hybrid finds 250+. "party dress for a little girl" surfaces MiniKlub and Kidbea girls' dresses that keyword search missed entirely.
- The audience filter is still essential: without it, hybrid mixes in women's "party" dresses and men's jackets.
- Duplicates are visible: Jackjones "White Sneakers" appears twice at ₹1,749. Dedupe is needed, keyed on colour as well (see Decisions).

Adding `brand` to `query_by` didn't help these generic queries. Brand intent is better handled through the brand facet.

## 7. Surprises

1. **Non-fashion items are in the catalog.** Gender `other` (9.6k docs, all category `other`) and `unidentified` (82) are furniture, tableware, massage chairs and similar. Non-fashion categories also appear under real genders: `fragrances`, `premium beauty`, `makeup`, `skincare`, `soft toys`, `activity toys`, `baby care essentials`, `beauty & personal care`, `hair care`. Unisex category `other` (5.5k) is mixed, e.g. rakhis. **M1 must produce a non-fashion category deny-list** in `taxonomy.json`, applied in the base filter.
2. **Mojibake** in titles and brands (`KAPRAÃHA`, `â‚¬€œ`) and **SEO boilerplate** in titles (`Buy … @ 3299 | Shop for Aurelia`). The `@ 3299` in a title doesn't match the ₹1,260 `price` (it may be an MRP), so **never show prices parsed from titles**.
3. **Descriptions are synthetic** (see §4), so title quality matters most for both retrieval and rerank.
4. **`sort_by: _rand(seed)` was rejected** ("Parameter `sort_by` is malformed") even on v30.2. Random sampling uses random pages instead. Relevant to "Surprise me" (M7): randomise by query or page, not by `_rand`.
5. **Deep pagination is slow** (page 2,50,000 ≈ 0.7 s) and a `multi_search` of 30 deep pages exceeded the 10 s client timeout. The app never deep-pages, but scripts should avoid it.
6. **The search key could read `/debug`, `/health` and the collection schema.** Check whether this is really a search-only scoped key. Either way it stays server-side only.
7. On Windows, calling `process.exit()` in scripts while HTTP keep-alive sockets are open crashes libuv. Scripts set `process.exitCode` instead.
