# Eval report

Generated 2026-09-25T12:11:55.051Z · 25 queries · rerank on · alpha 0.5

**25/25 passed** automatic checks (exclusions, audience, price-when-unrelaxed). Latency p50 6.8s, max 20.1s. Tokens 13276 in / 2320 out per query (avg). Total cost $0.189.

| # | query | kind | rails | results | relaxed | total s | intent s | search s | curate s | tokens in/out | checks |
|---:|---|---|---:|---:|---|---:|---:|---:|---:|---|---|
| 1 | black cotton kurta set for office under 2000 | product | 1 | 24 |  | 7.8 | 2.4 | 1.0 | 4.4 | 11759/2197 | pass |
| 2 | shaadi mein pehenne ke liye sherwani, ivory ya beige | product | 1 | 24 |  | 6.8 | 2.6 | 1.0 | 3.2 | 11664/1940 | pass |
| 3 | what should I wear to a mehendi in Jaipur in November | occasion | 4 | 42 |  | 17.8 | 7.5 | 2.9 | 2.9 | 21127/4247 | pass |
| 4 | floral maxi dress, no polyester | product | 1 | 24 |  | 5.9 | 2.1 | 0.7 | 3.2 | 11529/1904 | pass |
| 5 | everyday college sneakers for men under 3000 | product | 1 | 14 | yes | 20.1 | 3.1 | 11.5 | 5.0 | 8358/958 | pass |
| 6 | birthday party dress for my 6 year old daughter | product | 1 | 24 |  | 8.2 | 1.8 | 1.8 | 4.5 | 11545/1915 | pass |
| 7 | old money look for men | vibe | 3 | 36 |  | 11.9 | 3.7 | 1.4 | 2.7 | 17594/3606 | pass |
| 8 | linen shirt that doesn't need much ironing | product | 1 | 24 |  | 9.5 | 4.3 | 0.6 | 4.7 | 11476/1825 | pass |
| 9 | saree for farewell — elegant, not too heavy | product | 1 | 17 |  | 5.8 | 2.8 | 0.8 | 2.1 | 11718/1829 | pass |
| 10 | high waist squat-proof gym leggings | product | 1 | 24 |  | 5.1 | 1.8 | 0.6 | 2.6 | 11687/1866 | pass |
| 11 | winter jacket for Manali in December, warm but not bulky, women | product | 1 | 24 |  | 5.6 | 1.9 | 0.7 | 3.1 | 11586/1897 | pass |
| 12 | gift for my dad's 60th birthday under 3000 | gift | 2 | 12 | yes | 9.1 | 2.0 | 1.6 | 2.3 | 11872/2091 | pass |
| 13 | office wear for a pear body type | browse | 4 | 44 |  | 13.2 | 5.0 | 1.8 | 3.1 | 20956/4247 | pass |
| 14 | navratri garba outfits for a couple | occasion | 4 | 47 |  | 10.8 | 2.3 | 2.2 | 2.7 | 21223/4328 | pass |
| 15 | white shirt | product | 1 | 24 |  | 4.7 | 1.9 | 0.4 | 2.4 | 11315/1942 | pass |
| 16 | kurti | product | 1 | 24 |  | 5.0 | 2.0 | 0.4 | 2.6 | 11355/1995 | pass |
| 17 | kuch accha sa dikhao party ke liye | browse | 3 | 36 |  | 10.0 | 1.9 | 1.4 | 3.6 | 17633/3045 | pass |
| 18 | denim jacket like levis but cheaper | product | 1 | 15 |  | 5.8 | 1.9 | 0.4 | 3.5 | 11487/2040 | pass |
| 19 | school shoes for boys | product | 1 | 24 |  | 5.0 | 2.2 | 0.3 | 2.6 | 10643/1521 | pass |
| 20 | bodycon dress, no cutouts, not red | product | 1 | 24 |  | 7.9 | 1.9 | 0.6 | 5.0 | 11654/1951 | pass |
| 21 | diwali ethnic wear for a 2 year old boy | occasion | 1 | 12 |  | 6.6 | 2.6 | 0.5 | 2.0 | 10654/1251 | pass |
| 22 | monsoon footwear that won't get ruined | product | 1 | 9 |  | 5.2 | 2.6 | 0.6 | 2.0 | 11858/1717 | pass |
| 23 | interview outfit for a male fresher under 4000 | product | 1 | 24 |  | 5.0 | 1.9 | 0.6 | 2.6 | 11628/1989 | pass |
| 24 | pastel co-ord set for brunch | product | 1 | 24 |  | 4.7 | 2.0 | 0.5 | 2.1 | 11861/1923 | pass |
| 25 | Goa trip outfits for a guy, 6000 total | browse | 3 | 36 |  | 12.5 | 1.9 | 1.5 | 5.0 | 17726/3780 | pass |

