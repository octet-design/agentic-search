# Eval report

Generated 2026-09-24T13:47:00.059Z · 25 queries · rerank on · alpha 0.5

**25/25 passed** automatic checks (exclusions, audience, price-when-unrelaxed). Latency p50 8.7s, max 18.8s. Tokens 13831 in / 2456 out per query (avg). Total cost $0.194.

| # | query | kind | rails | results | relaxed | total s | intent s | search s | curate s | tokens in/out | checks |
|---:|---|---|---:|---:|---|---:|---:|---:|---:|---|---|
| 1 | black cotton kurta set for office under 2000 | product | 1 | 24 |  | 10.4 | 3.9 | 1.2 | 5.0 | 11756/2139 | pass |
| 2 | shaadi mein pehenne ke liye sherwani, ivory ya beige | product | 1 | 24 |  | 9.6 | 4.0 | 0.9 | 4.7 | 11715/1996 | pass |
| 3 | what should I wear to a mehendi in Jaipur in November | occasion | 4 | 47 |  | 18.1 | 3.3 | 3.5 | 5.0 | 21161/4107 | pass |
| 4 | floral maxi dress, no polyester | product | 1 | 24 |  | 9.3 | 2.8 | 1.1 | 5.0 | 11673/1943 | pass |
| 5 | everyday college sneakers for men under 3000 | product | 1 | 24 | yes | 11.9 | 3.1 | 3.5 | 5.0 | 12294/2110 | pass |
| 6 | birthday party dress for my 6 year old daughter | product | 1 | 24 |  | 6.8 | 2.7 | 0.5 | 3.6 | 11454/1889 | pass |
| 7 | old money look for men | vibe | 5 | 59 |  | 18.8 | 2.6 | 3.9 | 4.9 | 24454/5288 | pass |
| 8 | linen shirt that doesn't need much ironing | product | 1 | 24 |  | 7.2 | 2.9 | 0.9 | 3.4 | 11467/1869 | pass |
| 9 | saree for farewell — elegant, not too heavy | product | 1 | 14 |  | 8.1 | 2.9 | 0.9 | 4.3 | 11679/1935 | pass |
| 10 | high waist squat-proof gym leggings | product | 1 | 24 |  | 8.0 | 3.3 | 0.7 | 3.9 | 11715/1867 | pass |
| 11 | winter jacket for Manali in December, warm but not bulky, women | product | 1 | 24 |  | 7.6 | 3.2 | 0.9 | 3.5 | 11586/1925 | pass |
| 12 | gift for my dad's 60th birthday under 3000 | gift | 3 | 32 | yes | 17.5 | 3.4 | 4.4 | 5.0 | 17755/3468 | pass |
| 13 | office wear for a pear body type | browse | 4 | 40 |  | 16.7 | 3.2 | 3.3 | 4.7 | 21096/4225 | pass |
| 14 | navratri garba outfits for a couple | occasion | 4 | 48 |  | 16.7 | 2.7 | 3.4 | 3.6 | 21670/4273 | pass |
| 15 | white shirt | product | 1 | 24 |  | 7.9 | 2.6 | 0.8 | 4.6 | 11315/1964 | pass |
| 16 | kurti | product | 1 | 24 |  | 7.5 | 2.5 | 0.9 | 4.2 | 11355/1985 | pass |
| 17 | kuch accha sa dikhao party ke liye | browse | 3 | 36 |  | 13.5 | 2.4 | 2.6 | 4.3 | 17572/3081 | pass |
| 18 | denim jacket like levis but cheaper | product | 1 | 24 |  | 6.8 | 2.4 | 1.0 | 3.4 | 11498/2093 | pass |
| 19 | school shoes for boys | product | 1 | 24 |  | 6.3 | 2.2 | 0.4 | 3.7 | 10071/1486 | pass |
| 20 | bodycon dress, no cutouts, not red | product | 1 | 24 |  | 7.4 | 2.7 | 1.0 | 3.6 | 11648/1992 | pass |
| 21 | diwali ethnic wear for a 2 year old boy | occasion | 1 | 12 |  | 9.2 | 2.8 | 0.7 | 3.4 | 10596/1277 | pass |
| 22 | monsoon footwear that won't get ruined | product | 1 | 11 |  | 6.6 | 2.9 | 0.8 | 2.9 | 11651/1671 | pass |
| 23 | interview outfit for a male fresher under 4000 | product | 1 | 18 |  | 7.7 | 3.4 | 0.8 | 3.5 | 8906/1163 | pass |
| 24 | pastel co-ord set for brunch | product | 1 | 24 |  | 8.7 | 2.9 | 0.7 | 5.0 | 11882/2014 | pass |
| 25 | Goa trip outfits for a guy, 6000 total | browse | 3 | 36 |  | 16.1 | 2.6 | 2.6 | 5.0 | 17799/3635 | pass |