## 1. black cotton kurta set for office under 2000

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"black cotton kurta set for office wear","categories":{"include":["kurta-set"],"exclude":[],"strength":"must"},"colors":{"include":["black"],"exclude":[],"strength":"must"},"fabrics":{"include":["cotton"],"exclude":[],"strength":"must"},"useCases":{"include":["office"],"exclude":[],"strength":"prefer"},"price":{"min":null,"max":2000,"strength":"must"}}
```

Chips: `Women` `Kurta Set` `Black` `Cotton` `~ Office/Work` `Under ₹2,000`

### Rail `main` (24 shown, 45 found)

- q: `black cotton kurta set for office wear`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 45 found/40 usable (954ms)

| title | brand | price | reason |
|---|---|---:|---|
| Midnight Black Cotton Co-Ord Set · Crane Embroidery | Navdhaara | ₹1,799 | Midnight black cotton kurta set, embroidered, office wear, ₹1799 under ₹2000 |
| Black Lace Embroidered Kurta With Black Solid Palazzo | Bhama Designs | ₹999 | Pure cotton, black kurta-palazzo set, ₹999 under ₹2000, suitable for daily wear/office |
| Black Cotton Slub Embroidered Kurta-Pant Set with Thread Work & Cotton Lace | Juniper Fashion | ₹1,295 | Black cotton slub, straight fit, embroidered, casual/festive, ₹1295 under ₹2000 |
| Libas Black Printed Cotton Straight Kurta Set | Libas | ₹1,109 | Black cotton straight kurta set, printed, casual/festive, ₹1109 under ₹2000 |
| Libas Black Embroidered Cotton Co-Ord Set | Libas | ₹1,939 | Black cotton kurta set, straight fit, ₹1939; suitable for casual/work use. |
| Black Straight Kurta with Striped Palazzo Pants | Aurelia | ₹940 | Black 100% cotton, straight fit, office wear, under ₹2000 |
| Printed Cotton Kurta With Pant Set | Styleunion | ₹799 | Black 100% cotton straight kurta set, printed, casual/festive, ₹799 under ₹2000 |
| Libas Black Printed Cotton Straight Kurta With Palazzos & Dupatta | Libas | ₹949 | Black cotton kurta set, straight fit, daily wear/festive, ₹949 under ₹2000 budget |
| Black Printed kurta with Straight Palazzo and Dupatta | Aurelia | ₹1,700 | 100% cotton, black kurta-palazzo set, ₹1700 under ₹2000, office plausible |
| Black Solid Textured Cotton Straight Kurta and Salwar Co-ord Set | Aurelia | ₹1,320 | Black 100% cotton kurta set, tapered fit, ₹1320 under ₹2000, casual/festive not office. |

Rerank: main scored 36, kept 32, dropped 4 [score 0.33 (occasion); score 0.30 (occasion); score 0.25 (not office); score 0.30 (not office)]

Timings: understand 2350ms, search 1005ms, curate 4369ms, total 7776ms · tokens 11759/2197 · $0.00664

## 2. shaadi mein pehenne ke liye sherwani, ivory ya beige

Intent:
```json
{"kind":"product","language":"hinglish","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"ivory or beige sherwani for a wedding","categories":{"include":["sherwani"],"exclude":[],"strength":"must"},"colors":{"include":["off-white","beige"],"exclude":[],"strength":"must"},"useCases":{"include":["wedding"],"exclude":[],"strength":"prefer"}}
```

Chips: `Men` `Sherwani` `Off-white / ivory / cream` `Beige / nude` `~ Wedding`

### Rail `main` (24 shown, 57 found)

- q: `ivory or beige sherwani for a wedding`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 57 found/58 usable (967ms)

| title | brand | price | reason |
|---|---|---:|---|
| Ivory Imperial Heritage · Ivory Hand Embroidered Dupion Silk Sherwani | Hilo Design | ₹65,300 | Ivory dupion silk sherwani, heritage style, embroidered, wedding/ceremonial use. |
| Ivory Sherwani Set With Zardosi And Butti Work | Kalki | ₹1,26,950 | Ivory tailored sherwani with zardosi and butti embroidery, wedding/party occasion. |
| Classic ivory sherwani | Kalki | ₹1,42,950 | Classic ivory silk tailored sherwani with embroidery, suitable for wedding/party. |
| Ivory Silk Sherwani With Intricate Floral Embroidery | Kalki | ₹30,599 | Ivory silk sherwani with floral embroidery, tailored, wedding occasion matches user preference. |
| Ivory Raw Silk Sherwani with Peacock & Floral Thread Work | Shreeman | ₹81,399 | Ivory raw silk sherwani, tailored fit, embroidered, suitable for wedding. |
| Ivory Raw Silk Sherwani with Hand Embroidery | Shreeman | ₹87,999 | Ivory raw silk sherwani, tailored fit, hand embroidery, wedding use. |
| Resonance Embroidered Silk Sherwani · Ivory | Anita Dongre | ₹2,50,000 | Ivory silk sherwani, tailored fit, embroidered, wedding and party wear. |
| Ivory Sherwani with Elegant Thread Work & Sequences | Shreeman | ₹21,999 | Ivory silk sherwani with thread work and sequences, tailored for weddings. |
| Testament Embroidered Cord Silk Sherwani · Ivory | Anita Dongre | ₹2,60,000 | Ivory silk sherwani, tailored fit, embroidered, for wedding and party use. |
| Ivory Silk Sherwani Set With All Over Machine & Hand Embroidery | Steel Lifestyle | ₹53,895 | Ivory silk, tailored fit, embroidered, suitable for wedding, matches ivory color preference. |

Rerank: main scored 36, kept 35, dropped 1 [score 0.20 (polyester; not wedding)]

Timings: understand 2568ms, search 1000ms, curate 3237ms, total 6806ms · tokens 11664/1940 · $0.0062

## 3. what should I wear to a mehendi in Jaipur in November

Intent:
```json
{"kind":"occasion","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"festive mehendi outfit in bright yellow or green","colors":{"include":["yellow","green"],"exclude":[],"strength":"prefer"},"useCases":{"include":["festive","wedding"],"exclude":[],"strength":"prefer"},"occasion":{"name":"mehendi","location":"Jaipur","timeOfYear":"November","role":null}}
```

Chips: `Women` `~ Yellow / mustard` `~ Green` `~ Festive` `~ Wedding`

Stylist note: In Jaipur during November, the weather is pleasantly cool, perfect for vibrant and comfortable ethnic wear. Mehendi functions typically feature bright and cheerful colors like yellow, mustard, and green, reflecting the festive mood. Opt for breathable fabrics like cotton or silk blends to stay comfortable throughout the day.

- Ethnic Wear — Traditional and colorful for mehendi celebrations
- Footwear — Comfortable and stylish for day-long events
- Accessories — Enhance festive look with ethnic jewelry
- Dupatta or Stole — Adds elegance and complements outfit

### Rail `rail-3` — Accessories (12 shown, 42 found)

- q: `ethnic jewelry for mehendi function women gold green embellished festive wedding`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 42 found/36 usable (2850ms)

| title | brand | price | reason |
|---|---|---:|---|
| Ethnic Style Brass Faux Kundan Embellished Gold Plated Bracelet | Voylla | ₹1,089 | Gold plated, embellished bracelet, festive and wedding use, matches color preference. |
| Pearl Elegance Emerald Green Drop Ethnic Earrings Chain Set | Voylla | ₹1,289 | Green brass earrings, embellished, wedding/festive, suits mehendi and green preference. |
| Ethnic Grace Mala | Cosa Nostraa | ₹13,700 | Green embellished fashion jewellery, festive use fits mehendi in Jaipur |
| Aarzoo Ethnic Pearl Payal | House of Designers | ₹4,500 | Gold brass and pearl anklet, embellished, festive, suits mehendi in Jaipur November |
| Festive Hues Faux Pearls Adorned Long Chain Gold Plated Brass Ethnic Jewellery Set | Voylla | ₹2,369 | Gold plated, embellished long chain, festive use but no explicit wedding mention. |
| Silver Heart Nath Gold Plated | Aadyaa | ₹3,000 | Gold plated silver, embellished, wedding/festive, matches gold preference for mehendi. |
| Brass Fashion Earrings ‚Äì Statement Ethnic Drops · The Bling Edit | Aadyaa | ₹2,400 | Gold brass traditional earrings, festive use, lightweight, fits mehendi occasion |
| Ethnic Bridal Choker Necklace with Pearls & Ruby Drops · Wedding Jewelry Set for Women | Estele | ₹1,250 | Embellished, festive choker in ruby & white, suitable for wedding mehendi. |
| Ethnic Green Mala | Cosa Nostraa | ₹6,900 | Green beads, solid pattern, festive use, fits green and festive preferences. |
| Chitrangada Ethnic Filigree Bracelet | House of Designers | ₹1,800 | Gold brass filigree bracelet, festive, embellished, suitable for mehendi event |

### Rail `rail-2` — Footwear (6 shown, 209 found)

- q: `comfortable traditional footwear for mehendi event women gold beige yellow leather embroidered solid`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 209 found/40 usable (2850ms)

| title | brand | price | reason |
|---|---|---:|---|
| Women Comfortable Flatform Ankle Strap Sandals | Carlton London | ₹1,439 | Beige flat sandals, solid pattern, comfortable, suitable for casual/party wear. |
| Now Women Yellow Solid Open Toe Comfort Heels | Inc.5 | ₹2,038 | Yellow flat sandals, solid pattern, festive use, comfortable synthetic fabric. |
| Now Women Beige Party Wear Solid Open Toe Slip-On Sandals | Inc.5 | ₹1,064 | Beige flat sandals, solid pattern, festive use; synthetic, not leather, but fits occasion. |
| Now Womens Beige Ethnic Solid Pattern Open Toe Flats | Inc.5 | ₹2,590 | Beige mojari flats, solid pattern, ethnic and party use, synthetic fabric. |
| Now Womens Beige Ethnic Solid Open Toe Flat Sandals | Inc.5 | ₹2,590 | Beige ethnic flat sandals, solid pattern, festive use, synthetic fabric. |
| Now Womens Beige Ethnic Solid Round Toe Wedge Heel Sandals | Inc.5 | ₹2,590 | Beige flat sandals, solid pattern, festive use, synthetic fabric, comfortable for mehendi. |

### Rail `rail-1` — Ethnic Wear (12 shown, 200 found)

- q: `women's ethnic wear for mehendi in yellow green mustard colors cotton silk blend embroidered printed floral festive`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 200 found/69 usable (2850ms)

| title | brand | price | reason |
|---|---|---:|---|
| Semi Stitched Desirable Green Silk Floral Embroidered Mehendi Wear Suit With Lehenga | Ethnic Plus | ₹10,799 | Green silk lehenga, embroidered, festive/wedding use, breathable silk for November mehendi. |
| Semi Stitched Lovely Mehendi Green Zari Weaving Chanderi Silk Mehendi Wear Lehenga Choli | Ethnic Plus | ₹2,159 | Green chanderi silk lehenga, embroidered, festive mehendi wear, breathable fabric |
| Janasya Women's Mustard Silk Blend Floral Zari Embroidered Anarkali Kurta Set | Janasya | ₹1,699 | Mustard silk blend, floral embroidery, festive use, flowy fit suits mehendi in November. |
| Janasya Women's Dark Green Silk Blend Floral Zari Embroidered Anarkali Kurta Set | Janasya | ₹1,699 | Dark green silk blend anarkali, floral embroidery, festive and wedding suitable |
| Semi Stitched Radiant Green Pink Thread Work Silk Mehendi Wear Lehenga Choli | Ethnic Plus | ₹2,639 | Green silk lehenga, embroidered, suitable for mehendi and wedding in November |
| Fabulous Teal Green Embroidered Silk Mehendi Wear Anarkali Gown With Dupatta | Zeel Clothing | ₹2,399 | Emerald green silk anarkali, embroidered, festive/wedding, breathable silk blend |
| Jasmine Yellow Bralette, Skirt & Cape Set | Pasha India | ₹6,499 | Yellow cotton rayon lehenga, printed, festive mehendi use, breathable for November Jaipur |
| Mehendi Green Embroidered Anarkali | Lashkaraa | ₹17,800 | Silk, green, embroidered, festive/wedding, flowy fit suits mehendi in November Jaipur |
| Marvelous Green Printed Dola Silk Mehendi Wear Lehenga With Blouse | Zeel Clothing | ₹2,639 | Olive green silk lehenga, embroidered, festive use, comfortable silk fabric |
| Janasya Women's Sage Green Cotton Blend Floral Printed Anarkali Kurta Set | Janasya | ₹1,499 | Sage green cotton blend, floral print, flowy, suitable for daytime festivities in November. |

### Rail `rail-4` — Dupatta or Stole (12 shown, 194 found)

- q: `lightweight dupatta or stole for mehendi outfit women yellow green cotton silk blend chiffon embroidered`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 194 found/39 usable (2850ms)

| title | brand | price | reason |
|---|---|---:|---|
| Green Color Silk Organza Embroidered Dupatta | Tjori | ₹479 | Green silk organza, embroidered, festive, dupatta, lightweight, suitable for mehendi. |
| Green Handloom Organza Dupatta With Rose Embroidered Motifs And Cotton Lace | WeaverStory | ₹14,995 | Green organza/chanderi, embroidered, festive, lightweight and flowy for November mehendi. |
| Lime Yellow Embroidered Dupatta | House of Designers | ₹13,800 | Mango yellow organza, embroidered, festive, lightweight and flowy for November mehendi. |
| Deep Green Hand Embroidered Organza Dupatta With Floral Border And Booti | WeaverStory | ₹62,995 | Deep green, embroidered, organza, festive/wedding; suitable for mehendi in Jaipur November. |
| Sea Green Pure Silk Kashmiri Tilla Hand Embroidered Dupatta With Konia | WeaverStory | ₹21,995 | Sea green georgette, pure silk, embroidered, festive/wedding, suitable for November mehendi. |
| Green Embroidered Dupatta | House of Designers | ₹17,800 | Ever green organza, embroidered, festive, lightweight and flowy for November mehendi. |
| Lime Yellow Embroidered Dupatta | House of Designers | ₹13,800 | Lime yellow organza, embroidered, festive, fits mehendi in November Jaipur. |
| Green Zari Embroidered Dupatta | Aurelia | ₹860 | Green, printed, festive, rayon blend; fits mehendi in Jaipur, November well. |
| SILK ORGANZA STOLE WITH EMBROIDERED FLORALS | Eka Design Studio | ₹7,000 | Silk organza, embroidered, festive use; multi-color not yellow/green; lightweight, flowy |
| Light Purple Color Silk Organza Embroidered Dupatta | Tjori | ₹1,039 | Silk organza, embroidered, festive; light purple not preferred color for mehendi in Jaipur. |

Rerank: rail-3 scored 18, kept 18, dropped 0 · rail-2 scored 18, kept 6, dropped 12 [score 0.15 (color); score 0.33 (fabric); score 0.15 (color; not festive; no leather); score 0.25 (synthetic; casual)] · rail-1 scored 18, kept 15, dropped 3 [score 0.25 (polyester); score 0.30 (purple); score 0.30 (not breathable)] · rail-4 scored 18, kept 15, dropped 3 [score 0.10 (fabric; occasion; category); score 0.20 (black; nylon); score 0.25 (nylon)]

Timings: understand 7514ms, plan 4533ms, search 2876ms, curate 2887ms, total 17811ms · tokens 21127/4247 · $0.01325

## 4. floral maxi dress, no polyester

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"floral print maxi dress without polyester fabric","categories":{"include":["maxi-dress"],"exclude":[],"strength":"must"},"fabrics":{"include":[],"exclude":["polyester"],"strength":"must"},"patterns":{"include":["floral"],"exclude":[],"strength":"must"}}
```

Chips: `Women` `Maxi Dress` `✕ Polyester` `Floral`

### Rail `main` (24 shown, 239 found)

- q: `floral print maxi dress without polyester fabric`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 239 found/94 usable (676ms)

| title | brand | price | reason |
|---|---|---:|---|
| Blue Pure Cotton Floral Printed Tiered Dress | Janasya | ₹1,399 | Pure cotton, blue floral print, flowy tiered maxi dress, no polyester. |
| Yellow Maxi Dress With Floral Print | Kapraaha | ₹6,417 | Cotton floral printed maxi dress, comfortable fit, casual/festive, no polyester |
| Rareism Women's Preru Purple Cotton Halter Neck Floral Print Sleeveless Maxi Flared Dress | The House Of Rare | ₹4,399 | Cotton fabric, floral print, sleeveless maxi dress, suitable for casual and festive wear. |
| trueBrowns Purple Mustard Floral Print Muslin Silk Straight Maxi Dress | True Browns | ₹5,160 | Muslin silk fabric, straight fit, purple floral print maxi dress, no polyester. |
| Tropical Floral Printed & Sequin Embroidered A-Line Tiered Maxi Dress · Teal | Fashor | ₹1,549 | Cotton fabric, teal floral print, fit & flare maxi dress, no polyester |
| Tropical Floral Printed & Sequin Embroidered A-Line Tiered Maxi Dress · Mustard | Fashor | ₹1,549 | Cotton fabric, mustard floral print, fit & flare maxi dress, no polyester |
| Floral Printed Half Sleeves Maxi Dress â‚¬€œ The Kaftan Company | The Kaftan Company | ₹3,000 | Modal fabric, floral print, beige and green, flowy maxi dress, no polyester. |
| White Cotton Floral Maxi | Kapraaha | ₹5,810 | Pure cotton, floral hand block print, white, maxi dress, no polyester |
| Rareism Women's Freno Off White Cotton Blend V-Neck Floral Print Maxi Straight Fit Dress | The House Of Rare | ₹4,439 | Cotton blend fabric, floral print, straight fit maxi dress for casual wear. |
| Floral Print Halter Neck Dress | VERO MODA | ₹1,599 | 92% viscose-lenzing ecovero, beige floral print, loose fit maxi dress, no polyester. |

Rerank: main scored 36, kept 32, dropped 4 [score 0.15 (polyester); score 0.15 (polyester); score 0.15 (polyester); score 0.15 (polyester)]

Timings: understand 2068ms, search 694ms, curate 3170ms, total 5932ms · tokens 11529/1904 · $0.00766

## 5. everyday college sneakers for men under 3000

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"everyday college sneakers for men under 3000","categories":{"include":["sneaker"],"exclude":[],"strength":"must"},"useCases":{"include":["daily-wear","school"],"exclude":[],"strength":"prefer"},"price":{"min":null,"max":3000,"strength":"must"}}
```

Chips: `Men` `Sneaker` `~ Daily Wear` `~ School/College` `Under ₹3,000`

### Rail `main` (14 shown, 87 found)

- q: `everyday college sneakers for men under 3000 daily wear school`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 4 found/4 usable (8079ms) → 4 found/4 usable (545ms) → 4 found/4 usable (567ms) → 7 found/5 usable (494ms) → 87 found/14 usable (1784ms) · relaxed: price-20, price-40, category-parent, category-department
- note: Few exact matches, so also showing other casual shoe styles, related categories and a few up to ₹4,200.

| title | brand | price | reason |
|---|---|---:|---|
| Healers MDG-1 Everyday Comfort Black Formal Sandal for Men by Liberty | Liberty Shoes | ₹2,499 | Black · Softy · ₹2,499 |
| Healers OML-10 Everyday Comfort Brown Casual Slippers for Men by Liberty | Liberty Shoes | ₹1,999 | Brown · Softy · ₹1,999 |
| Everyday Basic Sneakers : Electric Black | Neeman's | ₹1,099 | Electric black low-top sneakers, recycled fabric, casual daily wear, ₹1099 under ₹3k. |
| Blue Casual Slippers for Everyday Comfort Online | Inc.5 | ₹937 | Blue · Leather · ₹937 |
| Healers MDG-3 Everyday Comfort Black Formal Slip on Slippers for Men By Liberty | Liberty Shoes | ₹2,499 | Black · Softy · ₹2,499 |
| Everyday Basic Sneakers : Powder White | Neeman's | ₹1,099 | Powder white low-top sneakers, recycled knit, casual daily wear, men's, ₹1099 under ₹3k. |
| Everyday Basic Sneakers : Pebble Grey | Neeman's | ₹1,099 | Pebble grey low-top sneakers, recycled knit, casual daily wear, men's, ₹1099 under ₹3k. |
| Duke Men Everyday Comfort Clogs (FWCR6202) | Duke India | ₹559 | Black · Eva · ₹559 |
| School Stride · Men Black Running Shoes | Reebok | ₹1,319 | Men's black synthetic running shoes, casual and sports use, ₹1319 under ₹3000 budget. |
| SCHOOL SPORTS XTREME · Men White Running Shoes | Reebok | ₹1,259 | Men's white synthetic/textile running shoes, casual daily wear, ₹1259 under ₹3000 budget. |

Rerank: main TIMEOUT (fallback reasons)

Timings: understand 3132ms, search 11486ms, curate 5039ms, total 20140ms · tokens 8358/958 · $0.0033

## 6. birthday party dress for my 6 year old daughter

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"kids","kidGender":"girl","ageYears":6,"source":"explicit"},"semanticQuery":"birthday party dress for 6 year old girl","categories":{"include":["dress"],"exclude":[],"strength":"must"},"useCases":{"include":["party"],"exclude":[],"strength":"prefer"}}
```

Chips: `Girls · 6y` `Dress` `~ Party/Club`

### Rail `main` (24 shown, 1439 found)

- q: `birthday party dress for 6 year old girl`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 1439 found/128 usable (1766ms)

| title | brand | price | reason |
|---|---|---:|---|
| Christmas Special Velvet Dress For Girls | Neofaa | ₹1,499 | Velvet, tailored, solid scarlet red, party dress for girls, festive occasion |
| Red Luxurious Velvet Festive Glam Stylish Dress For Girls | Neofaa | ₹1,499 | Velvet fabric, tailored fit, scarlet red, party dress for girls, ₹1499 fits birthday party |
| Baby Girls Solid Layered Tulle Party Dress, Pink | MiniKlub | ₹1,608 | Pink party dress, regular fit, layered tulle, suitable for birthday parties. |
| Baby Girls Floral Embroidered Party Dress, Pink | MiniKlub | ₹1,468 | Pink floral embroidered party dress, regular fit, ideal for birthday party. |
| Girls Layered Party Dress | Lilliput World | ₹2,495 | Flared pink party dress, embroidered, suitable for 6-year-old girl's birthday party. |
| Wrap Me Right · Half Pleated, Fully Fierce Black Dress For Girls | Neofaa | ₹1,499 | Black moss georgette party dress, perfect fit for girls, ₹1499 |
| Girls Layered Party Dress | Lilliput World | ₹2,495 | Flared party dress, baby pink, embroidered, suitable for party, ₹2495 |
| Girls Party Dress with Embroidery | Lilliput World | ₹2,295 | White embroidered party dress, regular fit, suitable for birthday party. |
| Girls Party Wear Dress with Floral Rosette Detail, Pink | MiniKlub | ₹764 | Pink polyester party wear dress with floral rosette, fits birthday party occasion. |
| Girls High Fashion Party Dress | Styleunion | ₹799 | Polyester party dress, embellished, suitable for 6-year-old girl's birthday party. |

Rerank: main scored 36, kept 34, dropped 2 [score 0.33 (casual category); score 0.30 (not a dress category)]

Timings: understand 1844ms, search 1792ms, curate 4545ms, total 8181ms · tokens 11545/1915 · $0.00611

## 7. old money look for men

Intent:
```json
{"kind":"vibe","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"classic understated menswear in muted neutral tones","colors":{"include":["beige","navy","off-white"],"exclude":[],"strength":"prefer"},"softPreferences":["quiet luxury","classic","muted neutrals"]}
```

Chips: `Men` `~ Beige / nude` `~ Navy` `~ Off-white / ivory / cream` `~ quiet luxury` `~ classic` `~ muted neutrals`

Stylist note: For an old money look for men, focus on timeless, well-tailored pieces in muted neutrals like beige, navy, and off-white. These colors exude quiet luxury and sophistication without being flashy. Opt for natural fabrics like cotton and linen blends suitable for year-round wear in India.

- Classic Shirts — Essential for a refined, timeless wardrobe
- Tailored Trousers — Completes the polished, old money silhouette
- Lightweight Blazers — Adds structure and sophistication

### Rail `rail-2` — Tailored Trousers (12 shown, 1008 found)

- q: `men's tailored trousers beige navy off-white cotton linen linen blend solid formal office`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 1008 found/75 usable (1352ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men Beige 100% Linen Slim Fit Textured Flat Front Formal Trousers | Louis Philippe | ₹4,894 | Beige, 100% linen, slim fit, textured, formal and office wear matches old money look. |
| Men Linen Blend Navy Slim Fit Solid Formal Trousers | Louis Philippe | ₹3,555 | Navy slim fit formal trousers, wool-linen blend, solid, office wear fits old money look |
| Men's Navy Blue Regular Fit Solid Formal Trousers | TIGC | ₹939 | Navy, cotton blend, solid, formal, office wear, regular fit, low price |
| Men's Navy Blue Cotton-Linen Pleated Tapered Cropped Trousers | Jack & Jones | ₹1,749 | Navy cotton-linen tapered trousers, solid, office wear, regular fit, classic fabric |
| Rare Rabbit Men's Arcelo-Ss26 Off White 100% Linen Fabric Regular Fit Plain Trouser | The House Of Rare | ₹5,499 | Off white, 100% linen, solid, formal/business, fits old money look |
| Men's Navy Slim Fit Cotton Blend Trousers | Celio | ₹3,999 | Navy, slim fit, cotton blend, solid, office wear, casual category lowers score |
| Men Linen Blend Beige Regular Fit Solid Casual Trousers | Louis Philippe | ₹2,694 | Beige cotton-linen casual trousers, solid, office wear, regular fit, relaxed style |
| Men's Linen Cotton Casual Wear Regular Fit Pants/Cottonworld | Cottonworld | ₹3,790 | Natural color linen cotton relaxed fit, solid pattern, casual wear, fits beige/nude preference |
| Beige Front Pleated Wide Leg Trouser | Outzidr | ₹2,199 | Beige, tailored, solid, office/formal but fabric not specified and wide leg not slim fit. |
| Men's Linen Cotton Casual Wear Regular Fit Pants/Cottonworld | Cottonworld | ₹3,790 | Black linen cotton relaxed fit, casual not formal, misses beige/navy/off-white colors |

### Rail `rail-1` — Classic Shirts (12 shown, 2845 found)

- q: `classic men's shirts in beige navy off-white cotton linen cotton blend solid striped formal office casual`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 2845 found/63 usable (1352ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men Beige Classic Fit Stripe Full Sleeves Formal Shirt | Louis Philippe | ₹1,968 | Beige 100% cotton, tailored fit, striped, formal/office wear aligns with old money classic style |
| Men Beige Classic Fit Stripe Half Sleeves Formal Shirt | Louis Philippe | ₹2,182 | Beige linen blend, tailored fit, striped, formal, classic style at ₹2182 |
| Carletti Navy Cotton Classic Fit Formal Solid Shirt | Zodiac Online | ₹12,641 | Navy, 100% cotton, tailored fit, solid, formal and office wear matches old money look. |
| Men's Premium Cotton Linen Regular Fit Beige Shirt Harbor | Minister White | ₹1,595 | Beige solid cotton linen, regular fit, formal and office wear, classic and muted color fits old money style. |
| Men Linen Blend White Classic Fit Solid Formal Shirt | Louis Philippe | ₹3,114 | White linen blend, tailored fit, solid, formal, classic Louis Philippe at ₹3114 |
| Beige Plain Cotton Linen Shirt | Banana Club | ₹1,799 | Beige solid cotton linen blend, regular fit, casual and office wear, muted neutral fabric fits old money look. |
| Men's Beige Slim Fit Striped Formal Shirt | TIGC | ₹919 | Beige cotton blend, slim fit, striped, formal/office wear matches tailored old money look |
| Beige Cotton Striped Shirt | Jack & Jones | ₹1,649 | Beige striped 100% cotton, regular fit, casual and office wear, classic striped pattern suits old money style. |
| Mens Cotton Linen White Regular Fit Shirt Linen Classic | Minister White | ₹1,695 | White cotton linen, regular fit, solid, office/formal, classic style at ₹1695 |
| Carletti White Cotton Classic Fit Formal Solid Shirt | Zodiac Online | ₹6,320 | White cotton, tailored fit, solid, formal and office wear fits classic old money style. |

### Rail `rail-4` — Lightweight Blazers (12 shown, 46 found)

- q: `men's lightweight blazers navy beige off-white linen cotton cotton blend solid formal office party`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 46 found/99 usable (1352ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men's Navy Slim Fit Cotton Blazer | Celio | ₹9,999 | Navy slim fit cotton blend, solid, formal and party use, tailored fit suits old money look. |
| Men's Beige Slim Fit Cotton Blazer | Celio | ₹9,999 | Beige slim fit cotton blend, solid, formal use, tailored fit matches old money look. |
| Blue Knit Shawl Collar Blazer | Jack & Jones | ₹2,499 | Navy blue, cotton fabric, slim fit, solid pattern, formal and office use. |
| Rare Rabbit Men's Voyage Navy Rayon Plain Tailored Fit Full Sleeve Lapel Neck Blazer | The House Of Rare | ₹4,959 | Navy, tailored fit, solid pattern, formal/office use fits old money look for men |
| Coffee Co-Linen Men's Relaxed Blazer Jacket Set | Saphed | ₹17,499 | Linen blend, coffee color, relaxed fit, solid, office/party use fits old money look. |
| Men's Navy Blue Silk Blend Blazer | Vastramay | ₹16,917 | Navy tailored blazer in silk blend, embellished pattern, party use; less classic due to embellishment. |
| Coffee Co-Linen Men's Relaxed Blazer Jacket | Saphed | ₹8,749 | Linen-cotton blend, solid pattern, relaxed fit; coffee color less preferred. |
| Men's Navy Blue Bafta Embossed Blazer | Vastramay | ₹24,747 | Navy tailored blazer, abstract pattern, formal/party; abstract pattern less classic old money style. |
| Kai Linen Men's Relaxed Blazer Jacket | Saphed | ₹11,249 | Linen fabric and solid pattern match; green color less preferred; relaxed fit less tailored. |
| Rare Rabbit Men's Rewind Dark Navy Checked Print Tailored Fit Full Sleeve Lapel Neck Blazer | The House Of Rare | ₹5,499 | Dark navy, tailored fit, but checked pattern not preferred for old money look |

Rerank: rail-2 scored 18, kept 13, dropped 5 [score 0.30 (poly wool; relaxed fit); score 0.33 (loose fit; casual use); score 0.20 (color); score 0.25 (polyester)] · rail-1 scored 18, kept 18, dropped 0 · rail-4 scored 18, kept 13, dropped 5 [score 0.15 (polyester; black); score 0.20 (pattern: paisley; fabric: velvet); score 0.30 (pattern checked); score 0.25 (fabric polyester; category 2-piece suits)]

Timings: understand 3747ms, plan 4059ms, search 1364ms, curate 2719ms, total 11890ms · tokens 17594/3606 · $0.01123

## 8. linen shirt that doesn't need much ironing

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"linen shirt that is easy to maintain and does not require much ironing","categories":{"include":["shirt"],"exclude":[],"strength":"must"},"fabrics":{"include":["linen"],"exclude":[],"strength":"must"},"textExclusions":["needs much ironing","high maintenance","wrinkles easily"],"softPreferences":["easy care","low maintenance","wrinkle resistant"]}
```

Chips: `Shirt` `Linen` `✕ needs much ironing` `✕ high maintenance` `✕ wrinkles easily` `~ easy care` `~ low maintenance` `~ wrinkle resistant`

### Rail `main` (24 shown, 813 found)

- q: `linen shirt that is easy to maintain and does not require much ironing`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 813 found/88 usable (550ms)

| title | brand | price | reason |
|---|---|---:|---|
| Easy Iron Linen Rich Performance Shirt | Marks & Spencer | ₹4,499 | 55% linen, 45% polyester, easy iron, wrinkle resistant, light blue, casual/office |
| MOTIF EMBROIDERED LINEN SHIRT | Dash and Dot | ₹8,738 | Black linen, relaxed fit, casual/office wear; linen matches, no ironing info |
| Short Sleeved Linen Shirt | Lacoste | ₹13,050 | Light blue linen, regular fit, casual/daily wear; no ironing info, pricey |
| Relaxed Fit Linen Shirt | Lacoste | ₹12,500 | Blue linen, relaxed fit, casual/daily wear; no ironing info, pricey |
| Relaxed Fit Linen Shirt in Black | 11.11 | ₹19,900 | Black linen, relaxed fit, casual/daily wear; no ironing info, highest price |
| Anant Linen Shirt · Black | Anita Dongre | ₹8,400 | 100% linen, regular fit, black, suitable for office, no ironing info |
| Short Sleeved Linen Shirt | Lacoste | ₹13,050 | Blue linen shirt, regular fit, casual use; no info on low maintenance or wrinkle resistance |
| Praiano Royal Solid Half Sleeve Classic Fit Semi Formal European Flax Linen Shirt | Zodiac Online | ₹5,266 | European flax linen, tailored fit, royal blue, office wear, no ironing info |
| Grey And Yellow Linen Check Shirt | Heniis | ₹3,099 | Linen fabric, casual/office wear, no ironing info but linen usually wrinkles |
| dash and dot · Linen Stripe popover shirt | Dash and Dot | ₹5,613 | 100% linen, casual/office wear, no ironing info, linen prone to wrinkles |

Rerank: main scored 36, kept 36, dropped 0

Timings: understand 4284ms, search 570ms, curate 4678ms, total 9533ms · tokens 11476/1825 · $0.00594

## 9. saree for farewell — elegant, not too heavy

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"elegant lightweight saree for a college farewell","categories":{"include":["saree"],"exclude":[],"strength":"must"},"useCases":{"include":["family-gathering"],"exclude":[],"strength":"prefer"},"textExclusions":["heavy embroidery"],"softPreferences":["elegant","lightweight"]}
```

Chips: `Women` `Saree` `~ Family Gathering` `✕ heavy embroidery` `~ elegant` `~ lightweight`

### Rail `main` (17 shown, 123 found)

- q: `elegant lightweight saree for a college farewell family gathering`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 123 found/158 usable (799ms)

| title | brand | price | reason |
|---|---|---:|---|
| Elegant Lavender Handloom Linen Tissue Cotton Saree Soft Lightweight Traditional Wear | Gopikanya | ₹2,999 | Lightweight tissue cotton, lavender color, elegant and suitable for traditional occasions. |
| Chiku handloom linen tissue saree for a timeless elegant festive look | Gopikanya | ₹2,999 | Linen tissue saree, lightweight, elegant, suitable for farewell; ₹2999 |
| Elegant Pink Handloom Linen Cotton Saree for a Classy Traditional Look | Gopikanya | ₹2,999 | Linen cotton, solid pink, elegant and lightweight for farewell |
| Light Blue Organza Silk Saree | Nalli | ₹18,743 | Light blue organza silk saree, lightweight and elegant, suitable for farewell. |
| Khadi Cotton Saree With Elegant Jhallar Border Paired With A Katha Work Modal With Mina & Zhallar | Karagiri | ₹4,399 | Cotton fabric, elegant border, suitable for party, lightweight but for wedding/festive |
| Khadi Cotton Saree With Elegant Jhallar Border Paired With A Katha Work Modal With Mina & Zhallar | Karagiri | ₹4,399 | Cotton fabric, elegant border, lightweight, suitable for party, mint green color |
| Radiant Off White Weaving Work Art Silk Classic Saree | Sareesbazaar | ₹59 | Off white art silk saree with weaving work, suitable for party but heavier fabric. |
| Ivory Floral Frame Saree | House of Masaba | ₹34,000 | Flowy printed saree in ivory, elegant but festive, no heavy embroidery noted. |
| Light Gold Elegant Handloom Saree | Kalki | ₹89,995 | Silk saree, elegant but very expensive and possibly heavy for farewell. |
| Pink Satin Floral Silver Stonework Saree With Matching Blouse Piece | Koskii | ₹2,694 | Pink satin saree with floral stonework, heavier fabric and party use, less elegant for farewell. |

Rerank: main scored 36, kept 17, dropped 19 [heavy embroidery; heavy embroidery; heavy embroidery; heavy embroidery]

Timings: understand 2840ms, search 805ms, curate 2128ms, total 5773ms · tokens 11718/1829 · $0.00604

## 10. high waist squat-proof gym leggings

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"high waist squat-proof gym leggings for women","categories":{"include":["legging"],"exclude":[],"strength":"must"},"useCases":{"include":["gym","sports-active"],"exclude":[],"strength":"must"},"softPreferences":["squat-proof","high waist"]}
```

Chips: `Women` `Legging` `Gym/Workout` `Sports/Active` `~ squat-proof` `~ high waist`

### Rail `main` (24 shown, 266 found)

- q: `high waist squat-proof gym leggings for women`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 266 found/64 usable (592ms)

| title | brand | price | reason |
|---|---|---:|---|
| Slim Fit High Rise Leggings | Styleunion | ₹699 | Black slim high-rise leggings, nylon/spandex, for sports, likely squat-proof |
| Alcis Run Women Full Length Leggings | Alcis Sports | ₹749 | Full length, slim fit, polyester-spandex, sports/gym use; likely squat-proof, high waist implied |
| High-Waist Everyday Cotton Blend Leggings with Pockets | Kica Active | ₹779 | High waist, black cotton spandex leggings, suitable for sports and daily wear. |
| High Waist Tights in Black with 3 Pockets & Loops Online | Clovia | ₹1,099 | High waist, black, sports use, suitable for gym; no fabric info, no squat-proof stated |
| Alcis Women Purple High-Rise Cropped Tights | Alcis Sports | ₹880 | Polyester slim purple tights, high-rise, for sports/gym, likely squat-proof |
| High Rise Solid Leggings | Benetton | ₹2,099 | High rise, black, solid, workouts use; viscose-nylon-elastane blend suitable for gym |
| Alcis Women Solid Ankle Length High-Rise Tights | Alcis Sports | ₹999 | High-rise, slim fit, polyester, sports/gym use; tights category but fits gym needs |
| Enamor Cut N Sew Leggings, Slim Fit, High Waist · A611 (Navy) | Enamor | ₹1,499 | Leggings, high waist, slim fit, sports use, polyester/spandex fabric |
| Enamor Cut N Sew Leggings, Slim Fit, High Waist · A611 (Purple Haze) | Enamor | ₹1,499 | Leggings, high waist, slim fit, sports use, polyester/spandex fabric |
| Enamor Cut N Sew Leggings, Slim Fit, High Waist · A611 (Jet Black) | Enamor | ₹1,499 | Leggings, high waist, slim fit, sports use, polyester/spandex fabric |

Rerank: main scored 36, kept 31, dropped 5 [score 0.33 (knee length); score 0.33 (knee length); score 0.25 (not leggings); score 0.25 (not leggings; not high waist)]

Timings: understand 1824ms, search 599ms, curate 2648ms, total 5071ms · tokens 11687/1866 · $0.00609

## 11. winter jacket for Manali in December, warm but not bulky, women

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"explicit"},"semanticQuery":"warm but not bulky winter jacket for women for Manali in December","categories":{"include":["jacket"],"exclude":[],"strength":"must"},"useCases":{"include":["winter","travel"],"exclude":[],"strength":"prefer"},"softPreferences":["warm","not bulky"]}
```

Chips: `Women` `Jacket` `~ Winter/Cold Weather` `~ Travel/Vacation` `~ warm` `~ not bulky`

### Rail `main` (24 shown, 3 found)

- q: `warm but not bulky winter jacket for women for Manali in December travel`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 3 found/53 usable (645ms)

| title | brand | price | reason |
|---|---|---:|---|
| Women Black Solid Hooded USB Intelligent Heating Jacket | Monte Carlo | ₹3,597 | Women's black polyester blend hooded heating jacket, warm and suitable for winter travel |
| Women Maroon Hooded 3-in-1 Puffer Jacket with Reversible Sleeveless Jacket | Monte Carlo | ₹4,617 | Maroon, warm polyester blend, hooded 3-in-1 jacket suitable for winter travel. |
| Solid Black Fleece Winter Jacket · Unisex | Bombay Trooper | ₹1,875 | Black sherpa fleece, regular fit, warm winter wear, unisex suitable for women |
| Women Navy Blue Hooded 3-in-1 Puffer Jacket with Reversible Sleeveless Jacket | Monte Carlo | ₹4,617 | Navy blue, warm polyester blend, hooded, suitable for winter travel, not bulky |
| Women Winter Sports Oversized Windcheater Hooded Jacket Camel | Chkokko | ₹1,499 | Polyester, oversized fit, camel teal, winter sports wear, warm but possibly bulky |
| Women's Wine and Purple Solid Reversible Winter Jacket | Cantabil | ₹1,699 | Wine reversible nylon jacket, warm and casual for winter wear, lightweight fit. |
| Long Oversized Packable Water-Repellent Parka | Lacoste | ₹25,850 | Packable, water-repellent parka, travel and winter wear, warm but possibly bulky, multi color |
| Heat-X Polair Fleece High Neck Jacket · Comfort Stretch with Welt Pockets | Styleunion | ₹899 | Women black fleece jacket, polyester, casual winter travel wear, warm and less bulky |
| Women Warm Beige Quilted Silk Viscose Wrap Jacket · Day to Evening Layering | Genes Lecoanet Hemant | ₹8,999 | Silk viscose, relaxed tailored fit, warm beige, suitable for day/evening, not bulky |
| Swag Wali Santa Womens Jacket · For Christmas Lovers | Neofaa | ₹1,299 | Women's white blazer-style jacket, tailored, casual/festive, light fabric rayon |

Rerank: main scored 36, kept 26, dropped 10 [score 0.15 (men's item); score 0.30 (men's item; polyester); score 0.15 (men's item); score 0.15 (not warm enough; not jacket style)]

Timings: understand 1913ms, search 650ms, curate 3051ms, total 5614ms · tokens 11586/1897 · $0.0061

## 12. gift for my dad's 60th birthday under 3000

Intent:
```json
{"kind":"gift","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"explicit"},"semanticQuery":"classic gift for an older man","price":{"min":null,"max":3000,"strength":"must"},"softPreferences":["classic","understated"],"occasion":{"name":"60th birthday","location":null,"timeOfYear":null,"role":"father"}}
```

Chips: `Men` `Under ₹3,000` `~ classic` `~ understated`

Stylist note: For your dad's 60th birthday, classic and understated gifts work best, reflecting his mature style and personality. September in most parts of India is still monsoon season, so consider practical yet elegant items he can use daily. With a budget of ₹3000, focus on quality over quantity, choosing one or two meaningful pieces.

- Classic Accessories — Timeless pieces enhance mature style
- Refined Ethnic Wear — Traditional yet subtle for special occasions

### Rail `rail-3` — Refined Ethnic Wear (0 shown, 10 found)

- q: `men's classic kurta set or Nehru jacket in subtle colors beige off-white navy cotton linen solid`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 2 found/2 usable (1003ms) → 10 found/8 usable (621ms) · relaxed: price-20
- note: Few exact matches, so also showing a few up to ₹1,560.

| title | brand | price | reason |
|---|---|---:|---|

### Rail `rail-1` — Classic Accessories (12 shown, 13 found)

- q: `classic men's leather watch or belt for mature style black brown navy metal solid daily wear`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 13 found/34 usable (1003ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men Metallic Buckle Solid Leather Belt | U.S. Polo Assn. | ₹1,399 | Navy leather belt, solid pattern, daily/formal wear, ₹1399 under ₹1500 budget |
| Men's Brown Solid Belt | Levi's | ₹899 | Brown genuine leather, solid, casual/daily wear, under ₹1500 budget |
| Men Black Solid Leather Casual Belt | Louis Philippe | ₹1,474 | Black leather belt, solid pattern, casual daily wear, ₹1474 under ₹1500 budget |
| Men Black Trento Solid Leather Belt | U.S. Polo Assn. | ₹1,499 | Black leather, solid, formal/office wear, ₹1499 under ₹1500 budget |
| Men Black Leather Belt | Spykar | ₹489 | Black genuine leather, solid, daily/formal wear, ₹489 under ₹1500 budget |
| Chocolate Brown Leather Belt | Jack & Jones | ₹1,099 | Chocolate brown solid leather belt, casual/daily wear/office, under ₹1500, classic style |
| Men Brown Solid Leather Formal Belt | Louis Philippe | ₹1,379 | Brown leather, solid pattern, formal belt at ₹1379 under ₹1500 for dad's 60th birthday |
| Men Brown Solid Leather Casual Belt | Louis Philippe | ₹1,179 | Brown leather, solid, casual/daily wear, under ₹1500 budget |
| Brown Timeless Leather Belt | Femmella | ₹999 | Brown leather, solid pattern, casual/daily wear, ₹999 under ₹1500 budget |
| Black Basic Textured Leather Belt | Jack & Jones | ₹849 | Black 100% leather belt, casual/daily wear, under ₹1500, classic and understated |

Rerank: rail-3 scored 8, kept 0, dropped 8 [score 0.25 (polyester; gold color); score 0.25 (polyester; yellow color); score 0.20 (polyester; green color); score 0.20 (polyester; violet color)] · rail-1 scored 18, kept 15, dropped 3 [score 0.25 (faux leather; tan color; textured pattern); score 0.30 (color); score 0.30 (color not preferred)]

Timings: understand 2019ms, plan 3092ms, search 1629ms, curate 2338ms, total 9077ms · tokens 11872/2091 · $0.00652

## 13. office wear for a pear body type

Intent:
```json
{"kind":"browse","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"office wear for pear body type","useCases":{"include":["office"],"exclude":[],"strength":"prefer"},"softPreferences":["pear body type"],"bodyType":"pear","needsClarification":{"question":"Who are you shopping for?","options":["Women","Men","Kids"]}}
```

Chips: `~ Office/Work` `~ pear body type`

Clarify: Who are you shopping for? [Women / Men / Kids]

Stylist note: For office wear suitable for a pear body type, focus on balancing proportions by emphasizing the upper body with structured tops and darker, streamlined bottoms. September in India is still warm in many regions, so breathable fabrics like cotton blends and light silks work well. Stick to classic colors like navy, black, white, and subtle prints for a professional look.

- Structured Tops — Balance wider hips with fitted, detailed tops
- Streamlined Bottoms — Slim, dark bottoms minimize hip width
- Light Outerwear — Adds structure and balances silhouette
- Comfortable Footwear — Complete office look with practical shoes

### Rail `rail-1` — Structured Tops (12 shown, 96 found)

- q: `structured fitted tops for pear body office wear white navy black pastel cotton blend silk blend`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 96 found/39 usable (1756ms)

| title | brand | price | reason |
|---|---|---:|---|
| Crisp White Structured Shirt | Kalki | ₹5,799 | White, tailored solid formal shirt, office wear; fits pear body preference |
| Cotton Structured Cruiser Shirt | Styleunion | ₹699 | French blue, 100% cotton, structured regular fit, solid, office/formal wear |
| Full sleeves Slim Fit Black Structured Striper Shirt | Killer Jeans | ₹1,519 | Black cotton slim fit striped shirt, structured, office wear, fits pear body |
| Full sleeves Slim Fit Navy Structured Striper Shirt | Killer Jeans | ₹1,599 | Navy blue cotton slim fit striped shirt, structured, office wear, fits pear body |
| Structured Pleated AirLinen™ Black Top for Women | Cove and Lane | ₹1,599 | Black, AirLinen™, classic regular fit, solid, office wear; structured fit preferred |
| Cotton Structured Camp Collar Shirt | Styleunion | ₹599 | Black, 100% cotton, structured regular fit, solid, office wear; pear body suitable |
| Deep Navy Structured Shirt | Kalki | ₹4,599 | Navy blue tailored solid shirt, office/formal, fits pear body structured preference |
| White Structured Top | ONLY | ₹1,049 | White viscose fit & flare top, solid pattern, office wear, structured fit suits pear body |
| Full Sleeves Slim Fit White Structured Checks Shirt | Killer Jeans | ₹1,759 | White slim fit cotton printed shirt, office wear, fits pear body structured preference |
| Blue Cotton Structured Shirt | Fail | ₹1,699 | Blue cotton, relaxed fit, solid, office wear but not preferred colors or fitted |

### Rail `rail-3` — Light Outerwear (11 shown, 334 found)

- q: `structured blazer cardigan for pear body office wear black navy grey cotton blend linen blend solid`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 334 found/26 usable (1756ms)

| title | brand | price | reason |
|---|---|---:|---|
| Blair Black Structured Longline Blazer | Lea Clothing | ₹4,741 | Black color, structured tailored fit, solid pattern, office wear suitable for pear body |
| Men Grey 100% Premium Linen Slim Fit Solid Casual Blazer | Louis Philippe | ₹11,569 | Grey, 100% linen, slim fit blazer suitable for office, matches color and fabric preferences. |
| Women Grey Solid Cardigan | Monte Carlo | ₹1,836 | Grey solid cardigan, modal nylon, regular fit, suitable for office wear. |
| Navy Blue Structured Blazer | VERO MODA | ₹7,999 | Navy blue color, solid pattern, office wear but polyester blend fabric, regular fit |
| Dark Peach Structured Linen Blend Blazer | Fail | ₹2,499 | Linen blend fabric, solid pattern, office wear but dark peach color less preferred |
| Beige Structured Linen Blend Blazer | Fail | ₹2,499 | Linen blend fabric, solid pattern, office wear but beige color less preferred |
| Grey Solid Blazer | Zink London | ₹499 | Grey solid blazer, tailored fit, polyester blend, office wear suitable. |
| Carmella Cherry Structured Blazer With Shawl | Lea Clothing | ₹6,546 | Structured, tailored blazer in solid pattern for office but burgundy color not preferred. |
| Men Navy Regular Fit Solid Casual Blazer | Louis Philippe | ₹12,459 | Navy wool regular fit solid blazer, casual/office use, navy preferred but wool not. |
| Men Black Regular Fit Solid Casual Blazer | Louis Philippe | ₹10,679 | Black wool regular fit solid blazer, casual/office use, black preferred but wool not. |

### Rail `rail-4` — Comfortable Footwear (12 shown, 56 found)

- q: `comfortable classic office heels loafers for pear body black brown navy leather faux leather solid`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 56 found/37 usable (1756ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men Black Comfortable Slip on Leather Loafers | Monte Carlo | ₹3,999 | Black leather penny loafers, solid pattern, formal office wear, comfortable fit |
| Men Black Solid Loafers Formal Premium Leather Light Weight Breathable Lining Slip Resistant Flexible Toe Shoes | Louis Philippe | ₹2,949 | Black leather loafers, solid color, office wear, classic style, fits pear body preference. |
| Men Navy Solid Loafers Casual Imported Premium Leather Light Weight Breathable Lining Slip Resistant Flexible Toe Shoes | Louis Philippe | ₹2,949 | Navy leather loafers, solid color, office wear, classic style, fits pear body preference. |
| Leather Brown Solid Slip On Shoes · Argent | Blackberrys | ₹5,999 | Brown leather slip-ons, solid, office wear, classic style fits pear body type preference. |
| Now Mens Black Solid Round Toe Casual Leather Slipon Shoes | Inc.5 | ₹4,290 | Black leather slip-ons, solid, casual and office wear suitable for pear body type. |
| Now Mens Brown Solid Round Toe Casual Leather Slipon Shoes | Inc.5 | ₹1,476 | Brown leather slip-ons, solid, casual and office wear suitable for pear body type. |
| Women's Comfortable Solid Black Pump | Carlton London | ₹1,439 | Black solid pumps, office wear, comfortable style suits pear body type preference. |
| Men Brown Lace Up Leather Sneakers · Stylish & Comfortable | Monte Carlo | ₹2,914 | Brown leather lace-up sneakers, solid, office wear and casual, comfortable fit |
| Leather Brown Solid Sneakers · Venice | Blackberrys | ₹5,499 | Brown leather sneakers, solid, casual and formal use, less classic for office wear. |
| Mens Navy Blue Solid Lace Up Genuine Leather Casual Sneaker | Monte Carlo | ₹2,500 | Navy leather casual sneaker, solid pattern, casual use; not formal office wear |

### Rail `rail-2` — Streamlined Bottoms (9 shown, 2846 found)

- q: `slim tailored trousers palazzo for pear body office wear black navy grey cotton blend linen blend solid`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 2846 found/66 usable (1756ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men Linen Blend Navy Slim Fit Solid Formal Trousers | Louis Philippe | ₹3,555 | Navy, linen blend, slim fit, solid pattern, office wear; matches color, fabric, fit, occasion |
| Navy Blue Linen Blend Solid Slim Fit Pants For Men Online | Celio | ₹3,499 | Navy blue, linen blend, straight fit, solid pattern, office wear; fit less slim but straight is preferred |
| Cotton Blend Slim Fit Cropped Trousers | Marks & Spencer | ₹599 | Cotton blend slim fit trousers, solid pattern, suitable for office, matches fabric and fit |
| Straight Fit Mid Rise Solid Trousers | Benetton | ₹3,149 | Beige solid straight fit trousers with cotton linen blend fabric for office wear |
| Tailored Fit 360 Flex Pleated Trousers | Marks & Spencer | ₹2,349 | Black tailored slim fit trousers, solid and office wear, polyester blend not preferred. |
| Men Black Slim Fit Textured Flat Front Formal Trousers | Louis Philippe | ₹2,099 | Black, slim fit, solid color but polyester blend and textured pattern; fabric and pattern less preferred |
| Men's Navy Slim Fit Cotton Blend Trousers | Celio | ₹3,999 | Navy slim fit cotton blend trousers, office wear but men's item, not pear-specific. |
| Black Mid Rise Slim Fit Pants | Jack & Jones | ₹1,899 | Black, slim fit, solid, office wear but polyester blend, not cotton/linen blend. |
| Cotton Blend Slim Fit Ankle Grazer Trousers | Marks & Spencer | ₹1,199 | Blue cotton blend slim fit trousers, solid pattern, office wear but color not preferred |

Rerank: rail-1 scored 18, kept 15, dropped 3 [score 0.28 (color not preferred; occasion not office); score 0.25 (polyester); score 0.20 (occasion; pattern)] · rail-3 scored 18, kept 11, dropped 7 [score 0.30 (men's item); score 0.28 (men's item; polyester fabric); score 0.15 (men's item); score 0.15 (men's item; polyester)] · rail-4 scored 18, kept 12, dropped 6 [score 0.30 (non-leather); score 0.15 (non-leather; colorblock; not office wear); score 0.15 (not office wear; wrong color; wrong fabric; pattern colorblock); score 0.15 (not office wear; wrong color; wrong fabric; pattern colorblock)] · rail-2 scored 18, kept 9, dropped 9 [score 0.15 (brown color; textured pattern); score 0.25 (red color); score 0.25 (red color); score 0.15 (color; occasion)]

Timings: understand 5030ms, plan 3310ms, search 1768ms, curate 3070ms, total 13178ms · tokens 20956/4247 · $0.0136

## 14. navratri garba outfits for a couple

Intent:
```json
{"kind":"occasion","language":"en","audience":{"segment":"unisex","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"navratri garba outfits for a couple","colors":{"include":["multicolor"],"exclude":[],"strength":"prefer"},"patterns":{"include":["mirror-work","embellished"],"exclude":[],"strength":"prefer"},"useCases":{"include":["festive","ethnic-traditional"],"exclude":[],"strength":"prefer"},"softPreferences":["bright","traditional","festive"],"occasion":{"name":"navratri garba","location":null,"timeOfYear":"September","role":null}}
```

Chips: `Unisex` `~ Multicolour` `~ Mirror Work` `~ Embellished` `~ Festive` `~ Ethnic/Traditional` `~ bright` `~ traditional` `~ festive`

Stylist note: Navratri in late September is festive and vibrant, with warm weather in most parts of India. Traditional bright colors with mirror work and embellishments are perfect for garba celebrations. Lightweight fabrics like cotton blends or georgette keep you comfortable while dancing.

- Ethnic Wear — Traditional outfits with mirror work for festive garba nights
- Footwear — Comfortable and traditional for dancing all night
- Jewellery — Enhance festive look with ethnic embellishments
- Accessories — Complete look with traditional festive accessories

### Rail `rail-2` — Footwear (12 shown, 253 found)

- q: `comfortable traditional jutti and mojari for garba dancing multicolour mirror work embellished festive ethnic`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 253 found/38 usable (2164ms)

| title | brand | price | reason |
|---|---|---:|---|
| KHADIM Mojari Jutti Ethnic Shoe for Men | Khadims | ₹637 | Multicolor textile mojaris with bold pattern, festive and bright for Garba. |
| Order Golden Ethnic Embellished Flats for Womens Fresh Style | Inc.5 | ₹2,590 | Gold mojaris with embellished pattern, festive use, fits Navratri garba theme |
| Women's Orange Sequin Ethnic Slip On Jutti & Mojari Online | Fausto | ₹799 | Orange fabric mojaris with sequin embroidery, festive and traditional for women's garba. |
| Now Golden Ethnic Embellished Flats for Womens Fit Today | Inc.5 | ₹993 | Gold mojaris, embellished, festive/party use, suitable for Navratri garba |
| Men's Black Sequin Ethnic Slip On Jutti & Mojari Online | Fausto | ₹999 | Black velvet jutti with sequin embellishment, festive and ethnic for men's garba. |
| KHADIM Mojari Jutti Ethnic Shoe for Men | Khadims | ₹685 | Blue textile mojaris with embellishment, festive use fits Garba theme well. |
| Brown Leather Ethnic Jutti With Floral Embroidery And Decorative Stone For Men | Kalki | ₹2,999 | Brown artificial leather juttis with embroidery and stones, festive but less bright. |
| Men's Brown Ethnic Punjabi Jalsa Jutti Mojari Online | Fausto | ₹1,299 | Brown men's mojaris, festive use, laser cut pattern, suitable for garba |
| KHADIM Mojari Jutti Ethnic Shoe for Men | Khadims | ₹637 | Gold textile mojaris with bold pattern, festive for Navratri Garba, unisex fit |
| Womens Black Flats Ethnic Embellished One Toe for Daily Wear | Inc.5 | ₹2,590 | Black mojaris with embellishment, festive and ethnic use, less bright color |

### Rail `rail-3` — Jewellery (12 shown, 422 found)

- q: `mirror work embellished ethnic jewellery for navratri multicolour gold silver festive`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 422 found/96 usable (2164ms)

| title | brand | price | reason |
|---|---|---:|---|
| Festive Hues Enamelled Mirror Details Gold Plated Choker Jewellery Set | Voylla | ₹2,999 | Gold plated choker with enamelled mirror details, festive and ethnic for Navratri. |
| Festive Hues Mirror Work Enamelled Brass Gold Plated Choker Jewellery Set | Voylla | ₹2,999 | Gold plated choker with mirror work and enamel, festive for Navratri Garba. |
| Pyramid Gold Mirror Allure Earring | Isharya | ₹9,499 | Gold danglers with mirror and cz embellishments, festive for Navratri Garba. |
| Nazm Mirror & CZ Silver Long Necklace | Isharya | ₹16,999 | Silver long necklace with mirror and cz, festive and embellished for Navratri. |
| Banjara Style Three Layer Mirror Work Silver Oxidised Choker Necklace | Tjori | ₹1,006 | Silver oxidized choker with three-layer mirror work, festive ethnic style for Navratri. |
| Gold Chaand Baalis With Mirror Polki And Pearls | Kalki | ₹9,998 | Gold jhumkas with mirror polki and pearls, embellished, festive and wedding use. |
| Multi Coloured Gold Necklace for Festive Wear | Kalki | ₹3,490 | Gold multi-coloured necklace, embellished, festive wear for Navratri garba. |
| Festive Hues Mirror and Enamel Details Silver Oxidised Pearls Jewellery Set | Voylla | ₹1,189 | Silver oxidised, mirror and enamel details, embellished festive jewellery under ₹1200. |
| Oxidized Silver Designer Mirror Round Shape With Ghunghru Chain Maangtikka | Tjori | ₹695 | Silver oxidized maangtikka with mirror work, festive and ethnic for Navratri. |
| Silver-Plated Crescent Mirror Earrings | True Browns | ₹4,497 | Silver-toned oxidised earrings, festive, solid pattern, suitable for Navratri garba. |

### Rail `rail-4` — Accessories (11 shown, 38 found)

- q: `mirror work embellished bags and scarves for navratri garba multicolour cotton blend silk blend festive ethnic`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 38 found/54 usable (2164ms)

| title | brand | price | reason |
|---|---|---:|---|
| Okhai 'Sandstone' Pure Cotton Mirror Work Pouch | Okhai | ₹650 | Pure cotton, mirror work pouch in bright orange, festive and ethnic use |
| Tipify Mirror Work Embellished Fabric Potli | Anekaant | ₹4,549 | Multicolor fabric potli with mirror work embellishment fits festive Navratri Garba perfectly. |
| Okhai 'Jane' Pure Cotton Applique Mirror Work Pouch | Okhai | ₹1,250 | Pure cotton, applique mirror work pouch in indigo and pink, festive use |
| Rhea Kapoor Sling Bag · Bombay Tapestry | Zouk | ₹2,079 | Multicolor vegan leather bag with abstract pattern suits festive Navratri Garba use. |
| Droop Mirror Work Quirky Embellished Faux Silk Potli | Anekaant | ₹2,749 | Faux silk, embellished potli in champagne, festive use fits Navratri Garba |
| Okhai 'Bamboo' Pure Cotton Hand Embroidered Mirror Work Pouch | Okhai | ₹650 | Pure cotton, embroidered pouch in pista, casual but some festive appeal |
| Peach Mirror Work Silk Potli With Tassels And Pearl Handle | Kalki | ₹4,867 | Peach raw silk potli with mirror embroidery, festive and ethnic, not multicolour |
| Kaali Bag | Nobordersshop | ₹26,460 | Multicolor mashru silk bag fits festive use but expensive and less common fabric for Navratri. |
| Men's Black Viscose Mirror Work Ethnic Dupatta | Vastramay | ₹4,377 | Black viscose mirror work scarf fits festive Navratri garba but not multicolour or cotton/silk blend |
| Men's Cream Viscose Mirror Work Ethnic Dupatta | Vastramay | ₹4,377 | Cream viscose mirror work scarf fits festive Navratri garba but not multicolour or cotton/silk blend |

### Rail `rail-1` — Ethnic Wear (12 shown, 62 found)

- q: `mirror work lehenga and kurta set for navratri garba multicolour cotton blend georgette embellished festive ethnic`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 62 found/118 usable (2164ms)

| title | brand | price | reason |
|---|---|---:|---|
| Okhai 'Royalty' Mirror Work Cotton Kurta Pant Set | Okhai | ₹3,500 | Cotton, purple, mirror work, kurta set, festive, suitable for Navratri |
| Okhai "Nagma" Handblock Printed Mirrorwork Kurta Pant Set | Okhai | ₹6,700 | Beige hand block printed cotton kurta set with mirror work, festive and ethnic. |
| White Mirror Work Kurta Set With Dupatta | House of Designers | ₹5,990 | White cotton chanderi kurta set with mirror embroidery, festive and ethnic for Garba. |
| Elegant Festive Couple Set · Black Printed Mirror Work Lehenga Choli In Organza Tissue For Her And Black Matka Silk Jodhpuri Set With Mandarin Collar For Him | Kalki | ₹52,994 | Couple set with black organza tissue and matka silk, mirror work, festive use |
| Okhai 'Together' Mirror Work Cotton Kurta Pant Set | Okhai | ₹3,500 | Cotton kurta set with mirror work, festive and ethnic, suitable for Navratri Garba. |
| Semi Stitched Marvelous White Mirror Work Georgette Lehenga Choli With Dupatta | Ethnic Plus | ₹5,159 | Georgette, white, embellished lehenga, festive use, suitable for Navratri |
| Green Georgette Lehenga With Mirror Work | Shreeman | ₹18,919 | Green georgette lehenga with mirror work, festive and ethnic for Navratri Garba. |
| XXL Artistic Wine Mirror Work Georgette Readymade Plus Size Lehenga Choli | Ethnic Plus | ₹6,659 | Georgette fabric, wine purple, mirror work, festive lehenga suitable for Navratri Garba |
| Radiant Yellow Georgette Lehenga With Mirror Work Blouse And Dupatta | Kalki | ₹32,995 | Georgette fabric, mirror work, festive lehenga in bright yellow for Navratri Garba. |
| Semi Stitched Impressive Black Georgette Mirror Work Navratri Wear Lehenga Choli | Ethnic Plus | ₹3,119 | Black georgette lehenga with mirror work, festive but single item, no couple set |

Rerank: rail-2 scored 18, kept 16, dropped 2 [score 0.20 (no embroidery; not festive enough); score 0.30 (not bright color)] · rail-3 scored 18, kept 18, dropped 0 · rail-4 scored 18, kept 11, dropped 7 [score 0.20 (grey color); score 0.30 (grey color); score 0.20 (not multicolour; not cotton blend); score 0.30 (not multicolor; not cotton or silk blend)] · rail-1 scored 18, kept 16, dropped 2 [score 0.30 (not cotton or georgette; over budget implied); score 0.30 (not cotton blend; not georgette)]

Timings: understand 2276ms, plan 3670ms, search 2182ms, curate 2688ms, total 10817ms · tokens 21223/4328 · $0.01384

## 15. white shirt

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"white shirt","categories":{"include":["shirt"],"exclude":[],"strength":"must"},"colors":{"include":["white"],"exclude":[],"strength":"must"},"needsClarification":{"question":"Who are you shopping for?","options":["Women","Men","Kids"]}}
```

Chips: `Shirt` `White`

Clarify: Who are you shopping for? [Women / Men / Kids]

### Rail `main` (24 shown, 3346 found)

- q: `white shirt`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 3346 found/115 usable (427ms)

| title | brand | price | reason |
|---|---|---:|---|
| Tricolour Crest 100% Linen Breathable White Shirt | Louis Philippe | ₹3,826 | 100% linen, tailored fit, white, formal office wear, ₹3826 fits white shirt request |
| Tricolour Crest Wrinkle-free Premium Cotton White Shirt | Louis Philippe | ₹3,292 | 100% cotton, tailored fit, white, formal/business shirt, ₹3292 fits white shirt request |
| Tri-color Crest Wrinkle-free Textured White Shirt | Louis Philippe | ₹3,092 | 100% cotton, tailored fit, white textured shirt for formal/office wear at ₹3092. |
| Otto Supima Cotton White Shirt | Mulmul | ₹7,950 | Supima cotton, tailored fit, white, suitable for casual and office wear at ₹7950. |
| Crisp white shirt (PL-28) | Kapraaha | ₹4,623 | 100% cotton, comfortable fit, white, embroidered, good for casual and office wear at ₹4623. |
| Basalt Shirt · White Embroidered | Nicobar | ₹5,000 | 100% cotton, white embroidered, regular fit, suitable for office and festive wear. |
| Regular Fit 100% Cotton Spread Collar Shirt · White | Celio | ₹2,599 | 100% cotton, regular fit, white solid shirt for casual/office wear at ₹2599 |
| Men’s Pinpoint Oxford Shirt White · Essential Office Shirt | Vahro | ₹2,599 | 100% cotton, white pinpoint formal shirt, regular fit, office wear at ₹2599 |
| Solid Full Sleeve Shirt · White | Wrogn | ₹1,249 | White pure cotton regular fit full sleeve shirt, casual and office wear at ₹1249. |
| Romy Supima Cotton White Shirt | Mulmul | ₹7,950 | White supima cotton tailored shirt, suitable for office and casual wear at ₹7950. |

Rerank: main scored 36, kept 36, dropped 0

Timings: understand 1873ms, search 433ms, curate 2387ms, total 4693ms · tokens 11315/1942 · $0.00763

## 16. kurti

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"kurti","categories":{"include":["kurti"],"exclude":[],"strength":"must"},"needsClarification":{"question":"Who are you shopping for?","options":["Women","Men","Kids"]}}
```

Chips: `Kurti`

Clarify: Who are you shopping for? [Women / Men / Kids]

### Rail `main` (24 shown, 657 found)

- q: `kurti`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 657 found/79 usable (412ms)

| title | brand | price | reason |
|---|---|---:|---|
| Tempting WSR266 Sarvani Handblock Print Short Kurti Online | Kusvaa | ₹7,300 | Cotton straight kurti in cerulean blue and pink, good for casual and office wear. |
| Elegant Peach Ethnic Kurti · Soft & Stylish Fit | Label Flavia | ₹3,996 | Cotton, regular fit, peach floral kurti suitable for daily and special occasions. |
| Dharan "Bundki Kurti" Blue Block Printed Top | Okhai | ₹2,500 | 100% cotton, straight fit, blue block printed kurti for festive and daily wear. |
| Earth’s Pulse Blockprinted Cotton Kurti | Chidiyaa | ₹2,690 | Cotton, regular fit, maroon blockprinted kurti for daily and festive occasions. |
| Night’s Sigh Block printed Cotton Kurti | Chidiyaa | ₹2,890 | Cotton block printed kurti, relaxed fit, casual and festive use |
| Satabdi Block Printed Cotton Kurti | Chidiyaa | ₹2,690 | Cotton, regular fit, hand block printed, suitable for daily/office wear at ₹2690 |
| Black Patola Print Silk Long Kurti | Kalki | ₹17,500 | Black silk kurti with patola print, suitable for festive and cultural events. |
| Blue Chanderi Kurti With Purple Block Print | Kalki | ₹8,750 | Blue chanderi kurti with purple block print, flowy fit for festive and party wear. |
| Mustard Silk Kurti With Multicolor Patola Print | Kalki | ₹10,150 | Mustard silk kurti with multicolor patola print, flowy for festive and traditional events. |
| Plus Size Mint Green Floral Printed Cotton Kurti for Women | Label Flavia | ₹4,996 | Cotton, relaxed fit, mint green floral print, casual daily wear, suitable kurti. |

Rerank: main scored 36, kept 36, dropped 0

Timings: understand 1967ms, search 419ms, curate 2588ms, total 4974ms · tokens 11355/1995 · $0.00616

## 17. kuch accha sa dikhao party ke liye

Intent:
```json
{"kind":"browse","language":"hinglish","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"stylish party wear","useCases":{"include":["party"],"exclude":[],"strength":"prefer"},"softPreferences":["stylish"]}
```

Chips: `Women` `~ Party/Club` `~ stylish`

Stylist note: For a stylish party look in late September, lightweight fabrics like chiffon or satin work well in India's warm climate. Opt for vibrant or classic colors like black, red, or metallics to stand out. Comfortable yet chic footwear and statement accessories complete the ensemble for a night out.

- Party Dresses — Core stylish pieces for party vibes
- Statement Footwear — Complete look with comfortable stylish shoes
- Eye-Catching Accessories — Add sparkle and personality to party outfit

### Rail `rail-1` — Party Dresses (12 shown, 81 found)

- q: `stylish party dresses for women in vibrant or classic colors black red gold silver maroon satin`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 81 found/98 usable (1368ms)

| title | brand | price | reason |
|---|---|---:|---|
| Solid Dyed Draped Dress | Vedikam | ₹15,500 | Maroon satin maxi dress, solid pattern, flowy fit for party evening |
| Red Cocktail Gown With Trail | Bombaim | ₹57,375 | Red satin, fitted, embellished — suitable for party/evening occasions. |
| RED HALF PLEATED BEADED SCARLET DRESS | Chique | ₹2,599 | Scarlet red satin lycra, embellished, party wear, fits color and fabric preferences |
| Kavya Mini Dress for Women · Stylish Mini Dress | Verb by Pallavi Singhee | ₹30,200 | Silver midi dress, embellished, party/evening use fits user preference. |
| Alicia Mini Dress for Women · Stylish Mini Dress | Verb by Pallavi Singhee | ₹29,100 | Golden midi dress, embellished, party/special occasions matches user preferences. |
| Elegant Maroon Evening Dress | Bunaai | ₹2,550 | Maroon modal satin, flowy, solid — good for party/evening/festive wear. |
| Scarlet Bloom Dress | Vedikam | ₹14,485 | Red wrap dress, cotton satin fabric, floral print, suitable for party/festive. |
| Dark Red Floral Printed Velvet Cocktail Dress | Wishful By W | ₹6,580 | Maroon a-line dress, floral pattern, party/evening use but floral not preferred. |
| Lucina Mini Dress for Women · Stylish Mini Dress | Verb by Pallavi Singhee | ₹28,500 | Embellished tulle midi dress for party, but ombre color not preferred |
| Maroon Abstract Print One Shoulder Dress | Vedikam | ₹16,500 | Maroon satin maxi dress for party but abstract print not preferred |

### Rail `rail-3` — Eye-Catching Accessories (12 shown, 737 found)

- q: `statement jewellery and bags for women's party wear gold silver black red metal embellished`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 737 found/81 usable (1368ms)

| title | brand | price | reason |
|---|---|---:|---|
| Midnight Elegance · Black Gold Statement Necklace | Hilo Design | ₹6,500 | Black gold-tone brass statement necklace, embellished, perfect for evening party wear. |
| 925 Silver American Diamond Statement Party Earrings For Women | Ornate Jewels | ₹2,099 | Silver 925 sterling earrings, embellished, party/festive use, ₹2099. |
| Timeless Exclusive Gold Plated Pearl & American Diamond Floral Motif Necklace Set · Luxury Designer Light Weight Statement Jewelry for Women | Estele | ₹1,500 | Gold plated brass necklace set, embellished, ideal for party and festive occasions. |
| Statement Silver x Turquoise Mala | Ayesha Accessories | ₹8,100 | Silver brass fashion jewellery, embellished, festive/party, fits metallic preference |
| 22K Gold Fashion Sets · Premium Plated Elegance | Aadyaa | ₹11,000 | 22k gold plated, embellished, party use, metal fabric fits stylish party jewellery |
| Fool's Gold Textured metal & pyrite Statement swirl earrings | Isharya | ₹6,499 | Gold 18k plated textured metal earrings, statement style for party occasions at ₹6499. |
| statement necklace in shining black and gold tone finish | Voylla | ₹989 | Gold tone, embellished pendant set for party use, metal alloy fabric, ₹989. |
| 18kt Rose Gold Plated CZ Statement Necklace and Earring Set | Carlton London | ₹1,369 | Rose gold plated brass necklace and earring set, embellished, suitable for party occasions. |
| Opulent Gold Finish American Diamond Geometric Floral Necklace Set– Lightweight Statement Jewelry for Engagements & Reception Evenings | Estele | ₹2,000 | Gold finish, brass, embellished necklace for party and evening occasions at ₹2000. |
| Beaded Muse Black Cotton Statement Bow Embellished Clutch | Anekaant | ₹2,799 | Black cotton clutch, embellished, evening/party, fits color and occasion preference |

### Rail `rail-2` — Statement Footwear (12 shown, 20 found)

- q: `stylish heels or sandals for women party wear black gold silver red leather suede`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 20 found/18 usable (1368ms)

| title | brand | price | reason |
|---|---|---:|---|
| Stylish Golden Ethnic Wedge Heels for Womens · Select Trendy | Inc.5 | ₹1,716 | Gold synthetic block heel sandals, embellished, suitable for festive/party occasions. |
| Pelle Nera Diva · Black Suede Studded Toe-Ring Sandal for Women | Dmodot | ₹12,748 | Black suede leather flat sandals, embellished, suitable for party and festive occasions |
| Stylish Womens Golden Ethnic Embellished Wedge Sandals | Inc.5 | ₹3,290 | Gold synthetic embellished flat sandals, festive and party use, regular fit. |
| Womens Black Pumps Suede for Polished Looks · Elegant Select | Inc.5 | ₹2,990 | Black synthetic block heels, solid pattern, party-appropriate, comfortable regular fit. |
| Corko Riva Grazia · Brown Suede Cork Sandals for Women | Dmodot | ₹15,598 | Brown suede flat sandals, solid pattern, suitable for casual/party but not preferred colors |
| Medallion Yellow Ajrakh Cotton Strappy Block Heels In Suede | Tjori | ₹1,169 | Yellow suede block heels with printed pattern, suitable for party but color less preferred |
| Corko Riva Nera · Black Suede Strappy Cork Sandals for Women | Dmodot | ₹15,598 | Black suede flat sandals, solid, suitable for party but flat heel not preferred. |
| Indigo Leaf Block Print Cotton Strappy Block Heels In Suede | Tjori | ₹1,319 | Blue cotton block heels with leaf print, festive but not preferred colors or fabric |
| Women's Stylish Multi-Strap Rhinestone Block Heel Sandals | Carlton London | ₹1,754 | Embellished block heel, party use, but white not preferred color |
| Upgrade Style With Womens Suede Black Pumps · Modern Fashion | Inc.5 | ₹2,990 | Black synthetic block heels, solid, suitable for party and formal wear, regular fit. |

Rerank: rail-1 scored 18, kept 15, dropped 3 [score 0.15 (color; pattern); score 0.25 (pink; printed); score 0.33 (pink color; floral pattern)] · rail-3 scored 18, kept 18, dropped 0 · rail-2 scored 18, kept 15, dropped 3 [score 0.30 (color); score 0.15 (category; occasion); score 0.28 (color)]

Timings: understand 1933ms, plan 3090ms, search 1384ms, curate 3587ms, total 9995ms · tokens 17633/3045 · $0.01035

## 18. denim jacket like levis but cheaper

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"classic blue denim jacket","categories":{"include":["denim-jacket"],"exclude":[],"strength":"must"},"brands":{"include":[],"exclude":["levi-s"],"strength":"prefer"},"price":{"min":null,"max":1199,"strength":"prefer"},"softPreferences":["levi's-style classic denim"]}
```

Chips: `Denim Jacket` `✕ Levi's` `~ Under ₹1,199` `~ levi's-style classic denim`

### Rail `main` (15 shown, 116 found)

- q: `classic blue denim jacket`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 116 found/73 usable (400ms)

| title | brand | price | reason |
|---|---|---:|---|
| Navy Blue Denim Jacket | VERO MODA | ₹1,199 | 100% cotton, regular fit, blue denim jacket, ₹1199 within budget |
| Blue Denim Washed Jacket | Sassafras | ₹816 | Blue denim, comfort fit, ₹816 under ₹1199 budget, classic style like Levi's. |
| Blue Solid Denim Jacket | Kraus Jeans | ₹997 | Blue cotton blend denim jacket, regular fit, ₹997 under ₹1199 budget, casual wear. |
| Denim Jacket · Vintage Blue | XYXX | ₹1,499 | 100% cotton denim, boxy fit, blue, ₹1499 slightly above budget ₹1199 |
| Dark Blue Denim Jacket | Kraus Jeans | ₹1,297 | Denim jacket but 30% non-cotton fabric, slim fit, ₹1297 above budget ₹1199 |
| Gold and Blue Denim Jacket with Button-Down Front | The Kaftan Company | ₹1,748 | 100% cotton denim but gold jacquard pattern, ₹1748 above budget ₹1199 |
| Classic Blue Full Sleeve Collar Denim Casual Jacket For Timeless Style | Latin Quarters | ₹1,299 | Classic fit denim jacket at ₹1299 close to budget, blue color fits Levi's style. |
| Denim Jacket · Midnight Blue | XYXX | ₹1,499 | Midnight blue, 100% cotton denim, boxy fit, ₹1499 slightly above budget ₹1199. |
| Blue Trucker Denim Jacket | VERO MODA | ₹1,559 | Blue, 100% cotton denim jacket, regular fit, casual, ₹1559 slightly above budget |
| Dark Blue Denim Jacket | Kraus Jeans | ₹1,297 | Blue denim jacket, slim fit, mostly cotton, ₹1297 slightly above budget ₹1199 |

Rerank: main scored 36, kept 15, dropped 21 [score 0.15 (over ₹1199; distressed style); score 0.33 (over ₹1199); score 0.20 (over budget); score 0.25 (over budget)]

Timings: understand 1907ms, search 407ms, curate 3451ms, total 5765ms · tokens 11487/2040 · $0.00628

## 19. school shoes for boys

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"kids","kidGender":"boy","ageYears":null,"source":"explicit"},"semanticQuery":"school shoes for boys","categories":{"include":["school-shoe"],"exclude":[],"strength":"must"},"useCases":{"include":["school"],"exclude":[],"strength":"prefer"}}
```

Chips: `Boys` `School Shoe` `~ School/College`

### Rail `main` (24 shown, 32 found)

- q: `school shoes for boys`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 32 found/29 usable (286ms)

| title | brand | price | reason |
|---|---|---:|---|
| Super Champ Lace · Boys Black Footwear | Reebok | ₹1,649 | Leather, black, regular fit school shoes for boys, suitable for school and daily wear. |
| KHADIM School Sports & PT Shoes for Boys (9-15 yrs) | Khadims | ₹649 | Black synthetic mesh, regular fit, suitable for school sports and daily wear. |
| Prefect Black Lacing Uniform School Shoes For Kids S/BOY-LS By Liberty | Liberty Shoes | ₹1,099 | Black buff leather, regular fit, school/daily wear, suitable for boys at ₹1099. |
| Prefect Black Non Lacing Uniform School Shoes For Kids S/BOY-LS N By Liberty | Liberty Shoes | ₹1,299 | Black PU non-lacing shoes, regular fit, school/daily wear for boys at ₹1299. |
| Prefect Black Lacing Uniform School Shoes For Kids SKOOLBOYPU By Liberty | Liberty Shoes | ₹499 | PU leather, black, regular fit, school shoes for kids, suitable for school use. |
| Super Champ Velcro GS · Boys Black Footwear | Reebok | ₹1,499 | Leather, black, regular fit school shoes with velcro, suitable for school and sports. |
| Walkaroo Senior boys School Shoes · WV502 Black | Walkaroo | ₹639 | Black faux leather school shoes for senior boys, formal and daily wear suitable. |
| Walkaroo boys School Shoes · WV502 Black | Walkaroo | ₹489 | Black faux leather school shoes for boys, regular fit, suitable for daily/formal wear. |
| Kids School Shoes · WV522 Black | Walkaroo | ₹294 | Black faux leather school shoes for kids, regular fit, suitable for daily/formal wear. |
| KHADIM Leather Derby School Shoe for Boys (9-15 yrs) | Khadims | ₹949 | Leather, black, regular fit school shoes for boys aged 9-15, suitable for school. |

Rerank: main scored 29, kept 29, dropped 0

Timings: understand 2175ms, search 290ms, curate 2553ms, total 5018ms · tokens 10643/1521 · $0.00512

## 20. bodycon dress, no cutouts, not red

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"bodycon dress excluding cutouts and red color","categories":{"include":["bodycon-dress"],"exclude":[],"strength":"must"},"colors":{"include":[],"exclude":["red"],"strength":"must"},"fits":{"include":["bodycon"],"exclude":[],"strength":"must"},"textExclusions":["cutouts"]}
```

Chips: `Women` `Bodycon Dress` `✕ Red` `Bodycon` `✕ cutouts`

### Rail `main` (24 shown, 342 found)

- q: `bodycon dress excluding cutouts and red color`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 342 found/104 usable (623ms)

| title | brand | price | reason |
|---|---|---:|---|
| Yellow Tie And Dye Bodycon Dress | Outzidr | ₹949 | Yellow bodycon dress, no cutouts, suitable for party/vacation, not red. |
| Rock And Roll Metallic Bodycon Imported Midi Dress | Neofaa | ₹1,899 | Navy blue polyester bodycon midi dress, no cutouts, party wear, not red. |
| Black Full Sleeved Slit Bodycon Dress | Outzidr | ₹2,199 | Black full sleeved floral print bodycon dress, no cutouts, party wear, not red. |
| Black Full Sleeved Bodycon Dress | Outzidr | ₹2,049 | Black full sleeved floral print bodycon dress, no cutouts, party wear, not red. |
| Off-Shoulder Bodycon Dress | ONLY | ₹1,924 | Green bodycon dress, no cutouts, party wear, polyester-lycra blend |
| Handcrafted 1000 Panel Bodycon Dress (Maroon) | HUEMN | ₹19,000 | Bodycon · ₹19,000 |
| Handcrafted 1000 Panel Bodycon Dress (Black) | HUEMN | ₹19,000 | Black 100% cotton bodycon dress, no cutouts, party/festive |
| Blue Cocktail Bodycon Dress (PL-155) | Kapraaha | ₹11,592 | Blue polyester bodycon dress, embellished, no cutouts, party wear |
| Salomi Rust 3D Flower Bodycon Dress | Lea Clothing | ₹11,486 | Rust color, bodycon fit, no cutouts, suitable for party/date night. |
| Mermaid Sequin Bodycon Dress | VERO MODA | ₹9,999 | Multi color, polyester fabric, bodycon fit, no cutouts, party wear. |

Rerank: main TIMEOUT (fallback reasons)

Timings: understand 1869ms, search 635ms, curate 5024ms, total 7865ms · tokens 11654/1951 · $0.00621

## 21. diwali ethnic wear for a 2 year old boy

Intent:
```json
{"kind":"occasion","language":"en","audience":{"segment":"kids","kidGender":"boy","ageYears":2,"source":"explicit"},"semanticQuery":"boys festive ethnic kurta set for toddlers","categories":{"include":["kurta-set"],"exclude":[],"strength":"must"},"useCases":{"include":["festive"],"exclude":[],"strength":"prefer"},"occasion":{"name":"Diwali","location":null,"timeOfYear":"September","role":null}}
```

Chips: `Boys · 2y` `Kurta Set` `~ Festive`

Stylist note: For Diwali in late September, light and breathable fabrics like cotton or cotton-blend are ideal for a 2-year-old boy, considering the warm Indian weather. Traditional colors such as bright yellow, orange, or red with festive embroidery or prints work well for the occasion. A kurta set is perfect for comfort and style during family celebrations.

- Kurta Set — Comfortable and traditional for festive celebrations

### Rail `rail-1` — Kurta Set (12 shown, 74 found)

- q: `kurta set for toddler boy festive Diwali comfortable cotton yellow orange red maroon cotton blend embroidered`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 74 found/116 usable (486ms)

| title | brand | price | reason |
|---|---|---:|---|
| Babyhug Cotton Woven Floral Embroidered Angarakha Full Sleeves Kurta & Dhoti Set · Yellow | Babyhug | ₹512 | Yellow cotton, floral embroidered angarakha style, festive wear, suitable for 2-year-old boy |
| Baby Boy Bandhani Print Cotton Kurta Set | Tiber Taber | ₹1,613 | Cotton, red, bandhani print, festive and wedding, regular fit, suitable for Diwali. |
| Baby Boy Floral Print Kurta Set | Tiber Taber | ₹1,885 | Yellow, 100% cotton cambric, floral print, festive use, comfortable for 2-year-old boy |
| Set of 2 · Noddy Dusky Red Stripes Kurta Pajama | Tjori | ₹524 | Cotton, red, striped, relaxed fit, festive and Diwali suitable for 2 year boy. |
| Red Multicolor Cotton Blend Printed Kurta Pyjama Set | Kisah | ₹2,249 | Red multicolor cotton blend, printed, festive kurta set suitable for Diwali. |
| Red Multicolor Cotton Blend Printed Kurta Dhoti Set | Kisah | ₹3,374 | Red multicolor cotton blend, printed kurta dhoti set, festive and breathable. |
| Raabta · Embroidered Jacket, Organic Cotton Dobby Kurta Trouser Set For Boys | Littleens | ₹10,918 | Organic cotton, embroidered, festive use; olive sage-green not preferred color |
| Kalki Wine Purple Flamingo Printed Jacket Kurta Set In Cotton For Boys | Kalki | ₹1,122 | Cotton kurta set, festive use, maroon/wine shade close to preference, printed pattern. |
| Shad · Embroidered Nehru Jacket With Cotton Dobby Kurta Trouser Set For Boys | Littleens | ₹10,282 | Organic cotton, embroidered, festive use; off-white color not preferred |
| Kalki Sea Green Printed Jacket Kurta Set In Cotton For Boys | Kalki | ₹2,706 | Cotton kurta set, festive use, but green color not preferred for Diwali. |

Rerank: rail-1 scored 18, kept 16, dropped 2 [score 0.20 (black; silk); score 0.20 (fabric silk blend; color mint green)]

Timings: understand 2593ms, plan 1547ms, search 491ms, curate 1988ms, total 6620ms · tokens 10654/1251 · $0.00469

## 22. monsoon footwear that won't get ruined

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"durable monsoon footwear that won't get ruined","useCases":{"include":["winter"],"exclude":[],"strength":"prefer"},"softPreferences":["durable","water-resistant","monsoon suitable","footwear"]}
```

Chips: `~ Winter/Cold Weather` `~ durable` `~ water-resistant` `~ monsoon suitable` `~ footwear`

### Rail `main` (9 shown, 102 found)

- q: `durable monsoon footwear that won't get ruined winter`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 102 found/140 usable (565ms)

| title | brand | price | reason |
|---|---|---:|---|
| SNEAKEEZ Men's Rain Shoes · WC8791 Dark Grey | Walkaroo | ₹329 | Dark grey EVA rain shoes, monsoon suitable and water-resistant at ₹329, durable footwear. |
| KHADIM Waves Washable Slip-On Shoe for Women | Khadims | ₹316 | PVC, washable, monsoon suitable, durable slip-ons at ₹316 |
| Durable XT · Boys Black Footwear | Reebok | ₹2,399 | Synthetic, regular fit sports shoes, black color, durable and suitable for monsoon wear. |
| KHADIM Washable Slingback Heel Sandal for Women | Khadims | ₹714 | Blue EVA sandals, washable and monsoon suitable at ₹714, durable and water-resistant. |
| Durable Xt · Boys Blue Footwear | Reebok | ₹2,399 | Synthetic textile, regular fit sports shoes, durable, suitable for active monsoon use. |
| Open footwear · Sahara Glide | Wrogn | ₹2,049 | Leather sandals, regular fit, solid camel-brown, casual wear; durable monsoon footwear |
| KHADIM Washable Slip On Shoe for Men | Khadims | ₹399 | Black synthetic slip-on floaters, monsoon suitable and washable at ₹399, durable casual wear. |
| Women Heel High Ankle Leather Classic Winter Chelsea Boot | Fausto | ₹1,999 | Leather Chelsea boots, durable and winter suitable; tan color, ₹1999. |
| Women's Tall Winter Boot with Decorative Buckle Straps | Carlton London | ₹3,379 | Leather, winter wear, durable but no explicit monsoon or water resistance |

Rerank: main scored 36, kept 9, dropped 27 [score 0.05 (not footwear); score 0.03 (not footwear); score 0.00 (not footwear); score 0.00 (not footwear)]

Timings: understand 2578ms, search 574ms, curate 2004ms, total 5156ms · tokens 11858/1717 · $0.00592

## 23. interview outfit for a male fresher under 4000

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"explicit"},"semanticQuery":"interview outfit for a male fresher under 4000","useCases":{"include":["formal","office"],"exclude":[],"strength":"prefer"},"price":{"min":null,"max":4000,"strength":"must"},"softPreferences":["professional","smart","neat","western tops","western bottoms"]}
```

Chips: `Men` `~ Formal` `~ Office/Work` `Under ₹4,000` `~ professional` `~ smart` `~ neat` `~ western tops` `~ western bottoms`

### Rail `main` (24 shown, 76 found)

- q: `interview outfit for a male fresher under 4000 formal office`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 76 found/78 usable (579ms)

| title | brand | price | reason |
|---|---|---:|---|
| Duke Mens Office Fit Derby Formal Shoes (FWD5046) | Duke India | ₹799 | Black derby formal shoes, synthetic upper, office wear, under ₹4000 for male fresher. |
| Park Avenue Men Blue Super Slim Fit Formal Suit | MyRaymond | ₹3,887 | Blue super slim fit formal suit, terry/rayon fabric, formal office wear, ₹3887 under ₹4000. |
| Men’s Crownline Truffle Checks Dress Shirt · Refined Office Style | Vahro | ₹3,499 | 100% giza cotton, regular fit, checked, formal office shirt at ₹3499 under ₹4000 budget |
| Men’s Crownline Thornbrook Checks Dress Shirt · Stylish Office Shirt | Vahro | ₹2,999 | 100% giza cotton, regular fit, checked, formal office shirt at ₹2999 under ₹4000 budget |
| Men's Tan Formal Lace Up Shoes For Office Online | Fausto | ₹2,399 | Leather tan derbies, formal office wear, under ₹4000, suitable for male fresher interview. |
| Men's Black Leather Broad Formal Slip On Shoe For Office | Fausto | ₹1,199 | Black leather slip-on formal shoes, office wear, ₹1199 under ₹4000 budget, male interview fit. |
| Men's Black Genuine Formal Office Shoes Online | Fausto | ₹1,599 | Black leather formal shoes, office wear, under ₹4000, suitable for interview. |
| Office Straight Fit Pants | Everdion | ₹1,499 | Beige straight fit pants, office/formal use, under ₹4000 for male fresher interview. |
| Men’s Crownline Banker Collar Dress Shirt Windsor Blue · Elegant Office Shirt | Vahro | ₹3,499 | 100% Giza cotton slim fit blue formal shirt, office wear, ₹3499 under ₹4000. |
| Park Avenue Men Blue Super Slim Fit Checks Formal Jacket | MyRaymond | ₹3,849 | Blue cotton slim fit checked formal jacket, office wear, ₹3849 under ₹4000. |

Rerank: main scored 36, kept 25, dropped 11 [score 0.05 (not clothing); score 0.03 (not men's clothing; not formal outfit); score 0.20 (not clothing); score 0.30]

Timings: understand 1871ms, search 585ms, curate 2582ms, total 5038ms · tokens 11628/1989 · $0.00626

## 24. pastel co-ord set for brunch

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"pastel co-ord set for brunch","categories":{"include":["co-ord-set"],"exclude":[],"strength":"must"},"colors":{"include":["pastel-pink","peach"],"exclude":[],"strength":"prefer"},"useCases":{"include":["casual","family-gathering"],"exclude":[],"strength":"prefer"},"softPreferences":["pastel colors","lightweight","comfortable"]}
```

Chips: `Women` `Co-ord Set` `~ Pastel / blush pink` `~ Peach / coral` `~ Casual` `~ Family Gathering` `~ pastel colors` `~ lightweight` `~ comfortable`

### Rail `main` (24 shown, 17 found)

- q: `pastel co-ord set for brunch peach casual family gathering`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 17 found/99 usable (500ms)

| title | brand | price | reason |
|---|---|---:|---|
| Pastel Bloom Co-ord Set | Juniper Fashion | ₹1,995 | Cotton, fit & flare, floral pastel multi, casual/brunch use, lightweight and comfortable |
| Pastel Floral Co-ord Set · Stylish and Comfortable Cotton Wear | Label Flavia | ₹899 | Pastel cotton co-ord set, relaxed fit, casual wear suitable for brunch. |
| Coral Peach Co-ord Set | 5 Feet 11 | ₹999 | Peach cotton, relaxed fit, casual use, coral peach pastel color, lightweight cotton |
| PASTEL SHAWL PRINT SET | Dash and Dot | ₹9,490 | Pastel tencel, relaxed fit, casual/festive/daily wear, lightweight fabric |
| Carol Co-ord Set | House of Fett | ₹5,598 | Peach cotton poplin, a-line fit, casual and party use, fits pastel brunch. |
| Front Row Co-ord Set in Dusty Peach | Surma | ₹3,190 | Dusty peach, 50% cotton/lyocell, relaxed fit, casual and party use fits brunch. |
| Paloma Linen Co-ord Set in Peach | Cosset Clothing | ₹4,490 | Peach pastel, pure cotton linen blend, relaxed fit, casual and daily wear. |
| Pastel Pink Floral Soft Cotton Co-ord Set · Top & Trousers | Label Flavia | ₹3,596 | Pastel pink cotton, relaxed fit, casual wear, suitable for brunch and comfortable. |
| Peach Sunshine Set | Shop Amoh | ₹4,530 | Peach cotton, loose fit, casual/daily wear, suitable for brunch |
| Midnight Jungle Co-ord Set · Black & Pastel Mix | Label Flavia | ₹3,996 | Blush pastel mix, cotton, relaxed fit, brunch use, comfortable and casual |

Rerank: main scored 36, kept 29, dropped 7 [score 0.20 (velvet; party use); score 0.30 (not pastel); score 0.20 (polyester; party fit); score 0.15 (not pastel)]

Timings: understand 2017ms, search 508ms, curate 2138ms, total 4662ms · tokens 11861/1923 · $0.00625

## 25. Goa trip outfits for a guy, 6000 total

Intent:
```json
{"kind":"browse","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"explicit"},"semanticQuery":"men's outfits for a Goa trip","useCases":{"include":["travel","beach"],"exclude":[],"strength":"prefer"},"price":{"min":null,"max":6000,"strength":"must"},"softPreferences":["lightweight","comfortable","breathable"]}
```

Chips: `Men` `~ Travel/Vacation` `~ Beach/Pool/Resort` `Under ₹6,000` `~ lightweight` `~ comfortable` `~ breathable`

Stylist note: For a September trip to Goa, expect warm and humid weather, so lightweight and breathable fabrics like cotton and linen are ideal. Stick to casual and comfortable styles suitable for beach and travel activities, focusing on light colors to keep cool. With a ₹6000 budget, prioritize essentials like shirts and shorts, and add comfortable footwear within the budget.

- Casual Shirts — Breathable tops for warm, humid beach weather
- Comfortable Bottoms — Lightweight shorts or trousers for beach and travel
- Casual Footwear — Comfortable shoes or sandals for walking and beach

### Rail `rail-3` — Casual Footwear (12 shown, 1001 found)

- q: `men's comfortable casual footwear for beach travel brown beige navy leather canvas solid`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 1001 found/61 usable (1499ms)

| title | brand | price | reason |
|---|---|---:|---|
| Now Mens Brown Solid Round Toe Casual Leather Slipon Shoes | Inc.5 | ₹1,476 | Brown leather slip-ons, solid, casual, ₹1476 under ₹1500 budget, travel suitable |
| Now Mens Brown Solid Pointed Toe Casual Loafer Shoes | Inc.5 | ₹1,396 | Brown leather loafers, solid, casual, ₹1396 under ₹1500, travel appropriate |
| Men's Navy Solid Casual Sports Shoes | Cantabil | ₹1,400 | Navy mesh casual sports shoes, solid, travel use, ₹1400 under budget, breathable fabric |
| Explore Mens Brown Leather Round Toe Flats · Elegant Comfort | Inc.5 | ₹996 | Brown leather sandals, solid pattern, casual, ₹996 under ₹1500 budget, travel suitable |
| PRO Canvas Shoe for Men | Khadims | ₹525 | Navy canvas, casual, lightweight, breathable, under ₹1500 for travel use. |
| Men's Navy Blue Comfort Canvas Sneaker Shoes Online | Fausto | ₹1,199 | Navy canvas/denim, solid, casual, breathable, under ₹1500 for travel. |
| Men's Daily Wear Comfort Sandals · WE1335 Brown | Walkaroo | ₹579 | Brown faux leather sandals, solid, casual travel, ₹579 under ₹1500 budget |
| Navy Blue Casual Canvas Slip-On Shoes For Men | Fausto | ₹999 | Navy blue canvas slip-ons, solid, casual, ₹999 under ₹1500 budget |
| Brown Leather Flip Flops | Jack & Jones | ₹1,249 | Brown leather flip flops, solid, beach/casual, ₹1249 under ₹1500, 50% cotton upper |
| Men Acupressure Footbed Thong Sandals | Carlton London | ₹679 | Navy solid sandals, casual/beach, lightweight, under ₹1500, no fabric info. |

### Rail `rail-2` — Comfortable Bottoms (12 shown, 979 found)

- q: `men's lightweight shorts and trousers for beach travel beige white navy olive cotton linen`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 979 found/91 usable (1499ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men's Beige Premium Cotton Bold Stripe Easy-Fit Shorts | Genes Lecoanet Hemant | ₹1,999 | Beige cotton striped shorts, easy fit, casual/vacation, ₹1999 under ₹2000 budget. |
| Explore Versatile Men's White Cotton Shorts | Celio | ₹1,999 | White cotton solid chino shorts, regular fit, casual/vacation, ₹1999 under ₹2000 budget. |
| Lagoon Beige VacayShorts · Linen Shorts For Men | Bombay Trooper | ₹975 | Linen fabric, alpine white (close to beige), solid, vacation casual, ₹975 under ₹2k budget. |
| Beige Cargo Shorts | Jack & Jones | ₹1,999 | Beige linen-cotton cargo shorts, solid, casual vacation, ₹1999 under ₹2k budget |
| Beige Cotton Shorts | Banana Club | ₹999 | Beige cotton shorts, solid, casual/beach, ₹999 under ₹2000, lightweight and comfortable |
| Olive Leaves VacayShorts · Linen Shorts For Men | Bombay Trooper | ₹975 | Linen, solid olive shorts, travel/casual use, ₹975 under ₹2000 budget |
| Men's Navy Blue Cotton-Linen Pleated Tapered Cropped Trousers | Jack & Jones | ₹1,749 | Navy cotton-linen solid tapered trousers, casual/daily wear, ₹1749 under ₹2000 budget. |
| Tan Brown Cotton Cargo shorts | Banana Club | ₹599 | Cotton fabric, tan brown close to beige, solid, casual, ₹599 well under ₹2k budget. |
| Sunset Beige VacayShorts · Linen Shorts For Men | Bombay Trooper | ₹975 | Beige linen chino shorts, solid, vacation/travel, ₹975 under ₹2k budget |
| Men's Cotton Linen Casual Wear Regular Fit Shorts/Cottonworld | Cottonworld | ₹1,890 | Cotton linen, natural color, solid, casual, ₹1890 under ₹2000 budget, breathable fabric |

### Rail `rail-1` — Casual Shirts (12 shown, 114 found)

- q: `men's breathable casual shirts for beach travel warm weather white sky beige pastel navy cotton`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 114 found/77 usable (1499ms)

| title | brand | price | reason |
|---|---|---:|---|
| Casual Shirt for Men · Breathable & Soft with Color Fastness Regular Fit Spread Collar Neck Cotton Fabric Self Design Pattern | Cantabil | ₹959 | Cotton · ₹959 |
| Casual Shirt for Men · Breathable & Soft with Color Fastness Regular Fit Spread Collar Neck Cotton Blend Fabric Solid Pattern | Cantabil | ₹1,259 | Beige cotton blend solid shirt, regular fit, breathable, under ₹2500 for casual Goa trip. |
| Casual Shirt for Men · Breathable & Soft with Color Fastness Regular Fit Spread Collar Neck Cotton Fabric Printed Pattern | Cantabil | ₹959 | Light blue cotton printed shirt, breathable, regular fit, under ₹2500, fits travel and casual use. |
| Coastal Mirage Cotton Regular Fit Beige Embroidered Shirt | Hamptons | ₹1,999 | Beige cotton embroidered shirt, regular fit, casual and vacation use, breathable, under ₹2500. |
| Beige Textured Resort Collar Shirt | Jack & Jones | ₹2,249 | Beige · ₹2,249 |
| White Tropical Print Resort Collar Shirt | Jack & Jones | ₹1,649 | White, 55% cotton blend, casual/vacation/beach, ₹1649 under ₹2500 budget. |
| Aqua Beach Motif Cotton Regular Fit Sky Blue Embroidered Shirt | Hamptons | ₹1,999 | Sky blue, 100% cotton, casual/vacation/travel, ₹1999 under ₹2500 budget. |
| Palm Cove Breeze Cotton Regular Fit Blue Embroidered Shirt | Hamptons | ₹1,899 | Blue solid, cotton, casual/vacation/beach, ₹1899 under ₹2500 budget. |
| Coastal Breeze Beige Checks Flap Pocket Flannel Shirt | Vastrado | ₹959 | Beige, 100% cotton, relaxed fit, casual, ₹959 under ₹2500 budget for Goa trip. |
| White Tropical Print Vest | Jack & Jones | ₹499 | White, 100% cotton, printed, casual/vacation/beach, ₹499 under ₹2500 budget. |

Rerank: rail-3 scored 18, kept 15, dropped 3 [score 0.30 (pattern not solid; fabric not leather or canvas); score 0.33 (pu fabric; tpr fabric); score 0.30 (pattern not solid)] · rail-2 scored 18, kept 13, dropped 5 [score 0.30 (color); score 0.20 (polyester); score 0.17 (polyester); score 0.30 (occasion)] · rail-1 TIMEOUT (fallback reasons)

Timings: understand 1920ms, plan 2695ms, search 1511ms, curate 5017ms, total 12526ms · tokens 17726/3780 · $0.01156