## 1. black cotton kurta set for office under 2000

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"black cotton kurta set for office wear","categories":{"include":["kurta-set"],"exclude":[],"strength":"must"},"colors":{"include":["black"],"exclude":[],"strength":"must"},"fabrics":{"include":["cotton"],"exclude":[],"strength":"must"},"useCases":{"include":["office"],"exclude":[],"strength":"prefer"},"price":{"min":null,"max":2000,"strength":"must"}}
```

Chips: `Women` `Kurta Set` `Black` `Cotton` `~ Office/Work` `Under ₹2,000`

### Rail `main` (24 shown, 44 found)

- q: `black cotton kurta set for office wear`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 44 found/39 usable (1182ms)

| title | brand | price | reason |
|---|---|---:|---|
| Black Geometric Printed Cotton kurta Set | Aurelia | ₹1,260 | Black cotton, regular fit, under ₹2000 but floral pattern, festive/casual not office |
| Black Cotton Embroidered Kurta-Pant Set with Thread Work & Buttons | Juniper Fashion | ₹1,295 | Black cotton, straight fit, under ₹2000 but embroidered, casual/festive not office |
| Black Solid Textured Cotton Straight Kurta and Salwar Co-ord Set | Aurelia | ₹1,320 | Black 100% cotton, tapered fit, under ₹2000, casual/festive not office |
| Women Pure Cotton Black Kurta Pant Dupatta Set | Banithni | ₹899 | Black cotton, regular fit, under ₹2000 but embroidered, festive/casual not office |
| Black Cotton Slub Embroidered Kurta-Pant Set with Thread Work & Cotton Lace | Juniper Fashion | ₹1,295 | Black cotton slub, straight fit, embroidered, ₹1295 under ₹2000, casual use |
| Libas Black Printed Cotton Straight Kurta Set | Libas | ₹1,109 | Black cotton straight kurta set, printed, ₹1109 under ₹2000, casual/festive |
| Printed Cotton Kurta With Pant Set | Styleunion | ₹799 | Black 100% cotton straight kurta set, printed, ₹799 under ₹2000, casual/festive |
| Black Ethnic Festive kurta and Palazzo Set | Aurelia | ₹1,340 | Black 100% cotton loose kurta set, solid, ₹1340 under ₹2000, festive/party use |
| Juniper Black Ethnic Motif Printed Cotton Kurta, Pant And Dupatta Set With Mirror & Thread Work | Juniper Fashion | ₹995 | Black cotton kurta set, printed, casual/festive, ₹995 under ₹2000, no office use |
| Women Cotton Black Printed Kurta Comfort Pant Dupatta | SHREE | ₹1,439 | Black cotton kurta set, printed, daily wear/festive, ₹1439 under ₹2000, no office use |

Rerank: main TIMEOUT (fallback reasons)

Timings: understand 3919ms, search 1192ms, curate 5032ms, total 10235ms · tokens 11756/2139 · $0.00655

## 2. shaadi mein pehenne ke liye sherwani, ivory ya beige

Intent:
```json
{"kind":"product","language":"hinglish","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"ivory or beige sherwani for a wedding","categories":{"include":["sherwani"],"exclude":[],"strength":"must"},"colors":{"include":["off-white","beige"],"exclude":[],"strength":"must"},"useCases":{"include":["wedding"],"exclude":[],"strength":"prefer"},"occasion":{"name":"shaadi","location":null,"timeOfYear":null,"role":null}}
```

Chips: `Men` `Sherwani` `Off-white / ivory / cream` `Beige / nude` `~ Wedding`

### Rail `main` (24 shown, 55 found)

- q: `ivory or beige sherwani for a wedding`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 55 found/56 usable (868ms)

| title | brand | price | reason |
|---|---|---:|---|
| Ivory Silk Sherwani For Groom With Geometric And Floral Embroidery | Kalki | ₹1,42,950 | Ivory rawsilk tailored sherwani with embroidery, wedding use, ₹142950 no budget limit |
| Refined ivory sherwani | Kalki | ₹1,36,950 | Ivory silk tailored sherwani with embroidery, wedding occasion, ₹136950 no budget limit |
| Ivory Imperial Heritage · Ivory Hand Embroidered Dupion Silk Sherwani | Hilo Design | ₹65,300 | Ivory dupion silk sherwani, embroidered, wedding-appropriate, classic fit, ₹65300 |
| Ivory Sherwani Set With Zardosi And Butti Work | Kalki | ₹1,26,950 | Ivory sherwani, tailored fit, embroidered, suitable for wedding occasions. |
| Ikshaan Embroidered Cord Silk Sherwani · Ivory | Anita Dongre | ₹1,31,250 | Ivory silk sherwani, tailored fit, embroidered, suitable for wedding. |
| Crudo · Ivory Hand Embroidered Dupion Silk Sherwani Set | Hilo Design | ₹88,000 | Ivory dupion silk sherwani set, embroidered, straight fit, wedding use, ₹88000 |
| Vehant Embroidered Cord Silk Sherwani · Ivory | Anita Dongre | ₹99,750 | Ivory cord silk sherwani, tailored, embroidered, good for wedding. |
| Ivory Silk Blend Kurta Indo-Western Sherwani Set with Floral Jacquard Design for Wedding & Reception Outfit | Kisah | ₹13,998 | Ivory silk blend sherwani, regular fit, wedding occasion, ₹13998 under no budget limit |
| Ivory Silk Blend Indo-Western Sherwani Jacket with Floral Jacquard Design · Wedding & Reception Outfit | Kisah | ₹13,998 | Ivory silk blend sherwani jacket, regular fit, wedding occasion, ₹13998 no budget limit |
| Resonance Embroidered Silk Sherwani · Ivory | Anita Dongre | ₹2,50,000 | Ivory silk sherwani, tailored, embroidered, wedding/party use, fits shaadi occasion. |

Rerank: main scored 36, kept 36, dropped 0

Timings: understand 4048ms, search 877ms, curate 4666ms, total 9591ms · tokens 11715/1996 · $0.00631

## 3. what should I wear to a mehendi in Jaipur in November

Intent:
```json
{"kind":"occasion","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"festive mehendi outfit in bright yellow or green","colors":{"include":["yellow","green"],"exclude":[],"strength":"prefer"},"useCases":{"include":["festive","wedding"],"exclude":[],"strength":"prefer"},"occasion":{"name":"mehendi","location":"Jaipur","timeOfYear":"November","role":null}}
```

Chips: `Women` `~ Yellow / mustard` `~ Green` `~ Festive` `~ Wedding`

Stylist note: In Jaipur, November weather is pleasantly cool, perfect for vibrant and breathable ethnic wear. Mehendi functions typically embrace bright colors like yellow and green, symbolizing joy and prosperity. Opt for comfortable fabrics like cotton or silk blends to stay stylish and comfortable throughout the day.

- Ethnic Wear — Traditional and vibrant for mehendi celebrations
- Footwear — Comfortable for standing and dancing
- Jewellery — Enhance ethnic look with traditional pieces
- Accessories — Complete look with matching accessories

### Rail `rail-2` — Footwear (11 shown, 209 found)

- q: `comfortable traditional jutti or flat sandal for mehendi yellow green gold leather embroidered solid`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 209 found/40 usable (3438ms)

| title | brand | price | reason |
|---|---|---:|---|
| Now Women Green Party Wear Solid Open Toe Flat Sandals | Inc.5 | ₹796 | Green, synthetic, festive use matches mehendi occasion; flat sandal, comfortable fit. |
| Add Green Casual Solid Open Toe Flats for Womens To Cart Now | Inc.5 | ₹1,813 | Green color matches; synthetic fabric, casual/summer use, not explicitly festive. |
| Now Women Yellow Solid Open Toe Comfort Heels | Inc.5 | ₹2,038 | Yellow flat sandals, synthetic, festive use, no embroidery, mehendi suitable |
| Now Womens Green Casual Solid Open Toe Flat Slip-Ons | Inc.5 | ₹2,590 | Green, flat sandals, synthetic fabric, casual use, no embroidery, mehendi fit less clear |
| Now Womens Yellow Casual Solid Open Toe Flat Sandals | Inc.5 | ₹916 | Yellow color matches preference; synthetic fabric, casual use, not festive. |
| Now Women Green Casual Solid Open Toe Slip-On Flat Sandals | Inc.5 | ₹1,029 | Green flat sandals, synthetic fabric, casual use, no embroidery, mehendi less festive |
| Womens Green Casual Solid Open Toe Flats · Party Ready Style | Inc.5 | ₹2,590 | Green flat sandals, synthetic fabric, party use, no embroidery, mehendi less festive |
| Now Womens Green Casual Solid T-Strap Flat Slip-Ons | Inc.5 | ₹1,743 | Green flats, PU fabric, casual use, no embroidery, mehendi fit less clear |
| Now Womens Green Casual Solid T-Strap Flat Slip-On Sandals | Inc.5 | ₹1,603 | Green flat sandals, synthetic fabric, casual use, no embroidery, mehendi fit less clear |
| Now Womens Green Solid Open Toe Casual Slip-On Flats | Inc.5 | ₹1,029 | Green flat sandals, synthetic fabric, casual use, no embroidery, mehendi less festive |

### Rail `rail-1` — Ethnic Wear (12 shown, 567 found)

- q: `yellow or green lehenga or kurti with dupatta for mehendi cotton silk blend embroidered printed festive wedding`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 567 found/40 usable (3438ms)

| title | brand | price | reason |
|---|---|---:|---|
| Alluring Yellow Printed Silk Festive Wear Lehenga Choli With Dupatta | Zeel Clothing | ₹2,579 | Mustard yellow, printed, vichitra silk lehenga suitable for festive mehendi in November Jaipur. |
| Spectacular Mustard Yellow Printed Silk Lehenga Choli With Dupatta | Zeel Clothing | ₹2,399 | Mustard yellow silk lehenga with digital print fits wedding/festive mehendi in Jaipur November. |
| Mustard Yellow Printed Lehenga With Embroidered Choli And Dupatta | Kalki | ₹27,500 | Yellow · Printed · ₹27,500 |
| Semi Stitched Gorgeous Yellow Printed Art Silk Traditional Lehenga Choli With Dupatta | Ethnic Plus | ₹15,419 | Yellow · ₹15,419 |
| Attractive Yellow Embroidered Net Wedding Lehenga Choli With Dupatta | Zeel Clothing | ₹4,739 | Yellow net fabric, embroidered, festive lehenga suitable for mehendi in November Jaipur |
| Semi Stitched Yellow Embroidered Silk Bridal Lehenga Choli With Dupatta | Ethnic Plus | ₹6,239 | Yellow mulberry silk embroidered bridal lehenga, festive and wedding use |
| Semi Stitched Yellow Floral Printed Banglori Silk Bridal Lehenga Choli With Dupatta | Ethnic Plus | ₹3,959 | Yellow banglory silk printed bridal lehenga, festive and wedding use |
| Mustard Yellow Embroidered Lehenga Set With Matching Dupatta | Kalki | ₹33,390 | Yellow · Embroidered · ₹33,390 |
| Yellow and Mauve Embroidered Lehenga Set With Net Dupatta | Kalki | ₹45,000 | Yellow silk lehenga with embroidered pattern, festive and wedding use, breathable silk fabric |
| Yellow Raw Silk Embroidered Lehenga With Embroidered Blouse And Organza Dupatta | WeaverStory | ₹1,33,995 | Yellow raw silk lehenga with embroidered blouse and organza dupatta, festive/wedding use |

### Rail `rail-3` — Jewellery (12 shown, 101 found)

- q: `lightweight traditional gold or green jewellery for mehendi yellow embellished festive wedding`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 101 found/84 usable (3438ms)

| title | brand | price | reason |
|---|---|---:|---|
| Opulent Flow: Gold Plated American Diamond Chandelier Vine Necklace Set · Chic Lightweight Jewelry for Engagements & Festive Gatherings | Estele | ₹1,500 | Gold plated, embellished, festive jewelry but white color less preferred than green/yellow |
| Exclusive Designer Rose Gold Plated Mint Green American Diamond Necklace Set · Lightweight Luxury Jewelry for Bridal & Cocktail Parties | Estele | ₹1,900 | Rose gold plated, mint green, lightweight, embellished, festive jewelry for mehendi |
| Supreme Rose Gold Plated Green American Diamond Leaf Vine Necklace Set –Timeless Lightweight Jewelry for Reception & Anniversary Wear | Estele | ₹1,400 | Rose gold plated, green & white, lightweight, embellished, festive jewelry suitable for mehendi |
| Classic Gold Lightweight Chain For Women And Girls | Latin Quarters | ₹349 | Gold solid chain, lightweight, festive but lacks embellishment and traditional style |
| Trendy & Lightweight Gold Plated Chain With Pendant For Women & Girls | Latin Quarters | ₹384 | Gold plated pendant, lightweight, festive use, matches gold color preference. |
| Stylish & Lightweight Gold Plated Chain With Pendant For Women & Girls | Latin Quarters | ₹384 | Gold plated pendant, lightweight, festive use, matches gold color preference. |
| Traditional Afghani Designer Multi Color Glass Meena Partywear Lightweight Earring | Tjori | ₹782 | Multicolour and silver · German silver · ₹782 |
| Silver Floral Hoops with CZ Stones · 92.5 Silver, Lightweight | Aadyaa | ₹6,500 | Silver · Silver with cz · ₹6,500 |
| CZ Flower Motif Silver Set · Timeless Jewelry | Aadyaa | ₹4,000 | Silver floral design, festive use, but not gold/green/yellow preferred colors. |
| Silver Hoops CZ Stones · Modern Jewelry | Aadyaa | ₹7,000 | Silver hoops with CZ stones, festive and embellished, but not preferred colors or gold. |

### Rail `rail-4` — Accessories (12 shown, 76 found)

- q: `embroidered potli bag and maang tikka for mehendi yellow green gold silk brocade festive`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 76 found/99 usable (3438ms)

| title | brand | price | reason |
|---|---|---:|---|
| Maroon and Gold Silk Peacock Motif Embroidered Potli Bag | Kalki | ₹7,899 | Silk, embroidered, festive/wedding, but maroon not preferred color for mehendi. |
| Gold and Green Tassel Drop Bead Embroidered Potli Bucket Bag | Kalki | ₹6,899 | Green, embroidered potli, festive/wedding, fits mehendi and Jaipur November. |
| Yellow Silk Peacock Motif Embroidered Potli Bag | Kalki | ₹7,899 | Gold silk embroidered potli, festive/wedding, matches mehendi colors and fabric. |
| Mint Green Embroidered Silk Potli | Tjori | ₹1,069 | Mint green silk embroidered potli, festive/wedding, but mint green less preferred color. |
| Embroidered Potli Bag in Yellow | Global Desi | ₹1,890 | Yellow viscose potli bag, embroidered, festive use fits mehendi in Jaipur November |
| Embroidered Potli Bag in Pink | Global Desi | ₹1,890 | Pink viscose potli bag, embroidered, festive but color not preferred |
| Embroidered Potli Bag in Ivory | Global Desi | ₹1,890 | Ivory viscose potli bag, embroidered, festive but color not preferred |
| Scarlet Red Embroidered Silk Potli | Tjori | ₹1,069 | Silk · Embroidered · ₹1,069 |
| Golden Grace Embroidered Silk Potli | Tjori | ₹969 | Golden dupion silk with zari dori embroidery, festive wedding use, matches gold color preference. |
| Gold Baliyey Sequins Embroidered Potli | House of Designers | ₹9,500 | Gold raw silk potli with sequins embroidery, festive use, fits gold and embroidered preference. |

Rerank: rail-2 scored 18, kept 11, dropped 7 [score 0.15 (color); score 0.15 (color; fabric; occasion); score 0.15 (color; fabric; occasion); score 0.30 (fabric; occasion)] · rail-1 TIMEOUT (fallback reasons) · rail-3 TIMEOUT (fallback reasons) · rail-4 TIMEOUT (fallback reasons)

Timings: understand 3259ms, plan 5840ms, search 3452ms, curate 5018ms, total 18143ms · tokens 21161/4107 · $0.01304

## 4. floral maxi dress, no polyester

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"floral print maxi dress without polyester fabric","categories":{"include":["maxi-dress"],"exclude":[],"strength":"must"},"fabrics":{"include":[],"exclude":["polyester"],"strength":"must"},"patterns":{"include":["floral"],"exclude":[],"strength":"must"}}
```

Chips: `Women` `Maxi Dress` `✕ Polyester` `Floral`

### Rail `main` (24 shown, 173 found)

- q: `floral print maxi dress without polyester fabric`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 173 found/89 usable (1118ms)

| title | brand | price | reason |
|---|---|---:|---|
| Yellow Maxi Dress With Floral Print | Kapraaha | ₹6,417 | Cotton fabric, floral print, maxi dress, suitable for casual/festive wear |
| Rareism Women's Preru Purple Cotton Halter Neck Floral Print Sleeveless Maxi Flared Dress | The House Of Rare | ₹4,399 | Cotton fabric, floral print, sleeveless halter neck maxi dress for daily/casual wear |
| Rareism Women's Freno Off White Cotton Blend V-Neck Floral Print Maxi Straight Fit Dress | The House Of Rare | ₹4,439 | Cotton blend fabric, floral print, straight fit maxi dress for casual/daily wear |
| Rareism Women's Villeur Multi Satin Cowl Neck Floral Print Sleeveless Maxi Flared Dress | The House Of Rare | ₹4,199 | Floral · ₹4,199 |
| trueBrowns Rust Red Green Floral Print Muslin Silk Straight Maxi Dress | True Browns | ₹5,160 | Muslin silk fabric, floral print, straight fit maxi dress for party occasions. |
| trueBrowns Purple Mustard Floral Print Muslin Silk Straight Maxi Dress | True Browns | ₹5,160 | Muslin silk fabric, floral print, straight fit maxi dress for festive occasions. |
| Tropical Floral Printed & Sequin Embroidered A-Line Tiered Maxi Dress · Teal | Fashor | ₹1,549 | Cotton fabric, floral print, fit & flare maxi dress suitable for festive and daily wear. |
| Tropical Floral Printed & Sequin Embroidered A-Line Tiered Maxi Dress · Mustard | Fashor | ₹1,549 | Cotton fabric, floral print, fit & flare maxi dress for festive and daily wear. |
| Floral Printed Half Sleeves Maxi Dress â‚¬€œ The Kaftan Company | The Kaftan Company | ₹3,000 | Modal fabric, floral print, flowy fit, maxi dress, beige and green, no polyester |
| Floral Print Halter Neck Dress | VERO MODA | ₹1,599 | 92% viscose-lenzing ecovero, floral print, loose fit, beige, no polyester |

Rerank: main TIMEOUT (fallback reasons)

Timings: understand 2774ms, search 1124ms, curate 5018ms, total 9323ms · tokens 11673/1943 · $0.0062

## 5. everyday college sneakers for men under 3000

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"everyday college sneakers for men under 3000","categories":{"include":["sneaker"],"exclude":[],"strength":"must"},"useCases":{"include":["daily-wear","school"],"exclude":[],"strength":"prefer"},"price":{"min":null,"max":3000,"strength":"must"}}
```

Chips: `Men` `Sneaker` `~ Daily Wear` `~ School/College` `Under ₹3,000`

### Rail `main` (24 shown, 82 found)

- q: `everyday college sneakers for men under 3000 daily wear school`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 4 found/4 usable (725ms) → 4 found/4 usable (702ms) → 4 found/4 usable (702ms) → 7 found/7 usable (697ms) → 82 found/80 usable (709ms) · relaxed: price-20, price-40, category-parent, category-department
- note: Few exact matches, so also showing other casual shoe styles, related categories and a few up to ₹4,200.

| title | brand | price | reason |
|---|---|---:|---|
| Healers MDG-1 Everyday Comfort Black Formal Sandal for Men by Liberty | Liberty Shoes | ₹2,499 | Black · Softy · ₹2,499 |
| Healers OML-10 Everyday Comfort Brown Casual Slippers for Men by Liberty | Liberty Shoes | ₹1,999 | Brown · Softy · ₹1,999 |
| Blue Casual Slippers for Everyday Comfort Online | Inc.5 | ₹937 | Blue · Leather · ₹937 |
| Healers MDG-3 Everyday Comfort Black Formal Slip on Slippers for Men By Liberty | Liberty Shoes | ₹2,499 | Black · Softy · ₹2,499 |
| Everyday Basic Sneakers : Electric Black | Neeman's | ₹1,099 | Electric black low-top sneakers, recycled knit, casual daily wear, under ₹3000. |
| Duke Men Everyday Comfort Clogs (FWCR6202) | Duke India | ₹559 | Black · Eva · ₹559 |
| Everyday Basic Sneakers : Powder White | Neeman's | ₹1,099 | Powder white low-top sneakers, recycled knit, casual daily wear, under ₹3000. |
| Everyday Basic Sneakers : Pebble Grey | Neeman's | ₹1,099 | Pebble grey low-top sneakers, recycled knit, casual daily wear, under ₹3000. |
| KHADIM School Tennis Shoe for Toddlers & Kids (2.5-5.5 yrs) | Khadims | ₹349 | White · Textile · ₹349 |
| Unisex Black School Boys & Girls Shoes Online | Fausto | ₹1,599 | Black · Pu · ₹1,599 |

Rerank: main TIMEOUT (fallback reasons)

Timings: understand 3061ms, search 3542ms, curate 5019ms, total 11927ms · tokens 12294/2110 · $0.00672

## 6. birthday party dress for my 6 year old daughter

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"kids","kidGender":"girl","ageYears":6,"source":"explicit"},"semanticQuery":"girls birthday party dress","categories":{"include":["dress"],"exclude":[],"strength":"must"},"useCases":{"include":["party"],"exclude":[],"strength":"prefer"}}
```

Chips: `Girls · 6y` `Dress` `~ Party/Club`

### Rail `main` (24 shown, 1390 found)

- q: `girls birthday party dress`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 1390 found/78 usable (486ms)

| title | brand | price | reason |
|---|---|---:|---|
| Baby Girls Solid Layered Tulle Party Dress, Pink | MiniKlub | ₹1,608 | Pink solid layered tulle party dress, regular fit, ideal for birthday party. |
| Girls Net Party Dress with Ruffles | Lilliput World | ₹2,295 | White net flowy dress with ruffles, ideal for birthday parties. |
| Girls Party Dress with Embroidery | Lilliput World | ₹3,495 | Light pink net flared dress with embroidery, suitable for party, for 6-year-old girl. |
| Baby Girls Floral Applique Party Dress, Blue | MiniKlub | ₹1,328 | Blue floral applique party dress, regular fit, for 6-year-old girl. |
| Girls Embellished High Fashion Party Dress | Styleunion | ₹899 | Multi-color embellished polyester party dress, regular fit, for 6-year-old girl. |
| Girls Peach Fit & Flare Party Dress | VERO MODA | ₹999 | Peach fit & flare party dress, 100% nylon, solid color, ideal for party at ₹999. |
| Girls Net Party Dress with Sequins | Lilliput World | ₹3,495 | Turquoise net flowy party dress with sequins, festive for 6-year-old girl. |
| Baby Girls Red and Green Cotton Printed Full Sleeves Party Dress with | MiniKlub | ₹1,188 | Cotton blend, printed, party dress for girls, suitable for birthday parties. |
| Girls Satin Printed Party Dress | Styleunion | ₹1,299 | White satin, printed, party dress for girls, suitable for birthday party at ₹1299. |
| Pastel Lavender Midi Cotton Girls Dress · Feminine Fit, Soft Feel, Smart Casual Style | Neofaa | ₹1,299 | Cotton fabric, feminine fit, pastel lavender, suitable for party, ₹1299 fits kids girl 6y. |

Rerank: main scored 36, kept 36, dropped 0

Timings: understand 2720ms, search 491ms, curate 3609ms, total 6821ms · tokens 11454/1889 · $0.00603

## 7. old money look for men

Intent:
```json
{"kind":"vibe","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"classic understated menswear in muted neutral tones","colors":{"include":["beige","navy","off-white"],"exclude":[],"strength":"prefer"},"softPreferences":["quiet luxury","classic","muted neutrals"]}
```

Chips: `Men` `~ Beige / nude` `~ Navy` `~ Off-white / ivory / cream` `~ quiet luxury` `~ classic` `~ muted neutrals`

Stylist note: For an old money look for men, focus on timeless, high-quality pieces in muted neutrals like beige, navy, and off-white. These colors evoke understated elegance and pair well with classic fabrics such as linen and cotton blends, suitable for year-round wear in India. Opt for clean, tailored fits and avoid flashy logos or patterns to maintain the quiet luxury vibe.

- Classic Shirts — Essential for a refined, timeless wardrobe
- Tailored Trousers — Completes the polished, old money silhouette
- Elegant Outerwear — Adds sophistication and layering options
- Classic Footwear — Understated shoes to complement the look
- Minimal Accessories — Subtle details enhance quiet luxury

### Rail `rail-5` — Minimal Accessories (12 shown, 90 found)

- q: `men's minimalist watch belt sunglasses leather metal brown black gold silver solid formal`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 90 found/51 usable (3891ms)

| title | brand | price | reason |
|---|---|---:|---|
| Formal Plain Leather Mens Belt · Black | Da Milano | ₹2,449 | Black plain leather belt, solid pattern, formal, fits old money look and color preference. |
| Tresmode Yor Black Men's Leather Belt | Tresmode | ₹9,540 | Black leather belt, solid pattern, formal/work, classic and minimalist style. |
| Formal Embossed Leather Mens Belt-Brown | Da Milano | ₹6,999 | Brown embossed leather belt, formal, matches old money look and color preference. |
| Formal Embossed Leather Mens Belt-Black | Da Milano | ₹6,999 | Black embossed leather belt, formal, matches old money look and color preference. |
| Men's Textured Black Formal Leather Belt · Auto Lock mechanism | Cantabil | ₹899 | Black leather belt, formal and casual, textured pattern, fits old money look. |
| Men's Brown Solid Belt | Levi's | ₹2,299 | Brown genuine leather, solid pattern, formal and casual use, fits old money look. |
| Men's Black & Brown Formal Reversible Belt | Cantabil | ₹719 | Black leather reversible belt, formal/casual, simple design suits old money style. |
| Rare Rabbit Men's Brickle Brown Belt Leather | The House Of Rare | ₹3,999 | Brown leather belt, solid pattern, casual daily wear, fits old money style. |
| Tresmode Newton Black Men's Leather Belt | Tresmode | ₹9,540 | Black genuine leather belt, formal/party, criss-cross pattern, less classic. |
| Tresmode Power Black Men's Leather Belt | Tresmode | ₹5,970 | Black leather belt, criss-cross pattern, formal/party/office, less solid classic. |

### Rail `rail-3` — Elegant Outerwear (11 shown, 108 found)

- q: `men's elegant blazers sweaters navy beige off-white wool cotton wool blend cotton blend linen blend solid formal office`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 108 found/82 usable (3891ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men Beige Regular Fit Textured Formal Blazer | Louis Philippe | ₹10,679 | Beige 100% wool blazer, regular fit, textured, formal and office wear, classic color. |
| Navy Blue Shawl Collar Blazer | Jack & Jones | ₹2,499 | Navy blue, cotton 100%, slim fit, solid pattern, formal office wear blazer. |
| Men's Navy Slim Fit Cotton Blazer | Celio | ₹9,999 | Navy slim fit cotton blend, solid, office/formal - fits old money, classic, tailored look. |
| Men's Beige Slim Fit Cotton Blazer | Celio | ₹9,999 | Beige slim fit cotton blend, solid, office/formal - matches old money, classic, tailored look. |
| Men Beige Premium Linen Blend Slim Fit Textured Formal Blazer | Louis Philippe | ₹6,836 | Beige linen blend blazer with wool, slim fit, textured, formal and office wear. |
| Blue Knit Shawl Collar Blazer | Jack & Jones | ₹2,499 | Slim fit solid blue cotton blazer, formal and office suitable, navy close to preferred colors. |
| Wool Zip Front Polo Neck Sweater | Lacoste | ₹22,575 | Beige wool, classic fit, solid pattern, suitable for office wear, matches old money look. |
| Rare Rabbit Men's Laz Off White Cotton Blend Plain Regular Fit Full Sleeve High Neck Sweater | The House Of Rare | ₹2,799 | Off-white cotton blend sweater, solid, regular fit, casual but muted neutral color. |
| Rare Rabbit Men's Kenlay Beige Cotton Blend Plain Regular Fit Full Sleeve High Neck Sweater | The House Of Rare | ₹2,351 | Beige cotton blend sweater, solid, regular fit, casual wear, muted neutral color. |
| Men's Solid Navy Crew Neck Sweater | Levi's | ₹1,683 | Navy solid slim cotton sweater, casual and winter wear, fits color and fabric preferences. |

### Rail `rail-1` — Classic Shirts (12 shown, 2740 found)

- q: `men's classic shirts in beige navy off-white cotton linen cotton blend solid formal office casual`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 2740 found/60 usable (3891ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men Linen Blend Beige Classic Fit Textured Formal Shirt | Louis Philippe | ₹2,182 | Beige linen blend, tailored fit, solid, formal - fits old money look for men |
| Men Linen Blend White Classic Fit Solid Formal Shirt | Louis Philippe | ₹3,114 | White linen blend, tailored fit, solid formal shirt matches old money look for men well. |
| Celio India Men’s Beige Cotton Shirts Online | Celio | ₹2,999 | 100% cotton, regular fit, solid beige, casual/office fits old money look, classic muted neutral |
| Men's Premium Cotton Linen Regular Fit Beige Shirt Harbor | Minister White | ₹1,595 | Beige cotton linen, regular fit, solid, casual/office/formal suits old money look. |
| Celio India Men’s Off-White Cotton Shirts Online | Celio | ₹2,899 | Off-white cotton, regular fit, solid, casual and office wear - classic and muted |
| Men Linen Blend Beige Classic Fit Check Formal Shirt | Louis Philippe | ₹2,764 | Beige linen blend, tailored fit, checked pattern, formal office wear fits old money look. |
| Celio India Men’s White Cotton Shirts Online | Celio | ₹2,999 | 100% cotton, regular fit, solid white, casual/office matches classic muted neutral |
| Men's Navy Linen Cotton Regular Fit Shirt | Cottonworld | ₹2,590 | Navy linen cotton, regular fit, solid, casual/office wear matches color and fabric preferences. |
| Beige Plain Cotton Linen Shirt | Banana Club | ₹1,799 | Beige linen cotton blend, solid, regular fit, casual/office wear matches old money look. |
| Mens Cotton Linen White Regular Fit Shirt Linen Classic | Minister White | ₹1,695 | White cotton linen, regular fit, solid, formal and office wear - classic fabric |

### Rail `rail-4` — Classic Footwear (12 shown, 1227 found)

- q: `men's classic leather suede formal casual shoes brown beige navy solid office`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 1227 found/100 usable (3891ms)

| title | brand | price | reason |
|---|---|---:|---|
| Mens Formal Solid Brown Shoes · Office Ready | Inc.5 | ₹5,290 | Brown leather oxfords, solid pattern, formal and office use, fits old money look. |
| Now Mens Brown Solid Pointed Toe Formal Leather Laceup Shoes | Inc.5 | ₹3,890 | Brown leather, solid pattern, formal office wear, classic style at ₹3890. |
| Men's Leather formals Shoes · WF6053 Brown | Walkaroo | ₹1,066 | Brown genuine leather oxfords, solid pattern, formal/office wear, classic style |
| Men's Brown Genuine Leather Formal Shoes For Office Online | Fausto | ₹2,099 | Brown genuine leather penny loafers, solid, formal and office wear, classic style. |
| Men's Brown Leather Formal Classic Lace Up Brogue Shoes | Fausto | ₹1,799 | Brown leather brogues, solid, formal/work/party, classic look at ₹1799. |
| Men Brown Solid Slip-on Formal Premium Leather Light Weight Breathable Lining Slip Resistant Flexible Toe Shoes | Louis Philippe | ₹2,359 | Brown leather formal slip-on, breathable, slip-resistant, fits office/formal use |
| Men Coffee Brown Solid Derby Formal Premium Leather Light Weight Breathable Lining Slip Resistant Flexible Toe Shoes | Louis Philippe | ₹2,359 | Coffee brown leather derbies, breathable, slip-resistant, suitable for office/formal |
| Men's Suede Navy Casual Shoes | Levi's | ₹1,539 | Navy suede casual shoes, solid, casual use; fits old money look and fabric |
| Brown Suede Formal Shoes | Jack & Jones | ₹2,499 | Brown leather derbies, solid, formal/office wear, classic style at ₹2499. |
| Healers LER-2 Men's Brown Leather Formal Shoes with GEL INSOLE & Elastic Comfort | Liberty Shoes | ₹4,999 | Brown cowcrus leather derbies with gel insole for comfort, formal office wear |

### Rail `rail-2` — Tailored Trousers (12 shown, 1008 found)

- q: `men's tailored trousers beige navy off-white cotton linen cotton blend linen blend solid formal office casual`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 1008 found/94 usable (3891ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men's Navy Blue Cotton-Linen Pleated Tapered Cropped Trousers | Jack & Jones | ₹1,749 | Navy, cotton-linen blend, solid, regular fit, formal and office wear matches old money look |
| Linen-style 100% Cotton Straight Fit Beige Pant | Hamptons | ₹2,199 | Beige, 100% cotton, slim fit, solid, casual and office wear suits old money look |
| Men's Navy Slim Fit Cotton Blend Trousers | Celio | ₹3,999 | Navy slim fit cotton blend trousers, solid, suitable for office and casual wear. |
| Men Beige Relaxed Fit Textured Flat Front Casual Trousers | Louis Philippe | ₹4,449 | Beige linen, textured pattern, relaxed fit, casual and office wear fits old money style |
| Classic Structured Parallel Fit Beige Pants | Hamptons | ₹2,299 | beige tailored pants, solid, casual/office wear, classic style at ₹2299 |
| Beige Solid Cotton Lycra Trousers | Aurelia | ₹660 | Beige cotton blend, slim fit, solid, suitable for office and casual, matches old money style |
| Men Linen Blend Beige Regular Fit Solid Casual Trousers | Louis Philippe | ₹2,694 | Beige cotton-linen, solid, relaxed fit, casual/office; beige and fabric match |
| Loose Fit Solid Linen Blend Mens Trouser · Navy Blue | Wrogn | ₹2,099 | Navy linen blend, solid, loose fit, casual/office; navy and fabric match |
| Men's Beige Relaxed Fit Cotton Blend Trousers | Celio | ₹2,599 | Beige slim fit cotton blend trousers, solid, office and casual wear. |
| Men Beige Relaxed Straight Fit Textured Flat Front Casual Trousers | Louis Philippe | ₹4,449 | Beige linen trousers, relaxed fit, textured pattern, casual and office wear. |

Rerank: rail-5 scored 18, kept 17, dropped 1 [score 0.17 (pattern)] · rail-3 scored 18, kept 11, dropped 7 [score 0.30 (pattern:embellished; occasion:festive); score 0.25 (pattern:printed; occasion:casual); score 0.15 (color; pattern; occasion); score 0.30 (color; pattern)] · rail-1 scored 18, kept 15, dropped 3 [score 0.30 (yellow color); score 0.25 (rust color); score 0.28 (pattern)] · rail-4 scored 18, kept 15, dropped 3 [score 0.30 (pattern textured); score 0.30 (no leather); score 0.30 (not leather or suede)] · rail-2 scored 18, kept 14, dropped 4 [score 0.25 (not cotton blend); score 0.25 (black color); score 0.30 (relaxed fit); score 0.20 (color; fit)]

Timings: understand 2633ms, plan 7358ms, search 3903ms, curate 4870ms, total 18763ms · tokens 24454/5288 · $0.01625

## 8. linen shirt that doesn't need much ironing

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"linen shirt that is easy to maintain and does not require much ironing","categories":{"include":["shirt"],"exclude":[],"strength":"must"},"fabrics":{"include":["linen"],"exclude":[],"strength":"must"},"textExclusions":["needs much ironing","requires much ironing","high maintenance ironing"],"softPreferences":["easy care","low maintenance"]}
```

Chips: `Shirt` `Linen` `✕ needs much ironing` `✕ requires much ironing` `✕ high maintenance ironing` `~ easy care` `~ low maintenance`

### Rail `main` (24 shown, 787 found)

- q: `linen shirt that is easy to maintain and does not require much ironing`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 787 found/88 usable (856ms)

| title | brand | price | reason |
|---|---|---:|---|
| Easy Iron Linen Rich Performance Shirt | Marks & Spencer | ₹4,499 | 55% linen, easy iron, light blue, regular fit, casual/office wear; low maintenance. |
| MOTIF EMBROIDERED LINEN SHIRT | Dash and Dot | ₹8,738 | Black linen, relaxed fit, casual/office wear; no ironing info, but linen fabric matches. |
| Florida Linen Shirt for Women · Linen Shirt Online | Verb by Pallavi Singhee | ₹5,500 | Ivory linen, relaxed fit, casual; linen fabric matches user request, no ironing info |
| Lime Linen Shirt & Tapered Pants | SilverTraq | ₹5,998 | Lime linen shirt, relaxed fit, casual; linen fabric matches, no ironing info |
| Relaxed Fit Linen Shirt | Lacoste | ₹12,500 | Blue linen, relaxed fit, casual wear; no ironing info, linen fabric fits request. |
| Short Sleeved Linen Shirt | Lacoste | ₹13,050 | Light blue linen, regular fit, casual wear; no ironing info, linen fabric fits request. |
| Relaxed Fit Linen Shirt in Black | 11.11 | ₹19,900 | Black linen, relaxed fit, casual wear; no ironing info, linen fabric fits request. |
| Rustic Burgundy European Linen Shirt | Andamen | ₹6,599 | Burgundy 100% European linen, slim fit, casual; linen fabric matches, no ironing info |
| Short Sleeved Linen Shirt | Lacoste | ₹13,050 | Blue linen, regular fit, casual use; no ironing info, easy care preferred |
| Anant Linen Shirt · White | Anita Dongre | ₹8,400 | White linen shirt, regular fit, casual/office; linen fabric matches, no ironing info |

Rerank: main scored 36, kept 36, dropped 0

Timings: understand 2869ms, search 863ms, curate 3440ms, total 7172ms · tokens 11467/1869 · $0.006

## 9. saree for farewell — elegant, not too heavy

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"elegant lightweight saree for a college farewell","categories":{"include":["saree"],"exclude":[],"strength":"must"},"useCases":{"include":["family-gathering"],"exclude":[],"strength":"prefer"},"textExclusions":["heavy embroidery"],"softPreferences":["elegant","lightweight"]}
```

Chips: `Women` `Saree` `~ Family Gathering` `✕ heavy embroidery` `~ elegant` `~ lightweight`

### Rail `main` (14 shown, 116 found)

- q: `elegant lightweight saree for a college farewell family gathering`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 116 found/156 usable (915ms)

| title | brand | price | reason |
|---|---|---:|---|
| Elegant Lavender Handloom Linen Tissue Cotton Saree Soft Lightweight Traditional Wear | Gopikanya | ₹2,999 | Lightweight tissue cotton, lavender, elegant, suitable for traditional occasions, not heavy embroidery. |
| Elegant Royal Blue Grey Handloom Tissue Cotton Saree Soft Lightweight Traditional Party Wear | Gopikanya | ₹2,599 | Lightweight tissue cotton, royal blue/grey, elegant, party wear, no heavy embroidery. |
| Chiku handloom linen tissue saree for a timeless elegant festive look | Gopikanya | ₹2,999 | Lightweight linen tissue saree, elegant and suitable for festive/family gatherings |
| Generous Saree | Suta | ₹7,000 | Cotton blend, olive green, lightweight and elegant, suitable for farewell, ₹7000 |
| Celebrate Saree | Suta | ₹7,490 | Cotton blend, maroon, lightweight and elegant, suitable for farewell, ₹7490 |
| Light Blue Kota Silk Saree | Nalli | ₹7,237 | Light blue silk saree, printed, elegant but possibly heavier silk fabric. |
| Light Blue Organza Silk Saree | Nalli | ₹18,743 | Light blue organza silk saree, striped, elegant but expensive and possibly heavy. |
| Khadi Cotton Saree With Elegant Jhallar Border Paired With A Katha Work Modal With Mina & Zhallar | Karagiri | ₹4,399 | Cotton, mint green, embroidered but lightweight and suitable for party/farewell |
| Elegant Pink Handloom Linen Cotton Saree for a Classy Traditional Look | Gopikanya | ₹2,999 | Linen cotton, solid pink, elegant and lightweight for farewell and family gatherings. |
| Peach linen tissue cotton saree perfect for gentle warm elegant ethnic looks | Gopikanya | ₹2,999 | Linen tissue cotton, peach, solid, elegant, festive/party, lightweight suitable for farewell |

Rerank: main scored 36, kept 14, dropped 22 [heavy embroidery; heavy embroidery; heavy embroidery; heavy embroidery]

Timings: understand 2861ms, search 918ms, curate 4316ms, total 8095ms · tokens 11679/1935 · $0.00619

## 10. high waist squat-proof gym leggings

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"high waist squat-proof gym leggings for women","categories":{"include":["legging"],"exclude":[],"strength":"must"},"useCases":{"include":["gym","sports-active"],"exclude":[],"strength":"must"},"softPreferences":["squat-proof","high waist"]}
```

Chips: `Women` `Legging` `Gym/Workout` `Sports/Active` `~ squat-proof` `~ high waist`

### Rail `main` (24 shown, 229 found)

- q: `high waist squat-proof gym leggings for women`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 229 found/61 usable (725ms)

| title | brand | price | reason |
|---|---|---:|---|
| High-Waist Everyday Cotton Blend Leggings with Pockets | Kica Active | ₹779 | High waist, cotton spandex blend, black color, suitable for gym and sports |
| High-Waist Everyday Cotton Blend Leggings with Pockets | Kica Active | ₹959 | High waist, cotton blend leggings, solid blue, sports use; suitable gym wear. |
| High-Waist Everyday Cotton Blend Leggings with Pockets | Kica Active | ₹779 | High waist, cotton spandex blend, suitable for sports, light blue color |
| Slim Fit High Rise Leggings | Styleunion | ₹699 | Black, slim fit, high rise, nylon/spandex suitable for gym and squat-proof use. |
| Enamor Cut N Sew Leggings, Slim Fit, High Waist · A611 (Purple Haze) | Enamor | ₹1,499 | High waist slim fit leggings, polyester/spandex, solid purple, sports use |
| Enamor Cut N Sew Leggings, Slim Fit, High Waist · A611 (Navy) | Enamor | ₹1,499 | High waist slim fit leggings, polyester/spandex, solid navy, sports use |
| Enamor Cut N Sew Leggings, Slim Fit, High Waist · A611 (Twilight Mauve) | Enamor | ₹1,499 | High waist, slim fit leggings, suitable for sports, polyester-spandex fabric |
| Alcis Women Purple High-Rise Cropped Tights | Alcis Sports | ₹880 | Purple polyester slim high-rise tights for gym, matches high waist, no squat-proof info |
| High Rise Solid Leggings | Benetton | ₹2,099 | High rise, regular fit, viscose/nylon/elastane, workout suitable but less slim for squat-proof. |
| Clio Black Tights for Women | Hummel | ₹899 | Black polyester slim tights for gym, lacks explicit high waist or squat-proof info |

Rerank: main scored 36, kept 27, dropped 9 [score 0.33 (not leggings); score 0.33 (not leggings); score 0.30 (not high waist); score 0.25 (not high waist; no fabric info)]

Timings: understand 3319ms, search 728ms, curate 3928ms, total 7975ms · tokens 11715/1867 · $0.0061

## 11. winter jacket for Manali in December, warm but not bulky, women

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"explicit"},"semanticQuery":"warm but not bulky winter jacket for women for Manali in December","categories":{"include":["jacket"],"exclude":[],"strength":"must"},"useCases":{"include":["winter","travel"],"exclude":[],"strength":"prefer"},"softPreferences":["warm","not bulky"]}
```

Chips: `Women` `Jacket` `~ Winter/Cold Weather` `~ Travel/Vacation` `~ warm` `~ not bulky`

### Rail `main` (24 shown, 3 found)

- q: `warm but not bulky winter jacket for women for Manali in December travel`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 3 found/53 usable (922ms)

| title | brand | price | reason |
|---|---|---:|---|
| Women Tan Self Design Hooded Full Sleeve Jacket | Monte Carlo | ₹3,627 | Women's tan hooded polyester blend jacket, regular fit, casual winter wear |
| Women's Wine and Purple Solid Reversible Winter Jacket | Cantabil | ₹1,699 | Wine nylon reversible winter jacket, casual and daily wear, warm, not bulky |
| Women Winter Sports Zipper Stylish Oversized Jacket | Chkokko | ₹1,499 | Fleece fabric, warm and casual winter wear, women jacket, not bulky, ₹1499. |
| Heat-X Polair Fleece High Neck Jacket · Comfort Stretch with Welt Pockets | Styleunion | ₹899 | Women black polyester fleece jacket, casual winter travel wear, warm and not bulky. |
| Solid Black Fleece Winter Jacket · Unisex | Bombay Trooper | ₹1,875 | Black sherpa fleece, regular fit, warm winter wear, suitable for travel, unisex |
| Women Black Solid Hooded USB Intelligent Heating Jacket | Monte Carlo | ₹3,597 | Women's black polyester blend hooded jacket, warm with heating, casual winter wear. |
| Women Winter Sports Oversized Windcheater Hooded Jacket Camel | Chkokko | ₹1,499 | Polyester oversized windcheater, camel teal, warm and suitable for winter sports |
| Swag Wali Santa Womens Jacket · For Christmas Lovers | Neofaa | ₹1,299 | Women's white blazer-style jacket, tailored, casual/festive, light fabric rayon |
| Women Maroon Hooded 3-in-1 Puffer Jacket with Reversible Sleeveless Jacket | Monte Carlo | ₹4,617 | Maroon polyester blend jacket, warm winter wear, suitable for women, not bulky |
| Champagne Winter Jacket | Kraus Jeans | ₹1,849 | Nylon fabric, regular fit winter jacket for women, warm but possibly bulkier, ₹1849. |

Rerank: main scored 36, kept 26, dropped 10 [score 0.25 (not warm); score 0.15 (men's item); score 0.20 (men's item); score 0.15 (not warm enough; blazer-style)]

Timings: understand 3198ms, search 923ms, curate 3467ms, total 7588ms · tokens 11586/1925 · $0.00614

## 12. gift for my dad's 60th birthday under 3000

Intent:
```json
{"kind":"gift","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"explicit"},"semanticQuery":"classic gift for an older man","price":{"min":null,"max":3000,"strength":"must"},"softPreferences":["classic","understated","timeless"],"occasion":{"name":"60th birthday","location":null,"timeOfYear":null,"role":"father"}}
```

Chips: `Men` `Under ₹3,000` `~ classic` `~ understated` `~ timeless`

Stylist note: For your dad's 60th birthday, classic and timeless gifts work best, reflecting his mature style. Consider items that blend practicality with elegance, suitable for Indian men who appreciate understated fashion. With a budget of ₹3000, focus on quality over quantity, choosing one or two meaningful items.

- Classic Shirts — Timeless wardrobe staple for mature men
- Elegant Accessories — Add subtle sophistication to outfits
- Comfort Footwear — Practical and stylish for daily use

### Rail `rail-3` — Comfort Footwear (8 shown, 17 found)

- q: `classic men's casual and formal shoes under 3000 black brown leather faux leather solid office`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 1 found/1 usable (2355ms) → 4 found/4 usable (725ms) → 5 found/5 usable (653ms) → 17 found/17 usable (638ms) · relaxed: price-20, price-40, category-department
- note: Few exact matches, so also showing related categories and a few up to ₹840.

| title | brand | price | reason |
|---|---|---:|---|
| Men's Formal Shoes · Office, Wedding & Party Wear | Walkaroo | ₹299 | Leather black/brown oxfords, formal and office wear, ₹299 under ₹840 budget. |
| Duke Mens Classic Solid Loafers (FWD4050) | Duke India | ₹719 | Black penny loafers, pvc, solid, casual/office, ₹719 under ₹840 budget |
| Duke Mens Classic Comfort Sandals (FWD3328) | Duke India | ₹839 | Black sandals, synthetic upper, solid, casual/daily wear, ₹839 under ₹840 budget |
| Classic Black & Gold Sliders for Men | Hummel | ₹649 | Black floaters, solid pattern, casual daily wear, under ₹840 budget |
| Classic Brown Sliders for Men | Hummel | ₹549 | Brown floaters, solid pattern, casual daily wear, under ₹840 budget. |
| Classic Black Sliders for Men | Hummel | ₹649 | Black floaters, eva fabric, solid, casual/daily wear, ₹649 under ₹840 budget |
| Men Navy Blue Lace-Up Classic Striped Sneakers Casual Shoes Online | Fausto | ₹699 | Navy blue, pu fabric, striped pattern, casual use, ₹699 under ₹840 budget |
| Duke Mens Office Fit Derby Formal Shoes (FWD5046) | Duke India | ₹799 | Black synthetic derby shoes, formal and office wear, ₹799 under ₹840 budget. |

### Rail `rail-1` — Classic Shirts (12 shown, 94 found)

- q: `classic men's shirts for mature style under 3000 white blue navy grey cotton cotton blend`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 94 found/39 usable (2355ms)

| title | brand | price | reason |
|---|---|---:|---|
| 100% Cotton Classic Full Sleeve Shirt I White | Wrogn | ₹1,099 | White, pure cotton, slim fit, office/daily wear, ₹1099 under ₹1200 budget |
| Classic Regular Fit Shirt · Navy Blue | Wrogn | ₹1,199 | Navy blue, pure cotton, regular fit, office/daily wear, ₹1199 under ₹1200 budget |
| Classic Blue Fine Weave Shirt | Vastrado | ₹759 | Blue, 100% cotton, regular fit, office/daily wear, ₹759 under ₹1200 budget |
| Premium Cotton Classic Dual Tone Broad Stripes Grey Shirt | Vastrado | ₹569 | Grey, 100% cotton, striped, office/daily wear, under ₹1200 budget |
| Navy Blue Plain Blended Cotton Shirt | Banana Club | ₹1,049 | Navy blue cotton blend solid formal shirt, office wear, ₹1049 under ₹1200 budget. |
| Classic Regular Fit Shirt · Dark Blue | Wrogn | ₹1,199 | Dark blue pure cotton, regular fit, casual/office wear, just under ₹1200 budget |
| Premium Cotton Classic White & Brown Tartan Checks | Vastrado | ₹759 | White, 100% cotton, checked, office/daily wear, under ₹1200 budget |
| Cotton Madison Oxford Uber Classic Shirt | Styleunion | ₹799 | Multi-color 100% cotton slim fit solid formal shirt, office wear, ₹799 under ₹1200. |
| Mens Premium Poly Cotton Regular Fit Blue Colour Shirt Gloster | Minister White | ₹995 | Blue poly cotton, regular fit, formal/daily wear, under ₹1200 budget for dad's birthday |
| Colorplus Men Blue Classic Fit Solid Casual Shirt | MyRaymond | ₹1,154 | Blue, cotton, solid, office/daily wear, ₹1154 slightly above ₹1200 budget |

### Rail `rail-2` — Elegant Accessories (12 shown, 51 found)

- q: `classic men's belts watches wallets under 3000 black brown navy leather faux leather solid`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 51 found/49 usable (2355ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men Black & Brown Solid Reversible Formal Italian Leather with Gold Buckle Belt | Louis Philippe | ₹1,119 | Black leather belt, solid pattern, formal use, ₹1119 under ₹1200 budget for dad's 60th |
| Men Brown Solid Leather Casual Belt | Louis Philippe | ₹1,179 | Brown leather belt, solid pattern, casual use, ₹1179 under ₹1200 budget for dad's 60th |
| Men Brown Solid Genuine Leather Casual Belt | Louis Philippe | ₹1,179 | Brown genuine leather belt, solid, casual/office use, ₹1179 under ₹1200 for dad's 60th |
| Solid Thin Retro Belt | Kazo | ₹967 | Black faux leather belt, solid, casual/office use, ₹967 under ₹1200 budget for dad's 60th |
| Classic Thin Belt | Kazo | ₹967 | Brown faux leather, solid, office/daily wear, under ₹1200 fits dad's 60th gift. |
| Retro Knot Thin Belt | Kazo | ₹1,020 | Faux Leather · Solid · ₹1,020 |
| Men Genuine Leather Brown Belts | Styleunion | ₹499 | Brown genuine leather, solid, casual/daily wear, under ₹1200 suits classic dad gift. |
| Men's Brown Solid Belt | Levi's | ₹1,034 | Brown genuine leather, solid, formal/office/daily wear, under ₹1200 fits dad's gift. |
| Men's Black Textured Belt | Levi's | ₹899 | Black genuine leather belt, textured, casual/daily wear, under ₹1200 budget |
| Men's Brown Solid Card Holder | Levi's | ₹854 | Brown genuine leather card holder, solid pattern, daily wear, under ₹1200 budget |

Rerank: rail-3 scored 17, kept 8, dropped 9 [score 0.15 (blue; fabric; embroidered); score 0.13 (grey; pu; striped); score 0.25 (pattern); score 0.17 (pattern; colour)] · rail-1 scored 18, kept 17, dropped 1 [score 0.15 (color; occasion)] · rail-2 TIMEOUT (fallback reasons)

Timings: understand 3372ms, plan 4326ms, search 4377ms, curate 5009ms, total 17528ms · tokens 17755/3468 · $0.01065

## 13. office wear for a pear body type

Intent:
```json
{"kind":"browse","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"office wear for pear body type","useCases":{"include":["office"],"exclude":[],"strength":"prefer"},"softPreferences":["pear body type"],"bodyType":"pear"}
```

Chips: `~ Office/Work` `~ pear body type`

Stylist note: For office wear suitable for a pear body type, focus on balancing proportions by highlighting the upper body with structured tops and darker, streamlined bottoms. September weather in most Indian cities is transitioning from monsoon to early autumn, so breathable fabrics like cotton blends and light silks work well. Opt for classic colors like navy, black, and white with subtle patterns for a professional look.

- Structured Tops — Enhance upper body and balance pear shape
- Streamlined Bottoms — Slim and elongate lower body silhouette
- Light Outerwear — Adds structure and polish to office outfits
- Comfortable Footwear — Complete professional look with comfort

### Rail `rail-1` — Structured Tops (10 shown, 84 found)

- q: `structured tops for office wear to balance pear body shape white navy pastel beige cotton cotton blend`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 84 found/46 usable (3282ms)

| title | brand | price | reason |
|---|---|---:|---|
| Full sleeves Slim Fit Navy Structured Striper Shirt | Killer Jeans | ₹1,599 | Navy cotton slim fit striped shirt, office wear, structured for pear body |
| Scottsie White Tie Detail Structured Shirt | Lea Clothing | ₹2,366 | White cotton poplin, tailored fit, solid, office wear, suits pear body type |
| Top Structured Pleated AirLinen™ Beige Top for Women | Cove and Lane | ₹1,599 | Beige, AirLinen™ fabric, classic regular fit, solid, office wear suitable for pear body |
| Full sleeves Slim Fit Beige Mix Structured Checks Shirt | Killer Jeans | ₹1,599 | Beige slim fit printed shirt, office wear, matches pear body and preferred colors |
| Crisp White Structured Shirt | Kalki | ₹5,799 | White tailored shirt, solid pattern, office wear, fits pear body type preference. |
| Deep Navy Structured Shirt | Kalki | ₹4,599 | Navy, tailored, solid shirt suitable for office wear, fits pear body preference |
| Full Sleeves Slim Fit White Structured Checks Shirt | Killer Jeans | ₹1,759 | White cotton slim fit printed shirt, office wear, fits pear body type preference. |
| White Structured Top | ONLY | ₹1,049 | White, viscose blouse with fit & flare, casual and office wear, good for pear body |
| Cotton Structured Cruiser Shirt | Styleunion | ₹699 | French blue cotton shirt, structured fit, solid pattern, office wear suitable for pear body |
| Cotton Structured Camp Collar Shirt | Styleunion | ₹599 | Black cotton shirt, structured fit, office wear but black not preferred color |

### Rail `rail-2` — Streamlined Bottoms (8 shown, 1916 found)

- q: `streamlined trousers and jeans for pear body office wear black navy grey cotton blend linen blend denim`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 1916 found/79 usable (3282ms)

| title | brand | price | reason |
|---|---|---:|---|
| Black Solid Cotton Blend Straight Ankle Length Trousers | Aurelia | ₹1,199 | Black cotton blend, straight fit trousers suitable for office, matches pear body type |
| Black Mid Rise Ankle Length Slim Fit Pants | VERO MODA | ₹999 | Black slim fit cotton blend trousers, solid pattern, office wear, suitable for pear body |
| Denim Jeans for Men l Breathable & Soft with Color Fastness Straight Fit Cotton Fabric Solid Pattern Button Closure | Cantabil | ₹2,249 | Black denim, straight fit, solid pattern, office wear, suits pear body type. |
| Black Denim Jeans | Aurelia | ₹720 | Black denim skinny jeans, solid pattern, casual wear, less preferred office use |
| Black Denim Trousers | Aurelia | ₹620 | Black straight tencel trousers, solid pattern, casual wear, no office use stated |
| Denim Jeans for Men · Breathable & Soft with Color Fastness Ultra Narrow Fit Cotton Blend Fabric Solid Pattern Button Closure | Cantabil | ₹1,899 | Cotton blend, solid, slim fit jeans in multi-color, suitable for office wear. |
| Cotton Blend Denim Look Wide Leg Trouser | Marks & Spencer | ₹1,899 | Cotton blend wide leg trousers, tailored fit, denim look, suitable for office wear. |
| DENIM AND CHECKS TWEED PANTS | BCPH | ₹4,999 | Black tailored trousers, denim and tweed, office wear, solid color partly |

### Rail `rail-4` — Comfortable Footwear (12 shown, 70 found)

- q: `comfortable formal footwear for office wear black brown navy leather faux leather solid`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 70 found/36 usable (3282ms)

| title | brand | price | reason |
|---|---|---:|---|
| Women's Comfortable Solid Black Pump | Carlton London | ₹1,499 | Black block heels, solid pattern, office wear, comfortable for pear body type. |
| Men Black Comfortable Slip on Leather Loafers | Monte Carlo | ₹3,999 | Black leather loafers, solid pattern, formal office wear, comfortable fit |
| Pick Mens Formal Leather Solid Black Shoes · Fashion Elegant | Inc.5 | ₹1,796 | Black leather derbies, solid pattern, formal office wear matches office and fabric preferences. |
| Now Mens Black Solid Round Toe Formal Leather Monk Shoes | Inc.5 | ₹1,527 | Black leather monk straps, solid pattern, office wear, classic style fits pear body |
| Men Black Solid Lace Up Genuine Leather Formal Oxfords | Monte Carlo | ₹3,999 | Black genuine leather oxfords, solid pattern, formal office wear, classic style fits pear body |
| Select Black Formal Leather Solid Shoes for Mens Now Elegant | Inc.5 | ₹3,990 | Black leather oxfords, solid, formal and office wear suitable |
| Monte Carlo Black Comfortable Slip on Formal Shoes for Men | Monte Carlo | ₹2,749 | Black leather formal shoes, solid pattern, office wear, comfortable fit |
| Leather Black Solid Oxford Shoes · Andean | Blackberrys | ₹6,499 | Black leather oxford, solid pattern, formal office wear, classic style |
| Leather Brown Solid Oxford Shoes · Apricot | Blackberrys | ₹6,499 | Brown leather oxford, solid pattern, formal office wear, classic style |
| Men Black Solid Derby Formal Premium Leather Light Weight Breathable Lining Slip Resistant Flexible Toe Shoes | Louis Philippe | ₹2,359 | Black leather derby, formal office wear, breathable, but textured pattern not solid |

### Rail `rail-3` — Light Outerwear (10 shown, 69 found)

- q: `light structured outerwear for office wear pear body black navy grey cotton blend linen blend polyester blend`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 69 found/26 usable (3282ms)

| title | brand | price | reason |
|---|---|---:|---|
| Light Grey Knitted Blazer | Jack & Jones | ₹1,999 | Grey cotton blend, plain color, regular fit, office/formal use, matches color, fabric, pattern, occasion preferences |
| Light Grey Slim Fit Blazer | Jack & Jones | ₹3,249 | Grey slim fit viscose blend blazer, solid pattern, office wear, structured fit suits pear body |
| Rareism Women's Castlei Light Grey V-Neck Plain Regular Fit Jacket | The House Of Rare | ₹5,249 | Light grey polyester blend, solid pattern, regular fit, office wear, matches color and fabric preferences |
| Men Light Grey Slim Fit Solid Formal Blazer | Louis Philippe | ₹6,229 | Light grey, slim fit, solid blazer, office wear, polyester blend fabric matches preferences |
| Light Grey Double Button Slim Fit Blazer | Jack & Jones | ₹2,999 | Grey slim fit nylon blend blazer, solid pattern, office wear suitable, structured fit |
| Rare Rabbit Men's Sierres Light Grey Viscose Textured Tailored Fit Full Sleeve Lapel Neck Suits | The House Of Rare | ₹8,549 | Light grey, tailored fit, office wear but viscose fabric, not preferred blends |
| Light Grey Contrast Sleeve Blazer | Fail | ₹2,699 | Light grey relaxed fit polyester viscose blazer, solid, office wear but less structured |
| Rare Rabbit Men's Bostic Light Grey Polyester Checked Print Tailored Fit Full Sleeve Lapel Neck Blazer | The House Of Rare | ₹3,638 | Light grey, tailored fit, polyester, office wear; pattern checked not preferred |
| Light Grey Double Button Blazer | Jack & Jones | ₹3,599 | Grey, slim fit, solid blazer, office wear, polyester blend fabric fits preferences |
| Light Blue Ombre Linen Blazer | Jack & Jones | ₹2,749 | Blue linen blazer, regular fit, office wear, but color not preferred navy/black/grey |

Rerank: rail-1 scored 18, kept 10, dropped 8 [score 0.33 (irish cream color; party occasion); score 0.30 (color); score 0.28 (color); score 0.25 (color)] · rail-2 scored 18, kept 8, dropped 10 [score 0.17 (white color; casual wear); score 0.17 (green color; casual wear); score 0.15 (off-white; kids; casual); score 0.30 (men's; nylon blend)] · rail-4 scored 18, kept 15, dropped 3 [score 0.30 (pattern not solid); score 0.30 (derbies); score 0.30 (derbies)] · rail-3 scored 18, kept 10, dropped 8 [score 0.20 (color); score 0.23 (color); score 0.25 (pattern); score 0.25 (casual use; super slim fit)]

Timings: understand 3176ms, plan 5532ms, search 3289ms, curate 4680ms, total 16677ms · tokens 21096/4225 · $0.0132

## 14. navratri garba outfits for a couple

Intent:
```json
{"kind":"occasion","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"navratri garba outfits for a couple","useCases":{"include":["festive","ethnic-traditional"],"exclude":[],"strength":"prefer"},"softPreferences":["couple coordinated outfits"],"occasion":{"name":"navratri","location":null,"timeOfYear":"September","role":null},"needsClarification":{"question":"Who are you shopping for?","options":["Women","Men","Kids"]}}
```

Chips: `~ Festive` `~ Ethnic/Traditional` `~ couple coordinated outfits`

Clarify: Who are you shopping for? [Women / Men / Kids]

Stylist note: Navratri in September typically has warm weather across most parts of India, so lightweight and breathable fabrics like cotton and chiffon are ideal. Traditional vibrant colors like red, yellow, green, and blue are popular for garba, reflecting the festive spirit. Coordinated couple outfits often feature complementary colors or matching embroidery to stand out during the energetic dance nights.

- Women's Ethnic Wear — Traditional vibrant outfits for garba dance nights
- Men's Ethnic Wear — Coordinated traditional outfits for garba festivities
- Footwear for Garba — Comfortable and traditional footwear for dancing
- Accessories for Couple Coordination — Enhance festive look with matching accessories

### Rail `rail-3` — Footwear for Garba (12 shown, 24 found)

- q: `traditional comfortable mojari jutti for garba dance gold silver multicolour leather embroidered mirror work`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 24 found/24 usable (3381ms)

| title | brand | price | reason |
|---|---|---:|---|
| Off White Vegan Leather Jutti With Zardosi Work | Kalki | ₹3,499 | Off-white vegan leather with zardosi embroidery suits festive, leather fabric, metallic color preference. |
| Brown Mens Footwear With Embroidery Work | Kalki | ₹5,500 | Artificial leather, brown, embroidered, festive use, suitable for Navratri garba. |
| Men's Grey Embellished Traditional Jutti & Mojaris Online | Fausto | ₹1,549 | Grey fabric juttis with embellishment, festive and ethnic, matches embroidery preference. |
| Brown Suede Juttis With Mirror Work | Kalki | ₹2,500 | Brown suede, mirror work, festive use; mirror work and festive fit Navratri garba |
| Umang Resham Work Juttis | Tjori | ₹1,469 | Multicolor resham embroidery fits festive, embroidered, multicolor preference but no leather or metallic color. |
| Satrangi Resham Work Juttis | Tjori | ₹1,469 | Multicolor dupion silk with resham embroidery fits festive, embroidered, multicolor preference but no leather or metallic color. |
| Men's Cream Embellished Tassel Traditional Jutti & Mojaris | Fausto | ₹1,549 | Cream fabric, embellished, festive use; lacks gold/silver and leather fabric |
| Men Black Traditional Breathable Jalsa Jutti Mojari For Party | Fausto | ₹949 | Black synthetic mojaris, festive use but lacks preferred gold/silver, leather, embroidery. |
| Black Mens Footwear With Embroidery Detail Work | Kalki | ₹5,500 | Artificial leather, black, embroidered, formal use but not festive specifically. |
| Black Leather And Velvet Jutti With Mirror Work | Kalki | ₹2,500 | Black velvet jutti with mirror work, festive and ethnic, lacks leather and metallic colors. |

### Rail `rail-2` — Men's Ethnic Wear (12 shown, 4029 found)

- q: `colorful kurta set with nehru jacket for navratri garba red yellow green blue multicolour cotton`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 4029 found/125 usable (3381ms)

| title | brand | price | reason |
|---|---|---:|---|
| Yellow Cotton Silk Kurta Jacket Set With Mirror And Dori Work | Kalki | ₹19,239 | Yellow cotton silk kurta set with mirror work, festive and ethnic for Navratri. |
| Yellow Cotton Silk Kurta Set With Floral Embroidered Jacket | Kalki | ₹14,999 | Yellow cotton silk kurta set with floral embroidery, festive and ethnic for Navratri. |
| Set Of 3: Duke Blue Cotton Kurta, Pyjama & Black Kalamkari Nehru Jacket | Tjori | ₹763 | Blue cotton kurta set with black kalamkari Nehru jacket, festive and breathable |
| Emerald Green Chanderi Kurta Set With Tissue Nehru Jacket And Embroidered Buttons | WeaverStory | ₹10,396 | Emerald green cotton blend, embroidered buttons, festive Kurta Set with Nehru jacket |
| Blue Cotton Kurta Jacket Set With Floral Embroidered Nehru Jacket | Kalki | ₹4,500 | Blue cotton silk kurta set with embroidered Nehru jacket, festive and breathable. |
| Multi-Coloured Cotton Floral Nehru Jacket Kurta Set | Kisah | ₹7,998 | Multicolor cotton blend, floral print, festive use, fits Navratri garba theme |
| Teal Blue Chanderi Kurta Set With Tissue Nehru Jacket And Embroidered Buttons | WeaverStory | ₹10,396 | Teal blue cotton blend, embroidered buttons, festive Kurta Set with Nehru jacket |
| Multi-Coloured Silk Textured Nehru Jacket Kurta Set | Kisah | ₹9,449 | Silk blend, multi-coloured, festive kurta set fits Navratri garba and couple look. |
| Multicolor Printed Nehru Jacket Green Kurta Set | Kisah | ₹7,499 | Multicolor cotton blend, printed, festive use, suitable for Navratri garba |
| Boy's Turquoise Blue & Green Printed Nehru Jacket With Cream Color Kurta And Pyjama Set | Vastramay | ₹6,444 | Silk blend kurta set with turquoise blue and cream, festive but cream not preferred |

### Rail `rail-4` — Accessories for Couple Coordination (12 shown, 126 found)

- q: `matching festive jewellery and potli bags for couple gold silver multicolour metal embroidered mirror work`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 126 found/40 usable (3381ms)

| title | brand | price | reason |
|---|---|---:|---|
| Silver Mirror Work Potli | Kalki | ₹5,295 | Silver silk potli with mirror work, festive use, matches couple coordination preference |
| Banjara Style Three Layer Mirror Work Silver Oxidised Choker Necklace | Tjori | ₹1,006 | Silver oxidised choker with mirror work, festive ethnic style suits Navratri garba |
| Glimmering Golden Potli Glass Mirror Work | Tjori | ₹1,069 | Golden potli with mirror work, festive occasion, metallic color fits Navratri garba. |
| Festive Hues Floral Mirror Work Brass Gold Plated Jewellery Set | Voylla | ₹1,499 | Gold brass metal, floral mirror work, festive use, lightweight jewellery at ₹1499 |
| Festive Hues Mirror Work Enamelled Brass Gold Plated Choker Jewellery Set | Voylla | ₹2,999 | Gold brass metal, mirror work choker, festive use, lightweight at ₹2999 |
| Grey Mirror Work Silk Potli With Tassels And Pearl Handle | Kalki | ₹4,867 | Grey raw silk potli with embroidered mirror work, festive use fits Navratri garba |
| Tipify Mirror Work Embellished Fabric Potli | Anekaant | ₹4,549 | Fabric potli with mirror work, multicolor, festive use, fits couple coordinated preference. |
| Droop Mirror Work Quirky Embellished Faux Silk Potli | Anekaant | ₹2,749 | Faux silk potli bag, champagne color, embellished, festive use fits Navratri garba. |
| Estele Gold Plated CZ Bridal Necklace Set with Colored Crystals & Intricate Pearl Work for Women | Estele | ₹3,300 | Gold plated multi-color brass jewellery set, embellished, festive use fits Navratri garba. |
| Estele Gold Plated MachliPatnam Long Necklace Set with Intricate Pearls work and Colored Stones for Women | Estele | ₹6,600 | Gold plated brass necklace with multicolor stones, festive but not metal fabric |

### Rail `rail-1` — Women's Ethnic Wear (12 shown, 346 found)

- q: `vibrant lehenga choli with dupatta for navratri garba red yellow green blue multicolour cotton`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 346 found/95 usable (3381ms)

| title | brand | price | reason |
|---|---|---:|---|
| L Pretty Mustard Yellow Cotton Navratri Lehenga With Patch Work Peplum Top | Ethnic Plus | ₹2,399 | Mustard yellow cotton with patch work and Navratri use matches preferences well. |
| Precious Green Zari Work Cotton Wedding Lehenga Choli With Dupatta | Zeel Clothing | ₹4,559 | Green cotton lehenga with zari work, festive and breathable, fits Navratri theme. |
| Semi Stitched Charming Green Zari Work Cotton Party Wear Lehenga Choli With Dupatta | Ethnic Plus | ₹4,559 | Green cotton lehenga with zari work, festive and breathable, suitable for Navratri. |
| Girls Ethnic Cotton Cambric Yellow Bandhani Printed Lehenga Choli Set with Organza Dupatta | Vastramay | ₹7,197 | Yellow cotton cambric with bandhani pattern suits Navratri garba festive wear. |
| Kids Red Printed Cotton Ready to Wear Lehenga Choli | Libas | ₹1,139 | Red cotton lehenga choli with bandhani print, breathable and festive for Navratri |
| Attractive Blue Foil Work Cotton Navratri Wear Lehenga Choli With Dupatta | Zeel Clothing | ₹4,139 | Blue cotton lehenga with foil work, festive and breathable for Navratri garba. |
| Sage Green Lehenga Choli In Raw Silk With Vibrant Resham Embroidered Cluster Of Summer Blooms And Buttis | Kalki | ₹1,01,950 | Green raw silk with embroidered pattern fits festive and ethnic preference, pricey. |
| Kids Blue Printed Cotton Ready to Wear Lehenga Choli | Libas | ₹1,239 | Blue cotton lehenga choli with bandhani print, breathable and festive for Navratri |
| Green Readymade Cotton Pavadai Set · Lehanga & Blouse | Nalli | ₹2,283 | Green cotton lehenga choli with magenta, flowy and festive, breathable cotton |
| Green Readymade Cotton Pavadai Set · Lehanga & Blouse | Nalli | ₹2,092 | Green and red cotton lehenga choli with checks, festive, breathable for Navratri. |

Rerank: rail-3 scored 18, kept 16, dropped 2 [score 0.30 (no leather); score 0.20 (not leather; not metallic color)] · rail-2 scored 18, kept 17, dropped 1 [score 0.25 (color not preferred)] · rail-4 scored 18, kept 17, dropped 1 [score 0.15 (not festive)] · rail-1 scored 18, kept 16, dropped 2 [score 0.15 (color); score 0.30 (color)]

Timings: understand 2680ms, plan 7067ms, search 3391ms, curate 3571ms, total 16709ms · tokens 21670/4273 · $0.01351

## 15. white shirt

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"white shirt","categories":{"include":["shirt"],"exclude":[],"strength":"must"},"colors":{"include":["white"],"exclude":[],"strength":"must"},"needsClarification":{"question":"Who are you shopping for?","options":["Women","Men","Kids"]}}
```

Chips: `Shirt` `White`

Clarify: Who are you shopping for? [Women / Men / Kids]

### Rail `main` (24 shown, 3162 found)

- q: `white shirt`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 3162 found/117 usable (754ms)

| title | brand | price | reason |
|---|---|---:|---|
| White Shirt | Kraus Jeans | ₹1,699 | White, 65% cotton + 35% tencel, regular fit, solid casual/office shirt at ₹1699 fits best |
| Tricolour Crest 100% Linen Breathable White Shirt | Louis Philippe | ₹3,826 | 100% linen, tailored fit, white, formal office wear at ₹3826 matches white shirt request |
| Tricolour Crest Wrinkle-free Premium Cotton White Shirt | Louis Philippe | ₹3,292 | 100% cotton, tailored fit, white, formal/business shirt at ₹3292 fits white shirt request |
| Embroidered logo cotton shirt (White) | HUEMN | ₹6,000 | 100% cotton, white, regular fit, embroidered, suitable for office and casual wear at ₹6000. |
| Uncollared Shirt · White | I AM Salt | ₹3,490 | White lenzing modal fabric, regular fit, solid, office and casual wear at ₹3490. |
| Eve Iconic Supima Cotton White Shirt | Mulmul | ₹6,950 | White supima cotton, regular fit, embroidered, casual and office wear at ₹6950. |
| Otto Supima Cotton White Shirt | Mulmul | ₹7,950 | Supima cotton, tailored fit, white, suitable for casual/office/festive at ₹7950 |
| Crisp white shirt (PL-28) | Kapraaha | ₹4,623 | 100% cotton, comfortable fit, white, embroidered, casual/office/daily at ₹4623 |
| Basalt Shirt · White Embroidered | Nicobar | ₹5,000 | 100% cotton, white, embroidered, regular fit, suitable for office and casual wear at ₹5000. |
| Regular Fit 100% Cotton Spread Collar Shirt · White | Celio | ₹2,599 | 100% cotton, regular fit, white solid shirt for casual/office wear at ₹2599 |

Rerank: main scored 36, kept 36, dropped 0

Timings: understand 2554ms, search 756ms, curate 4572ms, total 7883ms · tokens 11315/1964 · $0.00609

## 16. kurti

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"kurti","categories":{"include":["kurti"],"exclude":[],"strength":"must"},"needsClarification":{"question":"Who are you shopping for?","options":["Women","Men","Kids"]}}
```

Chips: `Kurti`

Clarify: Who are you shopping for? [Women / Men / Kids]

### Rail `main` (24 shown, 653 found)

- q: `kurti`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 653 found/79 usable (872ms)

| title | brand | price | reason |
|---|---|---:|---|
| Elegant Peach Ethnic Kurti · Soft & Stylish Fit | Label Flavia | ₹3,996 | Cotton fabric, peach color, regular fit, suitable for daily and special occasions. |
| Dharan "Bundki Kurti" Blue Block Printed Top | Okhai | ₹2,500 | 100% cotton, blue block printed, straight fit, festive and daily wear suitable. |
| Earth’s Pulse Blockprinted Cotton Kurti | Chidiyaa | ₹2,690 | Cotton maroon blockprinted kurti, regular fit, daily and festive occasions. |
| Night’s Sigh Block printed Cotton Kurti | Chidiyaa | ₹2,890 | Cotton block printed kurti, relaxed fit, multi-color, casual and festive wear. |
| Black Patola Print Silk Long Kurti | Kalki | ₹17,500 | Black silk kurti with patola print, suitable for festive and cultural events. |
| Blue Chanderi Kurti With Purple Block Print | Kalki | ₹8,750 | Blue-purple chanderi kurti with block prints, ideal for festive and party occasions. |
| Mustard Silk Kurti With Multicolor Patola Print | Kalki | ₹10,150 | Mustard silk kurti with multicolor patola print, good for festive and traditional events. |
| Plus Size Mint Green Floral Printed Cotton Kurti for Women | Label Flavia | ₹4,996 | Cotton fabric, relaxed fit, mint green floral print, suitable for casual daily wear. |
| Mint Green Handblock Printed Cotton Kurti | Label Flavia | ₹3,996 | Pure cotton, regular fit, mint green handblock print, daily casual kurti. |
| Red Bandhani Printed Kurti For Women | The Kaftan Company | ₹2,550 | Red modal kurti with bandhani print, relaxed fit, suitable for party/festive/casual. |

Rerank: main scored 36, kept 36, dropped 0

Timings: understand 2474ms, search 874ms, curate 4160ms, total 7508ms · tokens 11355/1985 · $0.00614

## 17. kuch accha sa dikhao party ke liye

Intent:
```json
{"kind":"browse","language":"hinglish","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"stylish party wear","useCases":{"include":["party"],"exclude":[],"strength":"prefer"},"softPreferences":["stylish"],"needsClarification":{"question":"Who is it for?","options":["Women","Men","Kids"]}}
```

Chips: `Women` `~ Party/Club` `~ stylish`

Clarify: Who is it for? [Women / Men / Kids]

Stylist note: For a stylish party look in late September, lightweight fabrics like chiffon or georgette work well due to the lingering warmth in most Indian cities. Bold colors like black, red, or metallics are popular for evening parties, and embellished or embroidered details add a festive touch. Opt for comfortable yet chic footwear and accessories to complete your look.

- Party Dresses — Core stylish pieces for party vibes
- Footwear — Complete the look with chic, comfortable shoes
- Accessories — Add sparkle and style with jewelry and bags

### Rail `rail-1` — Party Dresses (12 shown, 81 found)

- q: `stylish party dresses for women in bold colors black red gold silver maroon chiffon`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 81 found/110 usable (2635ms)

| title | brand | price | reason |
|---|---|---:|---|
| Kavya Mini Dress for Women · Stylish Mini Dress | Verb by Pallavi Singhee | ₹30,200 | Silver embellished midi dress, party/evening use, stylish, fits color and occasion preferences. |
| Lucina Mini Dress for Women · Stylish Mini Dress | Verb by Pallavi Singhee | ₹28,500 | Embellished midi dress in tulle, suitable for party/evening, stylish and comfortable. |
| Gold and Silver Cowl Party Dress | Shaurya Sanadhya | ₹4,391 | Gold and silver, lycra fabric, embellished, party/evening suitable, stylish fit |
| Glamorous Black Sleeveless Round Neck Embellished Party Dress For Showstopping Style | Latin Quarters | ₹1,799 | Black, embroidered, party/evening, classic fit, linen blend fabric |
| Dark Red Floral Printed Velvet Cocktail Dress | Wishful By W | ₹6,580 | Velvet fabric, maroon color, floral pattern, party/evening use fits preferences |
| Alicia Mini Dress for Women · Stylish Mini Dress | Verb by Pallavi Singhee | ₹29,100 | Golden embellished midi dress, party/festive use, fits color and occasion preferences. |
| Abstract Floral Printed A-Line Pleated Maxi Dress | Fashor | ₹2,599 | Red chiffon maxi dress, flowy and party suitable, matches color and fabric preferences. |
| Maroon Abstract Print One Shoulder Dress | Vedikam | ₹16,500 | Maroon satin, flowy fit, party use, abstract print not preferred |
| Scarlet Bloom Dress | Vedikam | ₹14,485 | Red cotton satin wrap dress, flowy and party-appropriate, matches color and fabric. |
| Stunning High Neck Dress For Women | Neofaa | ₹3,799 | Lurex chiffon fabric, solid pattern, party use, but color honey orange not preferred |

### Rail `rail-2` — Footwear (12 shown, 24 found)

- q: `comfortable stylish heels or juttis for party wear women black gold silver red leather suede`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 24 found/67 usable (2635ms)

| title | brand | price | reason |
|---|---|---:|---|
| Black Peshawari Footwear In Rexine And Suede Leather Embellished With A Brooch | Kalki | ₹2,397 | Black leather mojaris, embellished, perfect for festive/party occasions, regular fit. |
| Women's Comfortable Solid Black Pump | Carlton London | ₹1,499 | Black block heels, solid, comfortable, party use, under ₹1500, fits style preference. |
| Now Womens Black Party Wear Solid Round Toe Stiletto Heels | Inc.5 | ₹1,199 | Black suede stilettos, solid pattern, ideal for party/club wear. |
| Black and Walnut Brown Wooden Carved Braided Solid Heels | Tjori | ₹3,419 | Black faux leather heels, solid textured pattern, suitable for party, stylish and comfortable. |
| Now Womens Black Party Wear Embellished Pattern Round Toe Platform Heels | Inc.5 | ₹1,396 | Black synthetic wedges with embellished pattern, suitable for party wear. |
| Ina Textured Heels | Eridani | ₹1,469 | Black faux leather wedges with textured pattern for festive/party wear, comfortable wedge fit. |
| Medallion Yellow Ajrakh Cotton Strappy Block Heels In Suede | Tjori | ₹1,169 | Suede and cotton, block heels, printed pattern, party use; color medallion yellow less preferred. |
| Indigo Leaf Block Print Cotton Strappy Block Heels In Suede | Tjori | ₹1,319 | Suede fabric, block heels, festive use; blue not preferred color for party. |
| Women's Adjustable Ankle Strap Comfortable Wedge Heel | Carlton London | ₹1,799 | Adjustable ankle strap, wedge heel, party use; multi color less preferred, no fabric info. |
| Women Fuchsia Comfortable Wedge Flip Flops | Carlton London | ₹519 | Comfortable wedge, solid pattern, party use; fuchsia color less preferred, casual style. |

### Rail `rail-3` — Accessories (12 shown, 116 found)

- q: `stylish party jewelry and bags for women gold silver multicolour metal alloy embellished`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 116 found/131 usable (2635ms)

| title | brand | price | reason |
|---|---|---:|---|
| Premium Rhodium Plated And Cz Stylish Necklace And Earring Set For Women | Carlton London | ₹2,323 | Silver rhodium plated embellished set, party use, ₹2323 fits sparkly and party preference. |
| Silver and Gold Embossed Metal Bag | Kalki | ₹6,899 | Gold metal embossed bag, party/evening use, stylish at ₹6899. |
| Silver and Gold Embossed Textured Metal Bag with Tassels | Kalki | ₹6,899 | Gold metal embossed textured bag with tassels, party/wedding use at ₹6899. |
| Premium Gold Plated With Cz Stylish Necklace And Earring Set For Women | Carlton London | ₹2,292 | Gold, embellished necklace and earrings set, party/festive use, stylish at ₹2292. |
| Estele GOLD Plated Kundan Chandbali Hook Dangler Stylish Fancy Party Wear Earrings For Women | Estele | ₹1,000 | Gold plated kundan chandbali earrings, fancy party wear, stylish at ₹1000. |
| Carlton London Gold Plated Stylish Necklace For Women | Carlton London | ₹701 | Gold plated pendant set, solid, party use, ₹701 matches gold and party preference. |
| Gold Pearl Embellished Metal Bag | Kalki | ₹5,899 | Gold metal embellished bag, party use, ₹5899 matches gold, metal, embellished, party. |
| Gold Plated Saharey with Earrings | Ayesha Accessories | ₹25,100 | Gold plated embellished jewellery, festive/party, metal, matches gold and party use. |
| Golden Jewellery Hamper for Her, Gifting for Women and Girfriends | Voylla | ₹399 | Gold brass jewellery, solid pattern, party/festive use, matches color and occasion preferences. |
| Estele Fashion Earrings for Women and Girls Rhodium Plated Latest Stylish Medium Metallic Half Hoop Earrings Party/Office Wear for Girls and Women | Estele | ₹359 | Silver alloy half hoop earrings, metallic ridged pattern, party and office wear at ₹359. |

Rerank: rail-1 scored 18, kept 17, dropped 1 [score 0.30 (color)] · rail-2 scored 18, kept 15, dropped 3 [score 0.15 (men's item; blue color); score 0.20 (pink color); score 0.20 (green color)] · rail-3 scored 18, kept 18, dropped 0

Timings: understand 2410ms, plan 4139ms, search 2639ms, curate 4289ms, total 13477ms · tokens 17572/3081 · $0.00996

## 18. denim jacket like levis but cheaper

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"classic blue denim jacket","categories":{"include":["denim-jacket"],"exclude":[],"strength":"must"},"brands":{"include":[],"exclude":["levi-s"],"strength":"prefer"},"softPreferences":["levi's-style classic denim"]}
```

Chips: `Women` `Denim Jacket` `✕ Levi's` `~ levi's-style classic denim`

### Rail `main` (24 shown, 139 found)

- q: `classic blue denim jacket`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 139 found/90 usable (979ms)

| title | brand | price | reason |
|---|---|---:|---|
| Navy Blue Denim Jacket | VERO MODA | ₹1,199 | Navy blue, 100% cotton denim jacket, regular fit, casual daily wear, ₹1199 cheaper than Levi's |
| Blue Distressed Denim Jacket | VERO MODA | ₹1,559 | 100% cotton blue denim jacket, regular fit, casual, ₹1559 cheaper than Levi's. |
| Blue Denim Washed Jacket | Sassafras | ₹816 | Blue denim comfort fit jacket, casual/winter wear, ₹816 cheaper than Levi's. |
| Buckenham Blue Indigo Denim Jacket | Bonkers Corner | ₹1,999 | Indigo tailored 100% cotton denim jacket, casual, ₹1999 cheaper than Levi's |
| Blue Solid Denim Jacket | Kraus Jeans | ₹997 | Blue regular fit denim jacket, cotton blend, casual, cheapest at ₹997, Levi's style alternative |
| Dark Blue Denim Trucker Jacket | VERO MODA | ₹1,319 | Dark blue 100% cotton denim trucker jacket, regular fit, casual, ₹1319 cheaper than Levi's |
| Dark Blue Slim Fit Denim Jacket | Kraus Jeans | ₹1,097 | Dark blue slim fit denim jacket, 100% cotton, ₹1097, cheaper than Levi's |
| Classic Blue Full Sleeve Collar Denim Casual Jacket For Timeless Style | Latin Quarters | ₹1,299 | Classic fit blue denim jacket, casual/office wear, ₹1299 cheaper than Levi's |
| Light Blue Denim Jacket | Kraus Jeans | ₹1,297 | Light blue slim denim jacket, mostly cotton blend, casual daily wear, ₹1297 cheaper than Levi's |
| Light Blue Cropped Denim Jacket | ONLY | ₹4,199 | Blue, 100% cotton denim jacket, regular fit, casual, cheaper than Levi's ₹4199 |

Rerank: main scored 36, kept 32, dropped 4 [score 0.30 (over budget if budget was low); score 0.15 (over budget); score 0.15 (over budget); score 0.30 (over budget implied by cheaper than Levi's)]

Timings: understand 2369ms, search 981ms, curate 3414ms, total 6764ms · tokens 11498/2093 · $0.00637

## 19. school shoes for boys

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"kids","kidGender":"boy","ageYears":null,"source":"explicit"},"semanticQuery":"school shoes for boys","categories":{"include":["school-shoe"],"exclude":[],"strength":"must"},"useCases":{"include":["school"],"exclude":[],"strength":"prefer"}}
```

Chips: `Boys` `School Shoe` `~ School/College`

### Rail `main` (24 shown, 29 found)

- q: `school shoes for boys`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 29 found/27 usable (407ms)

| title | brand | price | reason |
|---|---|---:|---|
| KHADIM Leather Derby School Shoe for Boys (9-15 yrs) | Khadims | ₹949 | Black leather derby school shoes, regular fit, solid pattern, school/formal/daily wear at ₹949. |
| KHADIM School Sports & PT Shoes for Boys (9-15 yrs) | Khadims | ₹649 | Black synthetic & mesh, regular fit, suitable for school sports and daily wear. |
| Boys School Shoes · WV522 Black | Walkaroo | ₹355 | Black faux leather, regular fit, formal and school daily wear for boys. |
| Prefect Black Lacing Uniform School Shoes For Kids S/BOY-LS By Liberty | Liberty Shoes | ₹1,099 | Black buff fabric, regular fit, school shoes for boys, ₹1099 fits school use |
| Boys School Shoes · WV521 Black | Walkaroo | ₹334 | Black faux leather school shoes, regular fit, daily wear/formal for boys, ₹334 |
| Prefect Black Non Lacing Uniform School Shoes For Kids S/BOY-LS N By Liberty | Liberty Shoes | ₹1,299 | Black PU non-lacing school shoes, regular fit, school/daily wear for boys, ₹1299 |
| Prefect Black Lacing Uniform School Shoes For Kids SKOOLBOYPU By Liberty | Liberty Shoes | ₹499 | Black PU cfb, regular fit, solid pattern, school/daily wear, suitable for boys' school shoes. |
| Walkaroo Senior boys School Shoes · WV502 Black | Walkaroo | ₹639 | Black faux leather PU, regular fit, solid pattern, daily wear/formal for boys' school shoes. |
| KHADIM Leather Derby School Shoe for Boys (2-6.5 yrs) | Khadims | ₹999 | Leather, black, solid, regular fit school shoes for boys aged 2-6.5 years, ₹999. |
| Walkaroo boys School Shoes · WV502 Black | Walkaroo | ₹489 | Black faux leather school shoes, regular fit, suitable for daily wear/formal school use. |

Rerank: main scored 27, kept 27, dropped 0

Timings: understand 2249ms, search 408ms, curate 3692ms, total 6349ms · tokens 10071/1486 · $0.00483

## 20. bodycon dress, no cutouts, not red

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"bodycon dress excluding cutouts and red color","categories":{"include":["bodycon-dress"],"exclude":[],"strength":"must"},"colors":{"include":[],"exclude":["red"],"strength":"must"},"fits":{"include":["bodycon"],"exclude":[],"strength":"must"},"textExclusions":["cutouts"]}
```

Chips: `Women` `Bodycon Dress` `✕ Red` `Bodycon` `✕ cutouts`

### Rail `main` (24 shown, 106 found)

- q: `bodycon dress excluding cutouts and red color`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 106 found/89 usable (1042ms)

| title | brand | price | reason |
|---|---|---:|---|
| Black Cable Knitted Bodycon Dress | ONLY | ₹1,399 | Black, 100% cotton, bodycon fit, no cutouts, casual/daily wear, ₹1399 |
| Brown Knitted Bodycon Dress | VERO MODA | ₹1,719 | Brown, knitted bodycon, solid, no cutouts, casual/party wear, ₹1719 |
| Handcrafted 1000 Panel Bodycon Dress (Black) | HUEMN | ₹19,000 | Black cotton hosiery bodycon dress, no cutouts, party wear at ₹19000 |
| Jacqueline Black Embroidered Midi Bodycon Dress | Lea Clothing | ₹9,491 | Black neoprene embroidered bodycon dress, no cutouts, party wear ₹9491 |
| Zorina Sheer Ruched Mesh Bodycon Dress CL | Lea Clothing | ₹6,261 | Black dobby mesh bodycon, no cutouts, suitable for party/semi-formal, not red |
| Rareism Women's Ronfa Black Viscose Blend High Neck Plain Sleeveless Midi Bodycon Dress | The House Of Rare | ₹3,599 | Black viscose blend bodycon midi dress, sleeveless, no cutouts, not red |
| Rareism Women's Biyanca Black Acrylic Crew Neck Plain Mini Bodycon Dress | The House Of Rare | ₹2,799 | Black acrylic blend mini bodycon dress, no cutouts, not red |
| Women Royal Blue Notch Collar Belted Bodycon Dress | Sassafras | ₹1,074 | Blue karera crepe bodycon dress, no cutouts, not red, party/festive at ₹1074 |
| Glossy Black Imported Velvet Bodycon Dress | Neofaa | ₹1,999 | Black imported velvet bodycon dress, no cutouts, not red, party/dinner at ₹1999 |
| Round Neck Solid Bodycon Dress | Benetton | ₹1,749 | Blue cotton blend bodycon dress, no cutouts, not red, casual/party at ₹1749 |

Rerank: main scored 36, kept 35, dropped 1 [score 0.15 (color red)]

Timings: understand 2668ms, search 1046ms, curate 3640ms, total 7354ms · tokens 11648/1992 · $0.00627

## 21. diwali ethnic wear for a 2 year old boy

Intent:
```json
{"kind":"occasion","language":"en","audience":{"segment":"kids","kidGender":"boy","ageYears":2,"source":"explicit"},"semanticQuery":"boys festive ethnic kurta set for toddlers","categories":{"include":["kurta-set"],"exclude":[],"strength":"must"},"useCases":{"include":["festive"],"exclude":[],"strength":"prefer"},"occasion":{"name":"Diwali","location":null,"timeOfYear":null,"role":null}}
```

Chips: `Boys · 2y` `Kurta Set` `~ Festive`

Stylist note: For a 2-year-old boy celebrating Diwali in late September, lightweight and breathable fabrics like cotton or cotton-blend are ideal due to the warm weather across most of India. Traditional colors such as bright reds, yellows, and golds are popular for Diwali, symbolizing prosperity and joy. A kurta set in festive colors with comfortable fits will keep the child happy and stylish during the celebrations.

- Kurta Set — Essential traditional outfit for festive occasions

### Rail `rail-1` — Kurta Set (12 shown, 45 found)

- q: `festive kurta set for toddler boy comfortable breathable red yellow gold orange cotton cotton blend`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 45 found/115 usable (734ms)

| title | brand | price | reason |
|---|---|---:|---|
| Baby Boy Floral Print Kurta Set | Tiber Taber | ₹1,885 | 100% cotton, yellow color, floral print, festive occasion fits Diwali ethnic wear for 2-year-old boy. |
| Cambric Cotton Orange Kurta Pajama Set With Vest | Kilol | ₹2,020 | Cambric cotton, orange color, embellished pattern, festive occasion, comfortable fabric |
| Red Multicolor Cotton Blend Printed Kurta Dhoti Set | Kisah | ₹3,374 | Red multicolor, cotton blend, printed, festive kurta dhoti set for 2-year-old boy. |
| Baby Boy Bandhani Print Cotton Kurta Set | Tiber Taber | ₹1,613 | Cotton fabric, red color, bandhani print, festive occasion matches Diwali wear for 2-year-old boy. |
| Red Multicolor Cotton Blend Printed Kurta Pyjama Set | Kisah | ₹2,249 | Red multicolor, cotton blend, printed kurta pyjama set for festive occasions. |
| Delightful MBE58 Kaushal Cotton Toddler Kurta Online | Kusvaa | ₹380 | Cotton fabric, yellow and white colors, printed pattern, festive occasion suitable but white less preferred. |
| Comfortable MBE57 Hanan Cotton Toddler Kurta Online | Kusvaa | ₹380 | Cotton, white kurta with printed pattern, festive use, but white not preferred color |
| Boy's Multicolor-Base-White Cotton Blend Kurta Pyjama Set | Vastramay | ₹2,271 | Multicolor cotton blend kurta pyjama set, festive but no preferred colors or patterns. |
| Crisp Cotton White Kurta Set for Boys | Charkhee | ₹2,550 | 100% cotton, solid white kurta set, festive use, but white not preferred color |
| Dusky Brown Cotton Kurta Pyjama Set | Tjori | ₹440 | Cotton, solid, festive; dusky brown less preferred than red/yellow/orange |

Rerank: rail-1 scored 18, kept 15, dropped 3 [score 0.30 (silk blend); score 0.25 (silk; blue); score 0.15 (silk; black)]

Timings: understand 2756ms, plan 2356ms, search 736ms, curate 3353ms, total 9202ms · tokens 10596/1277 · $0.00428

## 22. monsoon footwear that won't get ruined

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"unknown","kidGender":null,"ageYears":null,"source":"unknown"},"semanticQuery":"monsoon footwear durable and water-resistant","useCases":{"include":["winter"],"exclude":[],"strength":"prefer"},"textExclusions":["ruined"],"softPreferences":["durable","water-resistant","quick-dry","footwear"]}
```

Chips: `~ Winter/Cold Weather` `✕ ruined` `~ durable` `~ water-resistant` `~ quick-dry` `~ footwear`

### Rail `main` (11 shown, 932 found)

- q: `monsoon footwear durable and water-resistant winter`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 932 found/169 usable (744ms)

| title | brand | price | reason |
|---|---|---:|---|
| SNEAKEEZ Men's Rain Shoes · WC8791 Dark Grey | Walkaroo | ₹329 | EVA rain shoes, water resistant, quick-dry, monsoon casual footwear at ₹329. |
| KHADIM Waves Washable Slip-On Shoe for Women | Khadims | ₹316 | PVC slip-ons, washable and suitable for monsoon and daily wear at ₹316. |
| KHADIM Washable Slip On Shoe for Men | Khadims | ₹399 | Synthetic floaters, washable and suitable for monsoon, durable and quick-dry at ₹399. |
| Women's Tall Winter Boot with Decorative Buckle Straps | Carlton London | ₹3,379 | Black leather ankle boots, durable and suitable for winter wear, ₹3379. |
| Men's Slip-On Rain Shoes · WC4703 Brown | Walkaroo | ₹284 | PVC floaters, brown, casual, water-resistant for monsoon use at ₹284. |
| KHADIM Waves Washable Slip On Shoe for Men | Khadims | ₹460 | EVA floaters, washable, monsoon use, casual, water-resistant material |
| Men's Bounceez Water Resistant Sandals · WGP50019 Reddish Brown | Walkaroo | ₹599 | Water resistant synthetic leather sandals, casual daily wear, suitable for monsoon. |
| Women's Beautiful Slingback Monsoon-Ready Sandals | Carlton London | ₹849 | White flat sandals, casual wear but no fabric info or water resistance. |
| Monsoon Blue- Father & Son | House of Malabaar | ₹7,000 | Quick dry polyester swim trunks, water-resistant fabric, suitable for wet conditions. |
| KHADIM Washable Slingback Heel Sandal for Women | Khadims | ₹714 | EVA sandals, washable and suitable for monsoon, quick-dry and durable at ₹714. |

Rerank: main scored 36, kept 11, dropped 25 [score 0.05 (not footwear); score 0.05 (not footwear); score 0.05 (not footwear); score 0.05 (not footwear)]

Timings: understand 2904ms, search 750ms, curate 2928ms, total 6582ms · tokens 11651/1671 · $0.00576

## 23. interview outfit for a male fresher under 4000

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"explicit"},"semanticQuery":"interview outfit for a male fresher under 4000","categories":{"include":["shirt","trouser","blazer"],"exclude":[],"strength":"must"},"useCases":{"include":["formal","office"],"exclude":[],"strength":"prefer"},"price":{"min":null,"max":4000,"strength":"must"},"softPreferences":["fresh look","professional"]}
```

Chips: `Men` `Shirt` `Trouser` `Blazer` `~ Formal` `~ Office/Work` `Under ₹4,000` `~ fresh look` `~ professional`

### Rail `main` (18 shown, 15 found)

- q: `interview outfit for a male fresher under 4000 formal office`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 15 found/18 usable (826ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men’s Crownline Banker Collar Dress Shirt Windsor Blue · Elegant Office Shirt | Vahro | ₹3,499 | Blue 100% giza cotton slim fit formal shirt, office and formal use, ₹3499 under ₹4000 |
| Park Avenue Men Blue Super Slim Fit Formal Suit | MyRaymond | ₹3,887 | Blue super slim fit 2-piece suit, formal, office wear, ₹3887 under ₹4000 |
| Men’s Pinpoint Oxford Shirt White · Essential Office Shirt | Vahro | ₹2,599 | 100% cotton pinpoint Oxford white shirt, classic fit, formal office wear, ₹2599 under ₹4000 |
| Men’s Crownline Truffle Checks Dress Shirt · Refined Office Style | Vahro | ₹3,499 | Truffle 100% giza cotton regular fit checked shirt, formal and office wear, ₹3499 |
| Park Avenue Men Blue Super Slim Fit Checks Formal Jacket | MyRaymond | ₹3,849 | Blue cotton slim fit checked blazer, formal office wear, ₹3849 under ₹4000 |
| Ice Mist Office Classic Oxford Shirt | Vastrado | ₹759 | 100% cotton tailored solid blue shirt, office/formal, ₹759 under ₹4000 |
| Office Straight Fit Pants | Everdion | ₹1,499 | Beige slim fit trousers, formal and office wear, under ₹4000 budget |
| Men Trouser Relaxed Fit Olive Mid Rise | Spykar | ₹3,499 | Green relaxed fit cotton trousers, casual and office wear, ₹3499 under ₹4000 |
| Officer Pants · Luxury Cotton With E-Fast Stretch | Styleunion | ₹1,399 | Cotton chinos, regular fit, office wear, under ₹4000 but casual, no blazer or shirt |
| Men’s Crownline Pinkport Checks Dress Shirt · Elegant Office Shirt | Vahro | ₹2,999 | 100% Giza cotton, checked formal shirt, office wear, ₹2999 under ₹4000, fresh look |

Rerank: main scored 18, kept 18, dropped 0

Timings: understand 3401ms, search 828ms, curate 3459ms, total 7688ms · tokens 8906/1163 · $0.00385

## 24. pastel co-ord set for brunch

Intent:
```json
{"kind":"product","language":"en","audience":{"segment":"women","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"pastel co-ord set for brunch","categories":{"include":["co-ord-set"],"exclude":[],"strength":"must"},"colors":{"include":["pastel-pink","peach"],"exclude":[],"strength":"prefer"},"useCases":{"include":["casual","daily-wear","family-gathering"],"exclude":[],"strength":"prefer"},"softPreferences":["pastel colors","lightweight","comfortable"]}
```

Chips: `Women` `Co-ord Set` `~ Pastel / blush pink` `~ Peach / coral` `~ Casual` `~ Daily Wear` `~ Family Gathering` `~ pastel colors` `~ lightweight` `~ comfortable`

### Rail `main` (24 shown, 17 found)

- q: `pastel co-ord set for brunch peach casual daily wear family gathering`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 17 found/95 usable (718ms)

| title | brand | price | reason |
|---|---|---:|---|
| Pastel Floral Co-ord Set · Stylish and Comfortable Cotton Wear | Label Flavia | ₹899 | Pastel cotton co-ord set, relaxed fit, casual/daily wear, ₹899 fits brunch and comfort. |
| Pastel Orange Metallic Fringe Co-Ord Set | House of Designers | ₹11,450 | Pastel orange moss crepe co-ord, regular fit, festive/casual but pricey at ₹11450. |
| Pastel Bloom Co-ord Set | Juniper Fashion | ₹1,995 | Pastel multi cotton fit & flare co-ord, floral, casual/brunch, ₹1995 suits pastel and occasion. |
| Midnight Jungle Co-ord Set · Black & Pastel Mix | Label Flavia | ₹3,996 | Black and pastel cotton co-ord, relaxed fit, brunch occasion, ₹3996, less pastel dominant. |
| Pastel Bloom Top & Pant Co-Ord Set | House of Designers | ₹14,500 | Pastel aqua blue linen co-ord set, casual and festive, but not peach or blush pink. |
| Pastel Floral Cotton Co-ord Set · Top & Trousers | Label Flavia | ₹799 | Pastel floral cotton co-ord set, relaxed fit, casual and daily wear, lightweight and comfortable. |
| Pastel Green Floral Lace Jacket and Shorts Co-ord Set | The Kaftan Company | ₹3,295 | Pastel green floral lace co-ord set, comfortable fit, casual and daily wear, lightweight fabric. |
| Luxe Velvet Womens Co-Ord Set · Perfect Statement Piece for Gatherings | Neofaa | ₹3,799 | Sky blue · Velvet · ₹3,799 |
| Peach & Blue Printed Co-Ord Set | House of Designers | ₹14,900 | Peach pastel, satin linen, flowy fit, casual and festive occasions match brunch. |
| Classy Quirky Co-Ord Set For Women | Neofaa | ₹3,199 | White · Satin, lycra, polyester · ₹3,199 |

Rerank: main TIMEOUT (fallback reasons)

Timings: understand 2864ms, search 721ms, curate 5029ms, total 8698ms · tokens 11882/2014 · $0.0064

## 25. Goa trip outfits for a guy, 6000 total

Intent:
```json
{"kind":"browse","language":"en","audience":{"segment":"men","kidGender":null,"ageYears":null,"source":"implied"},"semanticQuery":"men's outfits for a Goa trip","useCases":{"include":["travel","beach"],"exclude":[],"strength":"prefer"},"price":{"min":null,"max":6000,"strength":"must"},"softPreferences":["comfortable","lightweight","breathable"]}
```

Chips: `Men` `~ Travel/Vacation` `~ Beach/Pool/Resort` `Under ₹6,000` `~ comfortable` `~ lightweight` `~ breathable`

Stylist note: For a Goa trip in late September, expect warm and humid weather with occasional showers. Opt for lightweight, breathable fabrics like cotton and linen in bright or pastel colors to stay comfortable and stylish. With a ₹6000 budget, prioritize versatile casual shirts, shorts, and comfortable sandals for beach and travel use.

- Casual Shirts — Lightweight, breathable tops for warm weather
- Shorts & Trousers — Comfortable bottoms for beach and travel
- Footwear — Breathable, easy-to-wear shoes for beach and walking

### Rail `rail-3` — Footwear (12 shown, 991 found)

- q: `men's comfortable sandals and casual shoes for beach travel brown beige black leather faux leather canvas`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 991 found/62 usable (2607ms)

| title | brand | price | reason |
|---|---|---:|---|
| Refresh Looks With Black Casual Leather Sandals for Mens Now | Inc.5 | ₹1,316 | Black leather sandals, solid pattern, casual wear, ₹1316 under ₹1500 budget |
| Mens Black Casual Sandals for Polished Looks · Comfort Today | Inc.5 | ₹1,316 | Black leather sandals, solid pattern, casual wear, ₹1316 under ₹1500 budget |
| Brown Leather Flip Flops | Jack & Jones | ₹1,249 | Brown, cotton upper, solid pattern, beach/casual use, ₹1249 under ₹1500 budget |
| Men's Comfort Dual Buckle Strap Slide Sandals | Carlton London | ₹874 | Off white leather sandals, crisscross pattern, beach use, ₹874 under ₹1500 budget |
| Mens Black Casual Sandals for Polished Looks · Trendy Casual | Inc.5 | ₹1,476 | Black leather sandals, solid pattern, casual wear, ₹1476 under ₹1500 budget |
| Men's Daily Wear Comfort Sandals · WE1335 Brown | Walkaroo | ₹579 | Brown faux leather sandals, solid pattern, travel use, ₹579 under ₹1500 budget |
| Men's Daily Wear Comfort Sandals · WGP53209 Brown | Walkaroo | ₹619 | Brown faux leather sandals, solid pattern, travel use, ₹619 under ₹1500 budget |
| The Robuk Brown Men's Leather Driving Loafers Tresmode | Tresmode | ₹1,499 | Brown genuine leather, solid, casual use, ₹1499 under ₹1500 budget, suitable for travel |
| The Rosee Brown Men's Leather Driving Loafers Tresmode | Tresmode | ₹1,499 | Brown genuine leather, solid, casual/semi-formal use, ₹1499 under ₹1500 budget |
| Men's Black Leather Toe Ring Slip On Slippers Online | Fausto | ₹1,499 | Black leather, solid pattern, vacation use, ₹1499 under ₹1500 budget |

### Rail `rail-2` — Shorts & Trousers (12 shown, 958 found)

- q: `men's comfortable shorts and trousers for beach travel beige navy olive white cotton linen`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 958 found/84 usable (2607ms)

| title | brand | price | reason |
|---|---|---:|---|
| Olive Leaves VacayShorts · Linen Shorts For Men | Bombay Trooper | ₹975 | Olive color, linen fabric, solid pattern, vacation/travel use, ₹975 under ₹2000 budget |
| Men's Beige Premium Cotton Bold Stripe Easy-Fit Shorts | Genes Lecoanet Hemant | ₹1,999 | Beige cotton striped shorts, easy fit, vacation use, ₹1999 under ₹2000 budget. |
| Beige Cargo Shorts | Jack & Jones | ₹1,999 | Beige linen-cotton cargo shorts, solid, vacation use, ₹1999 under ₹2000 budget. |
| Explore Versatile Men's White Cotton Shorts | Celio | ₹1,999 | White cotton chino shorts, solid, vacation use, ₹1999 under ₹2000 budget. |
| Lagoon Beige VacayShorts · Linen Shorts For Men | Bombay Trooper | ₹975 | Alpine white linen chino shorts, solid pattern, vacation use, ₹975 under budget. |
| Dark Olive Linen-Look Cotton Trousers | Banana Club | ₹999 | Dark olive cotton blend relaxed trousers, solid, casual, ₹999 under ₹2k budget |
| Men's Cotton Linen Casual Wear Regular Fit Shorts/Cottonworld | Cottonworld | ₹1,890 | Navy color, cotton linen fabric, solid pattern, casual wear, ₹1890 under ₹2000 budget |
| Easy Linen Shorts | Kingdom of White | ₹1,999 | White color, linen-rich fabric, solid pattern, casual/vacation/beach use, ₹1999 under ₹2000 budget |
| Sunset Beige VacayShorts · Linen Shorts For Men | Bombay Trooper | ₹975 | Beige linen chino shorts, solid pattern, vacation use, ₹975 under budget. |
| Tan Brown Cotton Cargo shorts | Banana Club | ₹599 | Tan brown cotton cargo shorts, solid, casual/beach, ₹599 under ₹2000 budget |

### Rail `rail-1` — Casual Shirts (12 shown, 4181 found)

- q: `men's lightweight casual shirts for warm weather travel beach white sky pastel yellow green cotton`
- filter_by: `in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`baby care essentials`,`fragrances`,`soft-sided luggage`,`luggages & trolleys`,`gift cards`,`premium beauty`,`hard-sided luggage`,`accessory gift sets`,`soft toys`,`western wear`,`lipsticks`,`fashion accessories`,`masks & protective gear`,`activity toys`,`cabin trolleys`,`gadgets`,`kids accessories`,`fitness gadgets`,`makeup`,`skincare`,`women`,`smart wearables`,`infant care`,`beauty & personal care`,`action figure / play sets`,`bindis`,`bath & body`,`men`,`learning & development`,`speakers`,`hair ca…`
- rounds: 4181 found/106 usable (2607ms)

| title | brand | price | reason |
|---|---|---:|---|
| Men Seersucker Lightweight White Textured Casual Shirt | Louis Philippe | ₹2,414 | White, 59% cotton, slim fit, casual, ₹2414 under ₹2500 budget |
| Men Seersucker Lightweight Beige Textured Casual Shirt | Louis Philippe | ₹2,207 | Beige, 59% cotton, slim fit, casual, ₹2207 under ₹2500 budget but beige not preferred color |
| Men Seersucker Lightweight Grey Stripe Casual Shirt | Louis Philippe | ₹2,414 | Grey striped, 59% cotton, slim fit, casual, ₹2414 under ₹2500 but grey not preferred color |
| White Tropical Print Resort Collar Shirt | Jack & Jones | ₹1,649 | White, 55% cotton, comfort fit, printed, vacation/beach, ₹1649 under ₹2500 budget |
| XYXX Mens Collared T Shirt · Sky Blue Polo T-Shirts for Men, Combed Cotton, Superior softness, zero irritation, UltraBreathable Casualwear tshirt | XYXX | ₹749 | Sky blue, 100% cotton, solid, casual, breathable, ₹749 under ₹2500 budget |
| XYXX Mens Collared Shirt · Isle Blue, nova Polo T-Shirt Combed Cotton, IntelliEaze Technology, Anti-Bacterial, lightweight, Ultra-Breathable T-Shirts for Men | XYXX | ₹749 | Isle blue, 100% cotton, solid, travel use, lightweight, breathable, ₹749 under ₹2500 |
| Coastal Mirage Cotton Regular Fit Beige Embroidered Shirt | Hamptons | ₹1,999 | Cotton · ₹1,999 |
| Rare Rabbit Articale Men's Jaime Pastel Green Cotton Polyester Fabric Crew Neck Oversized Fit Knit Floral Print T-Shirt | The House Of Rare | ₹1,949 | Green · Printed · ₹1,949 |
| White Tropical Print Vest | Jack & Jones | ₹499 | White cotton printed vest, vacation/beach use, ₹499 under ₹2500 budget |
| Rare Rabbit Articale Men's Hagrid Pastel Green Cotton Polyester Fabric Crew Neck Oversized Fit Branded Graphic Print T-Shirt | The House Of Rare | ₹1,624 | Green · Printed · ₹1,624 |

Rerank: rail-3 scored 18, kept 12, dropped 6 [score 0.30 (fabric not preferred); score 0.25 (pattern colorblock); score 0.15 (formal use; pattern textured); score 0.25 (formal use)] · rail-2 scored 18, kept 14, dropped 4 [score 0.15 (polyester); score 0.20 (polyester); score 0.30 (occasion); score 0.25 (blue; checked)] · rail-1 TIMEOUT (fallback reasons)

Timings: understand 2641ms, plan 4157ms, search 2613ms, curate 5011ms, total 16086ms · tokens 17799/3635 · $0.01094
