# Taxonomy review

Generated 2026-09-24T13:37:53.938Z by `npm run build:taxonomy` (gpt-4.1). Values with fewer than 5 docs are dropped (except categories, which are all mapped so the non-fashion deny-list is complete).

Skim the low-confidence and unmapped lists. To fix a family (id, label, department, parent), edit `data/taxonomy.families.json`. To fix a raw-value mapping, add an entry to `OVERRIDES` / `FABRIC_MERGES` / `PARENT_OVERRIDES` in `scripts/build-taxonomy.ts`. Then re-run; cached LLM calls make re-runs cheap.

## Categories by department

### Ethnic wear (`ethnic-wear`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `saree` | Saree |  | 78,955 | women, unisex | silk sarees, printed sarees, designer sarees, handloom sarees, cotton sarees, sarees |
| `kurta-palazzo-set` | Kurta Palazzo Set | kurta-set | 23,135 | women, unisex | kurta-palazzo sets |
| `kurta` | Kurta |  | 20,903 | women, men, unisex | straight kurta, a-line kurta, short kurta, plus size kurtas |
| `lehenga` | Lehenga |  | 13,624 | women, girls, unisex | festive lehenga, bridal lehenga, lehenga choli, party lehenga, lehenga cholis |
| `kurti` | Kurti |  | 6,753 | women, unisex | kurtis |
| `unstitched-suit-set` | Unstitched Suit Set |  | 5,020 | women, unisex | unstitched suit sets, dress materials |
| `anarkali` | Anarkali |  | 4,934 | women, unisex | anarkali |
| `fusion-gown` | Fusion Gown |  | 4,663 | women, unisex | indo-western / fusion gowns, indian & fusion wear |
| `sharara-set` | Sharara & Gharara Set |  | 4,389 | women, unisex | sharara & gharara sets |
| `kurta-pyjama-set` | Kurta Pyjama Set | kurta-set | 4,050 | men, unisex | kurta-pyjama sets |
| `dupatta` | Dupatta |  | 3,978 | women, unisex | dupattas |
| `blouse` | Blouse |  | 3,469 | women, unisex | designer blouses, blouses, saree blouses, padded blouses |
| `kurta-set` | Kurta Set |  | 2,479 | women, men, girls, boys, unisex | kurta sets, kurtas & suits, pathani suits, kurtas & kurta sets, indian & festive wear |
| `stole` | Stole |  | 1,942 | women, unisex | scarves & stoles, stoles |
| `kurta-pyjama-nehru-jacket-set` | Kurta Pyjama Nehru Jacket Set | kurta-set | 1,873 | men, boys, unisex | kurta-pyjama-nehru jacket sets, nehru jacket sets |
| `ethnic-top` | Ethnic Top |  | 1,732 | women, unisex | ethnic tops |
| `palazzo` | Palazzo |  | 1,696 | women, unisex | palazzos |
| `ethnic-skirt` | Ethnic Skirt |  | 1,550 | women, unisex | ethnic skirts |
| `waistcoat` | Waistcoat |  | 1,150 | women, unisex | ethnic waistcoats, waistcoats |
| `sherwani` | Sherwani |  | 1,105 | men, unisex | classic sherwani, indo-western sherwani |
| `nehru-jacket` | Nehru Jacket |  | 1,065 | women, men, unisex | nehru jackets, nehru-style jackets (women) |
| `shawl` | Shawl |  | 736 | women, unisex | shawls |
| `dhoti` | Dhoti |  | 734 | men, unisex | traditional dhoti, ready-to-wear dhoti pants |
| `salwar` | Salwar |  | 627 | women, unisex | salwars, patiala pants |
| `angrakha-kurta` | Angrakha Kurta | kurta | 405 | women, men, unisex | angrakha kurta |
| `kurta-churidar-set` | Kurta Churidar Set | kurta-set | 368 | women, unisex | kurta-churidar sets |
| `bandhgala` | Bandhgala / Jodhpuri Set |  | 324 | men | bandhgala / jodhpuri sets |
| `churidar` | Churidar |  | 157 | women, unisex | churidars |
| `petticoat` | Petticoat & Saree Shapewear |  | 128 | women | petticoats & saree shapewear |

### Tops & shirts (`western-tops`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `shirt` | Shirt |  | 48,903 | women, men, boys, unisex | printed shirts, solid shirts, shirts, solid formal shirts, linen shirts, casual shirts, checked shirts, formal shirts, … +4 |
| `t-shirt` | T-shirt |  | 33,870 | women, men, girls, boys, unisex | round neck t-shirts, graphic/printed t-shirts, oversized t-shirts, graphic t-shirts, t-shirts, full sleeve t-shirts, sleeveless t-shirts, v-neck t-shirts, … +2 |
| `polo-t-shirt` | Polo T-shirt | t-shirt | 17,893 | men, boys, unisex | polo t-shirts |
| `blouse-western` | Blouse (Western) | top | 4,286 | women, unisex | blouses (western) |
| `tunic` | Tunic | top | 3,761 | women, unisex | tunics |
| `top` | Top |  | 2,353 | women, men, girls, unisex | tops, western tops, maternity tops, topwear, plus size tops, kurtis, tunics & tops |
| `crop-top` | Crop Top | top | 416 | women | crop tops |
| `camisole` | Camisole | top | 165 | women | camisoles |

### Bottoms (`western-bottoms`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `jeans` | Jeans |  | 20,004 | women, men, girls, boys, unisex | slim fit jeans, straight jeans, skinny jeans, straight fit jeans, bootcut jeans, relaxed fit jeans, skinny fit jeans, jeans, … +5 |
| `trouser` | Trouser |  | 16,707 | women, men, boys, kids, unisex | trousers, slim fit casual trousers, relaxed fit casual trousers, slim fit formal trousers, casual trousers, regular fit formal trousers, bottomwear, trousers & capris, … +4 |
| `shorts` | Shorts |  | 5,646 | women, men, boys, unisex | shorts, chino shorts, cargo shorts, denim shorts, active shorts, track pants & shorts, shorts & skirts |
| `skirt` | Skirt |  | 2,242 | women, girls, unisex | midi skirts, skirts & shorts, mini skirts, skirts & palazzos |
| `legging` | Legging |  | 2,193 | women, girls, unisex | leggings, tights, tights & leggings, leggings, salwars & churidars, stockings |
| `cargo-pant` | Cargo Pant | trouser | 1,637 | women, men, unisex | cargo pants |
| `jogger` | Jogger |  | 1,367 | men, unisex | joggers |
| `chino` | Chino | trouser | 1,237 | men, unisex | chinos |
| `capri` | Capri |  | 761 | women, unisex | capris |

### Dresses & jumpsuits (`dresses-jumpsuits`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `midi-dress` | Midi Dress | dress | 5,750 | women, unisex | midi dress |
| `maxi-dress` | Maxi Dress | dress | 5,061 | women, girls, unisex | maxi dress, maxi dresses |
| `shift-dress` | Shift Dress | dress | 3,304 | women, unisex | shift dress |
| `dress` | Dress |  | 2,309 | women, girls, kids, unisex | casual frocks, party dresses, dresses, maternity dresses, plus size dresses, party wear |
| `jumpsuit` | Jumpsuit |  | 1,672 | women, girls, unisex | jumpsuits, dungarees & jumpsuits |
| `wrap-dress` | Wrap Dress | dress | 1,608 | women | wrap dress |
| `a-line-dress` | A-line Dress | dress | 1,592 | women | a-line dress |
| `bodycon-dress` | Bodycon Dress | dress | 360 | women | bodycon dress |
| `playsuit` | Playsuit | jumpsuit | 87 | women | playsuits |

### Co-ords & sets (`co-ord-sets`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `co-ord-set` | Co-ord Set |  | 3,780 | women, men, girls, boys, unisex | two-piece co-ord sets, co-ord sets, shirt-shorts co-ord sets, t-shirt-trouser co-ord sets |
| `clothing-set` | Clothing Set | co-ord-set | 3,433 | women, men, girls, boys, kids, unisex | clothing sets, t-shirt-trouser sets, shirt-shorts sets, t-shirts & tops, boys clothing, ethnic wear, shorts sets, girls clothing |
| `matching-set` | Matching Set | co-ord-set | 2,945 | women, unisex | matching sets |

### Jackets, sweaters & outerwear (`outerwear`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `sweatshirt` | Sweatshirt |  | 9,244 | women, men, boys, unisex | sweatshirts, pullover sweatshirts, zipper sweatshirts |
| `sweater` | Sweater |  | 8,811 | women, men, boys, unisex | v-neck sweaters, crew neck sweaters, sweaters, turtleneck sweaters, sweaters & sweatshirts |
| `jacket` | Jacket |  | 5,846 | women, men, girls, boys, unisex | blazer-style jackets, jackets, jacket, sweater & sweatshirts, jackets & sweatshirts, leather jackets, varsity jackets, indian jackets, western jackets & coats, … +1 |
| `bomber-jacket` | Bomber Jacket | jacket | 2,919 | men, unisex | bomber jackets |
| `cardigan` | Cardigan | sweater | 2,865 | women, men, unisex | cardigans |
| `blazer` | Blazer |  | 2,592 | women, men, unisex | blazers, 2-piece suits, 3-piece suits, tuxedos, suits, blazers & waistcoats |
| `hoodie` | Hoodie | sweatshirt | 1,827 | men, unisex | pullover hoodies, zip-up hoodies, hoodies |
| `puffer-jacket` | Puffer/Padded Jacket | jacket | 1,189 | men, unisex | puffer/padded jackets |
| `windcheater` | Windcheater | jacket | 848 | men, unisex | windcheaters, rain jackets |
| `denim-jacket` | Denim Jacket | jacket | 833 | women, men, unisex | denim jackets |
| `shrug` | Shrug |  | 667 | women, unisex | shrugs |
| `overcoat` | Overcoat | jacket | 233 | women, men, unisex | overcoats |
| `trench-coat` | Trench Coat | jacket | 2 |  | trench coats |

### Activewear (`activewear`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `track-pant` | Track Pant |  | 2,348 | men, boys, unisex | track pants, track pants & pyjamas, active track pants, track pants & joggers |
| `active-t-shirt` | Active T-shirt |  | 1,788 | women, men, unisex | regular active t-shirts, sports & active wear, compression t-shirts, active t-shirts |
| `tracksuit` | Tracksuit |  | 863 | men, unisex | tracksuits |
| `sports-accessory` | Sports Accessory |  | 592 | women, unisex | sports accessories, yoga mats, resistance bands, sports equipment |
| `sports-bra` | Sports Bra |  | 298 | women | sports bra |

### Innerwear, sleep & lounge (`innerwear-sleepwear`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `brief` | Brief |  | 2,931 | women, men, boys, unisex | briefs, hipster briefs, bikini briefs, boxer briefs, briefs & trunks, swim briefs |
| `bra` | Bra |  | 1,657 | women | everyday bra, t-shirt bra, maternity innerwear / nursing bras, push-up bra, bra |
| `trunk` | Trunk | brief | 1,518 | men, unisex | trunks |
| `camisole-top` | Camisole Top | nightwear | 1,323 | women, unisex | camisole tops |
| `pyjama-set` | Pyjama Set | nightwear | 1,307 | women, men, unisex | pyjama sets |
| `nightwear` | Nightwear & Loungewear |  | 994 | women, men, girls, boys, kids, unisex | nightwear & loungewear, innerwear & thermals, robes, sleepwear & loungewear, lingerie & sleepwear, maternity nightwear, innerwear & sleepwear, nightsuit sets |
| `vest` | Vest |  | 904 | men, boys, unisex | sleeveless vests, vests, thermal vests |
| `boxer` | Boxer |  | 745 | men, unisex | woven boxers, knit boxer shorts |
| `nightdress` | Nightdress | nightwear | 588 | women, unisex | nightdresses |
| `thermal-top` | Thermal Top |  | 272 | women, men, boys, unisex | thermal tops, thermals, thermal sets |
| `shapewear` | Shapewear |  | 216 | women | full body shapewear, waist shapers, shapewear |
| `bralette` | Bralette | bra | 199 | women | bralette |
| `thermal-bottom` | Thermal Bottom |  | 110 | women, men | thermal bottoms |

### Swim & beachwear (`swimwear`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `bikini` | Bikini | swimsuit | 359 | women | bikini |
| `swimsuit` | Swimsuit |  | 288 | women, unisex | one-piece swimwear, tankini, swimwear |
| `swim-trunk` | Swim Trunk | swimsuit | 246 | men, unisex | swim trunks |

### Baby wear (`baby-wear`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `romper` | Romper & Sleepsuit | baby-wear | 662 | kids, unisex | rompers & sleepsuits |
| `baby-wear` | Baby Wear |  | 482 | kids, unisex | infants, bibs |
| `bodysuit` | Bodysuit | baby-wear | 207 | women, kids, unisex | bodysuits |
| `swaddle` | Swaddle & Sleeping Bag | baby-wear | 104 | kids, unisex | swaddles & sleeping bags |

### Footwear (`footwear`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `sneaker` | Sneaker | casual-shoe | 3,860 | women, men, unisex | low-top sneakers, sneakers (women), high-top sneakers, sneakers |
| `flat-sandal` | Flat Sandal | sandal | 3,010 | women, girls, unisex | flat sandals, flats, mojari flats |
| `running-shoe` | Running Shoe | sports-shoe | 2,962 | women, men, unisex | running shoes |
| `block-heel` | Block Heel | heel | 2,481 | women | block heel sandals, block heels |
| `sandal` | Sandal |  | 1,919 | women, men, girls, boys, unisex | sandals, sandals & floaters |
| `floaters` | Floaters | sandal | 1,571 | men, unisex | floaters |
| `penny-loafer` | Penny Loafer | loafer | 1,283 | men, unisex | penny loafers |
| `loafer` | Loafer | casual-shoe | 1,151 | women, men, unisex | loafers (women), tassel loafers, loafers, horsebit loafers |
| `sports-shoe` | Sports Shoe |  | 957 | women, men, girls, boys, unisex | sports shoes, training shoes |
| `slip-on` | Slip-on | casual-shoe | 711 | women, men, unisex | slip-ons |
| `ballet-flat` | Ballet Flat | casual-shoe | 682 | women | ballet flats |
| `casual-shoe` | Casual Shoe |  | 650 | men, girls, boys, unisex | casual shoes, lace-up casual shoes, footwear, canvas shoes |
| `flip-flop` | Flip Flop | sandal | 635 | men, girls, boys, unisex | flip flops, flipflops |
| `ankle-boot` | Ankle Boot | boot | 585 | women, men, unisex | chelsea boots, ankle boots |
| `derby` | Derby | formal-shoe | 530 | men | derbies |
| `oxford` | Oxford | formal-shoe | 477 | men, unisex | oxfords, brogues |
| `jutti` | Jutti |  | 460 | women, men, unisex | juttis, ethnic footwear |
| `wedge` | Wedge | heel | 456 | women | wedges |
| `boot` | Boot |  | 332 | women, men, girls, boys, kids, unisex | chukka boots, combat boots, booties / first-walker shoes, knee-high boots, boots |
| `heel` | Heel |  | 327 | women | kitten heels, stilettos, heels |
| `kolhapuri` | Kolhapuri |  | 294 | women, men, unisex | kolhapuris |
| `mojari` | Mojari |  | 289 | women, men, unisex | mojaris |
| `formal-shoe` | Formal Shoe |  | 261 | men | formal shoes, monk straps |
| `school-shoe` | School Shoe |  | 167 | girls, boys, unisex | school shoes |

### Bags (`bags`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `handbag` | Handbag | bag | 4,983 | women, unisex | handbags |
| `tote` | Tote | bag | 1,959 | women, unisex | totes |
| `wallet` | Wallet |  | 1,918 | women, men, unisex | wallets, bifold wallets, card holders, trifold wallets |
| `clutch` | Clutch | bag | 1,245 | women, unisex | clutches |
| `travel-backpack` | Travel Backpack | backpack | 690 | men, unisex | travel backpacks, laptop backpacks |
| `sling-bag` | Sling/Crossbody Bag | bag | 648 | men, unisex | sling/crossbody bags |
| `potli-bag` | Potli Bag | bag | 543 | women, unisex | potlis |
| `bag` | Bag |  | 524 | women, girls, boys, kids, unisex | bags & backpacks, bags & luggage, handbags, bags & wallets, bags & briefcases |
| `laptop-bag` | Laptop Bag | bag | 252 | men, unisex | laptop bags, briefcases |
| `backpack` | Backpack | bag | 148 | women, unisex | backpacks, school backpacks |
| `duffel-bag` | Duffel/Gym Bag | bag | 131 | men, unisex | duffel/gym bags |

### Jewellery (`jewellery`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `jewellery` | Jewellery |  | 10,069 | women, girls, boys, kids, unisex | fashion jewellery, jewellery & hair accessory, gold jewellery, fine jewellery, precious stone jewellery, brooches & pins, jewellery, diamond jewellery |
| `pendant-set` | Pendant Set | jewellery | 3,905 | women, unisex | pendant sets |
| `danglers` | Danglers | earring | 3,394 | women, unisex | danglers |
| `jhumka` | Jhumka | earring | 3,294 | women, unisex | jhumkas |
| `ring` | Ring | jewellery | 3,260 | women, men, unisex | fashion rings, rings & wristwear, rings |
| `stud` | Stud | earring | 2,584 | women, unisex | studs |
| `bracelet` | Bracelet | jewellery | 2,549 | women, unisex | bracelets |
| `earring` | Earring | jewellery | 2,071 | women, unisex | earrings |
| `nose-pin` | Nose Pin | jewellery | 1,354 | women, unisex | nose pins & face jewellery, nose pins, nose rings |
| `bangle` | Bangle | jewellery | 1,117 | women, unisex | bangles, kada |
| `hoop` | Hoop | earring | 663 | women, unisex | hoops |
| `choker` | Choker | necklace | 589 | women, unisex | chokers |
| `necklace` | Necklace | jewellery | 553 | women, unisex | long necklaces, necklaces & pendants |
| `cocktail-ring` | Cocktail Ring | ring | 430 | women, unisex | cocktail rings |
| `anklet` | Anklet | jewellery | 411 | women, unisex | anklets |
| `maang-tikka` | Maang Tikka / Bridal Hair Jewellery | jewellery | 80 | women | maang tikka / bridal hair jewellery |

### Accessories (`accessories`)

| id | label | parent | docs | audiences | raw values |
|---|---|---|---:|---|---|
| `belt` | Belt |  | 1,932 | women, men, unisex | belts, leather belts, casual belts, reversible belts, belts, scarves & more |
| `sock` | Sock |  | 1,835 | women, men, boys, unisex | crew socks, ankle socks, socks, formal socks |
| `cap` | Cap |  | 1,480 | men, unisex | baseball caps |
| `wristband` | Wristband |  | 1,132 | women, unisex | wristbands |
| `tie` | Tie |  | 1,058 | men, unisex | ties, bow ties |
| `headband` | Headband |  | 698 | women, unisex | headbands |
| `sunglasses` | Sunglasses |  | 688 | women, men, girls, boys, unisex | round sunglasses, oversized sunglasses, sunglasses, cat-eye sunglasses, sunglasses & frames |
| `pocket-square` | Pocket Square |  | 557 | men, unisex | pocket squares, ties, cufflinks & pocket squares |
| `wayfarer` | Wayfarer | sunglasses | 405 | men, unisex | wayfarers |
| `watch` | Watch |  | 355 | women, men, unisex | casual watches, analog watches, smartwatches, formal watches, metal strap watches, leather strap watches, watches |
| `beanie` | Beanie | cap | 348 | men, unisex | beanies |
| `hat` | Hat | cap | 280 | men, girls, boys, unisex | caps & hats, bucket hats, fedoras |
| `glove` | Glove |  | 210 | women, men, unisex | gym gloves, gloves |
| `scarf` | Scarf |  | 184 | men, unisex | scarves, mufflers, scarves & gloves |
| `muffler` | Muffler | scarf | 175 | men | mufflers |
| `hair-clip` | Hair Clip |  | 170 | women, unisex | hair clips, hair accessories |
| `scrunchie` | Scrunchie |  | 139 | women, unisex | scrunchies |
| `keychain` | Keychain |  | 138 | men, unisex | keychains & small leather goods |
| `aviator` | Aviator | sunglasses | 121 | women, men, unisex | aviators |
| `cufflink` | Cufflink |  | 76 | men, unisex | cufflinks |
| `hairband` | Hairband | headband | 74 | women | hairbands |
| `eyeglasses` | Eyeglasses |  | 40 | unisex | full-rim eyeglasses, eyeglasses, rimless eyeglasses, half-rim eyeglasses |
| `sports-sunglasses` | Sports Sunglasses | sunglasses | 32 | men, unisex | sports sunglasses |

## Colour families

2744 raw values (≥ 5 docs) → 23 families. Unmapped (`none`): 18. Not returned by the model: 0. Medium/low confidence: 1038.

| id | label | docs | raw values | also-in | related |
|---|---|---:|---:|---:|---|
| `black` | Black | 58,110 | 149 | 92 | grey, navy |
| `blue` | Blue | 53,886 | 306 | 107 | navy, light-blue, teal |
| `green` | Green | 45,878 | 289 | 114 | olive, teal |
| `multicolor` | Multicolour | 44,339 | 78 | 41 |  |
| `pink` | Pink | 35,826 | 203 | 103 | pastel-pink, red, purple |
| `white` | White | 28,966 | 167 | 114 | off-white, silver |
| `grey` | Grey | 24,980 | 185 | 79 | black, silver |
| `yellow` | Yellow / mustard | 22,209 | 151 | 69 | gold, orange |
| `red` | Red | 20,928 | 149 | 96 | maroon, pink, orange |
| `navy` | Navy | 20,546 | 51 | 41 | blue, black |
| `beige` | Beige / nude | 20,382 | 129 | 61 | off-white, brown |
| `brown` | Brown | 20,262 | 140 | 47 | beige, orange, maroon |
| `purple` | Purple / lavender | 20,114 | 128 | 38 | maroon, pink, navy |
| `off-white` | Off-white / ivory / cream | 19,255 | 127 | 36 | white, beige |
| `gold` | Gold | 17,216 | 86 | 78 | yellow, beige |
| `maroon` | Maroon / wine | 16,054 | 76 | 32 | red, purple, brown |
| `orange` | Orange / rust | 10,542 | 80 | 43 | peach, red, yellow, brown |
| `silver` | Silver / metallic | 10,519 | 34 | 26 | grey, white |
| `olive` | Olive | 10,005 | 40 | 5 | green, brown |
| `light-blue` | Sky / light blue | 10,004 | 48 | 16 | blue, white |
| `peach` | Peach / coral | 7,780 | 53 | 34 | orange, pastel-pink |
| `teal` | Teal / turquoise | 7,557 | 40 | 20 | green, blue |
| `pastel-pink` | Pastel / blush pink | 3,542 | 17 | 0 | pink, peach |

### Medium/low confidence (top 60 by docs)

| raw value | docs | → primary | also | confidence |
|---|---:|---|---|---|
| cationic olive | 2385 | `olive` |  | medium |
| sea green | 2378 | `green` |  | medium |
| mauve | 1524 | `purple` |  | medium |
| pista green | 1516 | `green` |  | medium |
| teal blue | 1434 | `teal` |  | medium |
| magenta | 1433 | `pink` |  | medium |
| lilac | 1222 | `purple` |  | medium |
| mint green | 906 | `green` |  | medium |
| peacock blue | 828 | `blue` |  | medium |
| sage green | 805 | `green` |  | medium |
| turquoise blue | 772 | `teal` |  | medium |
| lime green | 737 | `green` |  | medium |
| rose pink | 705 | `pink` |  | medium |
| dark pink | 666 | `pink` |  | medium |
| onion pink | 665 | `pink` |  | medium |
| hot pink | 632 | `pink` |  | medium |
| violet | 616 | `purple` |  | medium |
| parrot green | 582 | `green` |  | medium |
| teal green | 560 | `teal` |  | medium |
| dusty pink | 527 | `pastel-pink` |  | medium |
| ecru | 501 | `off-white` |  | medium |
| mint | 498 | `green` |  | medium |
| sandal | 489 | `beige` |  | medium |
| fuchsia | 467 | `pink` |  | medium |
| lemon yellow | 420 | `yellow` |  | medium |
| aqua | 416 | `teal` |  | medium |
| light brown | 405 | `brown` |  | medium |
| emerald green | 400 | `green` |  | medium |
| natural | 395 | `beige` |  | medium |
| cloud | 346 | `off-white` |  | low |
| lime | 337 | `green` |  | medium |
| aqua blue | 327 | `teal` |  | medium |
| sage | 322 | `green` |  | medium |
| mehandi green | 314 | `olive` |  | medium |
| midnight blue | 312 | `navy` |  | medium |
| plum | 305 | `purple` |  | medium |
| ice blue | 301 | `light-blue` |  | medium |
| taupe | 292 | `beige` |  | medium |
| dark purple | 292 | `purple` |  | medium |
| dark indigo | 290 | `blue` |  | medium |
| mid blue | 289 | `blue` |  | medium |
| coffee brown | 288 | `brown` |  | medium |
| magenta pink | 277 | `pink` |  | medium |
| rani | 275 | `pink` |  | medium |
| forest green | 255 | `green` |  | medium |
| sky | 242 | `light-blue` |  | medium |
| pista | 237 | `green` |  | medium |
| grey melange | 233 | `grey` |  | medium |
| nude | 225 | `beige` |  | medium |
| rust orange | 225 | `orange` |  | medium |
| dark wash | 223 | `blue` |  | medium |
| medium blue | 221 | `blue` |  | medium |
| sand | 218 | `beige` |  | medium |
| champagne | 218 | `gold` |  | medium |
| yellow gold | 218 | `gold` |  | medium |
| charcoal grey | 213 | `grey` |  | medium |
| pastel green | 210 | `green` |  | medium |
| dark maroon | 199 | `maroon` |  | medium |
| light olive | 195 | `olive` |  | medium |
| light purple | 194 | `purple` |  | medium |

### Unmapped values with ≥ 20 docs

- dark (79)
- solid (66)
- undyed (37)
- clear (26)
- light tone (21)

## Fabric families

4899 raw values (≥ 5 docs) → 54 families. Unmapped (`none`): 376. Not returned by the model: 0. Medium/low confidence: 948.

| id | label | docs | raw values | also-in | related |
|---|---|---:|---:|---:|---|
| `cotton` | Cotton | 1,23,458 | 544 | 226 | cotton-blend, linen, rayon |
| `cotton-blend` | Cotton Blend | 67,362 | 1352 | 8 | cotton, polyester-blend |
| `silk` | Silk | 49,639 | 124 | 113 | satin, crepe, art-silk |
| `polyester` | Polyester | 31,298 | 106 | 762 | polyester-blend, nylon |
| `silk-blend` | Silk Blend | 24,766 | 183 | 5 | silk, art-silk, cotton-blend |
| `brass` | Brass | 13,207 | 60 | 31 | alloy, metal, gold-plated |
| `rayon` | Rayon / viscose | 13,147 | 105 | 354 | modal, cotton, rayon-blend |
| `polyester-blend` | Polyester Blend | 13,144 | 470 | 2 | polyester, cotton-blend, nylon-blend |
| `georgette` | Georgette | 12,295 | 58 | 36 | chiffon, crepe, organza |
| `pu` | PU | 7,626 | 39 | 22 | faux-leather, leather, eva |
| `silver` | Silver | 7,609 | 39 | 24 | sterling-silver, metal, alloy |
| `faux-leather` | Faux Leather | 7,145 | 53 | 10 | leather, pu |
| `leather` | Leather | 6,920 | 72 | 8 | faux-leather, suede |
| `organza` | Organza | 6,012 | 42 | 95 | chiffon, tissue, georgette |
| `crepe` | Crepe | 5,811 | 72 | 40 | satin, georgette, chiffon |
| `wool-blend` | Wool Blend | 5,810 | 29 | 0 | wool, acrylic-blend, polyester-blend |
| `rayon-blend` | Rayon / viscose blend | 5,722 | 226 | 1 | rayon, polyester-blend |
| `satin` | Satin | 5,601 | 52 | 62 | silk, crepe, art-silk |
| `wool` | Wool | 4,793 | 21 | 40 | wool-blend, acrylic, pashmina |
| `linen` | Linen | 4,573 | 36 | 129 | cotton, linen-blend |
| `tissue` | Tissue | 4,309 | 41 | 25 | organza, silk, chiffon |
| `chiffon` | Chiffon | 3,989 | 32 | 49 | georgette, organza, crepe |
| `net` | Net | 3,746 | 21 | 28 | mesh, lace |
| `alloy` | Alloy | 3,526 | 29 | 14 | brass, metal, silver |
| `denim` | Denim | 3,381 | 23 | 2 | canvas, cotton |
| `art-silk` | Art Silk | 3,093 | 28 | 2 | silk, satin, polyester |
| `linen-blend` | Linen Blend | 2,912 | 97 | 0 | linen, cotton-blend, rayon-blend |
| `nylon-blend` | Nylon Blend | 2,683 | 122 | 7 | nylon, polyester-blend, elastane |
| `sterling-silver` | Sterling Silver | 2,521 | 14 | 1 | silver, metal, alloy |
| `modal-blend` | Modal Blend | 2,163 | 81 | 4 | modal, rayon-blend, cotton-blend |
| `gold-plated` | Gold Plated | 2,133 | 29 | 28 | brass, silver, metal |
| `velvet` | Velvet | 1,977 | 13 | 5 | satin, silk, suede |
| `nylon` | Nylon | 1,747 | 20 | 159 | polyester, nylon-blend |
| `stainless-steel` | Stainless Steel | 1,621 | 11 | 2 | metal, silver, alloy |
| `acrylic` | Acrylic | 1,501 | 6 | 22 | acrylic-blend, wool, polyester |
| `acrylic-blend` | Acrylic Blend | 1,335 | 30 | 2 | acrylic, wool-blend, polyester-blend |
| `mesh` | Mesh | 1,307 | 27 | 9 | net, lace |
| `metal` | Metal | 1,154 | 18 | 17 | brass, alloy, silver |
| `tencel` | Tencel | 1,038 | 31 | 48 | modal, rayon, bamboo |
| `modal` | Modal | 972 | 11 | 41 | rayon, modal-blend |
| `eva` | EVA | 919 | 12 | 12 | pu, rubber |
| `elastane` | Elastane / Lycra / spandex | 653 | 30 | 1306 |  |
| `pvc` | PVC | 613 | 10 | 3 | pu, eva |
| `jacquard` | Jacquard | 590 | 12 | 13 | brocade, cotton |
| `bamboo` | Bamboo | 574 | 24 | 19 | tencel, cotton, linen |
| `pashmina` | Pashmina | 537 | 3 | 4 | wool, wool-blend |
| `canvas` | Canvas | 526 | 14 | 5 | denim, cotton, jute |
| `suede` | Suede | 525 | 11 | 13 | leather, velvet, faux-leather |
| `ceramic` | Ceramic | 443 | 7 | 0 | metal |
| `brocade` | Brocade | 335 | 7 | 2 | jacquard, silk, cotton |
| `modal-silk` | Modal Silk | 301 | 6 | 0 | modal, silk-blend, art-silk |
| `rubber` | Rubber | 214 | 7 | 14 | eva, pu |
| `jute` | Jute | 161 | 6 | 12 | canvas, cotton, linen |
| `lace` | Lace | 145 | 7 | 7 | net, mesh, chiffon |

### Medium/low confidence (top 60 by docs)

| raw value | docs | → primary | also | confidence |
|---|---:|---|---|---|
| synthetic | 3136 | `polyester` |  | medium |
| chanderi | 2188 | `silk-blend` |  | medium |
| chanderi silk | 1865 | `silk-blend` |  | medium |
| chinon | 1452 | `chiffon` |  | medium |
| tissue silk | 1265 | `silk-blend` |  | medium |
| muslin | 1060 | `cotton` |  | medium |
| banarasi silk | 951 | `silk-blend` |  | medium |
| muslin silk | 742 | `silk-blend` |  | medium |
| semi crepe | 706 | `crepe` |  | medium |
| banarasi | 542 | `silk-blend` |  | medium |
| german silver with gilit | 500 | `silver` |  | medium |
| vegan silk | 393 | `art-silk` |  | medium |
| angoora | 360 | `wool` |  | medium |
| cotton flex | 328 | `cotton-blend` |  | medium |
| brass & swarovski | 296 | `brass` |  | medium |
| chanderi cotton | 283 | `cotton-blend` |  | medium |
| satin georgette blend | 279 | `satin` | georgette | medium |
| kanjivaram | 270 | `silk` |  | medium |
| cotton slub | 269 | `cotton` |  | medium |
| poplin | 264 | `cotton` |  | medium |
| muslin cotton | 236 | `cotton` |  | medium |
| moss georgette | 233 | `georgette` |  | medium |
| polyurethane | 232 | `pu` |  | medium |
| cotton cambric | 221 | `cotton` |  | medium |
| cotton twill | 215 | `cotton` |  | medium |
| rawsilk | 213 | `silk` |  | medium |
| vegan leather, handcrafted fabric | 213 | `faux-leather` |  | medium |
| silk slub | 199 | `silk-blend` | cotton | medium |
| mulmul | 194 | `cotton` |  | medium |
| soft raw silk | 194 | `silk` |  | medium |
| twill | 192 | `cotton` |  | medium |
| kala cotton | 188 | `cotton` |  | medium |
| oxford weave | 184 | `cotton` |  | medium |
| kota doria | 183 | `cotton-blend` |  | medium |
| malai cotton | 183 | `cotton` |  | medium |
| stretch cotton | 180 | `cotton-blend` |  | medium |
| corduroy | 174 | `cotton-blend` |  | medium |
| south silk | 174 | `silk` |  | medium |
| cotton knit | 173 | `cotton-blend` |  | medium |
| satin weave | 172 | `satin` | cotton | medium |
| vasansi silk | 172 | `silk` |  | medium |
| 40s cotton | 170 | `cotton` |  | medium |
| slub cotton | 169 | `cotton` |  | medium |
| german silver | 158 | `alloy` |  | medium |
| silver with pearls | 155 | `silver` |  | medium |
| silver with semi-precious stones | 152 | `silver` |  | medium |
| modal satin | 149 | `modal-blend` | satin | medium |
| 100% man made fiber | 149 | `polyester` |  | medium |
| cotton mul | 147 | `cotton` |  | medium |
| flyknit | 142 | `mesh` |  | medium |
| 3% silver alloy | 139 | `alloy` | silver | medium |
| synthethic | 136 | `polyester` |  | medium |
| satin crepe | 136 | `satin` | crepe | medium |
| terry | 135 | `cotton-blend` |  | medium |
| nylon stretch | 133 | `nylon-blend` |  | medium |
| banana crepe | 130 | `crepe` |  | medium |
| microfibre | 129 | `polyester` |  | medium |
| chinon/silk blend | 122 | `silk-blend` | chiffon | medium |
| cotton chanderi | 119 | `cotton-blend` |  | medium |
| pique | 113 | `cotton` |  | medium |

### Unmapped values with ≥ 20 docs

- knitted (2765)
- twill weave (878)
- blended (797)
- pique knit (718)
- textile (590)
- plain weave (490)
- pique fabric (462)
- woven (370)
- fabric (333)
- softy (329)
- tpr (295)
- rib (259)
- polycarbonate (258)
- knit (209)
- soft, breathable fabric (169)
- drymill (136)
- rhodium plated (130)
- chanderi fabric (126)
- mul chanderi (125)
- thread (113)
- soft and breathable fabric (105)
- soft, breathable fabric blend (93)
- imported fabric (88)
- pure muslin (85)
- santoon (81)
- quartz powder, glass powder, katira (79)
- recycled materials (77)
- poplin weave (76)
- clay (72)
- suiting fabric (72)
- quartz powder, glass powder, katira, saji (71)
- canton knit (67)
- yarn blend (64)
- organic and natural fabrics, recycled materials (64)
- patola (62)
- canton (61)
- neoprene (61)
- glass (60)
- plastic (60)
- vegan material (60)

## Pattern families

1391 raw values (≥ 5 docs) → 39 families. Unmapped (`none`): 43. Not returned by the model: 0. Medium/low confidence: 497.

| id | label | docs | raw values | also-in | related |
|---|---|---:|---:|---:|---|
| `solid` | Solid | 1,65,663 | 17 | 7 |  |
| `printed` | Printed | 84,233 | 118 | 232 | graphic, floral, abstract |
| `embroidered` | Embroidered | 65,798 | 22 | 4 | chikankari |
| `embellished` | Embellished | 60,599 | 49 | 6 | sequins, mirror-work |
| `textured` | Textured | 38,890 | 145 | 32 | quilted |
| `striped` | Striped | 21,746 | 35 | 13 |  |
| `floral` | Floral | 18,995 | 132 | 62 | printed, paisley |
| `checked` | Checked | 14,987 | 15 | 4 |  |
| `colorblock` | Colorblock | 12,630 | 17 | 3 | solid |
| `graphic` | Graphic | 7,814 | 48 | 9 | printed, typography |
| `zari-brocade` | Zari/Brocade | 7,784 | 43 | 11 |  |
| `block-print` | Block Print | 3,885 | 58 | 19 | printed |
| `abstract` | Abstract | 3,718 | 50 | 22 | geometric, printed |
| `digital-print` | Digital Print | 3,400 | 37 | 4 | printed |
| `geometric` | Geometric | 3,173 | 81 | 23 | abstract, checked |
| `washed` | Washed/Distressed | 2,991 | 31 | 3 | textured |
| `logo` | Logo/Monogram | 2,972 | 23 | 5 | graphic |
| `ikat` | Ikat | 2,198 | 22 | 2 | patola |
| `motif` | Motif | 2,185 | 126 | 48 | ethnic-motifs, floral |
| `bandhani` | Bandhani | 1,835 | 17 | 3 | leheriya, tie-dye |
| `paisley` | Paisley | 1,218 | 18 | 7 | floral, ethnic-motifs |
| `typography` | Typography/Slogan | 1,210 | 16 | 0 | graphic |
| `tie-dye` | Tie & Dye | 1,169 | 35 | 2 | bandhani, leheriya |
| `ethnic-motifs` | Ethnic Motifs | 1,136 | 30 | 6 | motif, paisley |
| `jaal` | Jaal | 1,026 | 17 | 8 | floral, ethnic-motifs |
| `polka-dot` | Polka Dot | 973 | 19 | 6 | printed |
| `applique` | Applique | 773 | 25 | 2 | embellished |
| `lace` | Lace | 609 | 16 | 3 | embroidered |
| `animal-print` | Animal Print | 600 | 21 | 5 | printed |
| `patola` | Patola | 511 | 10 | 1 | ikat |
| `quilted` | Quilted | 484 | 8 | 1 | textured |
| `kalamkari` | Kalamkari | 332 | 5 | 1 | printed, madhubani |
| `batik` | Batik | 251 | 6 | 0 | printed |
| `leheriya` | Leheriya | 241 | 9 | 0 | bandhani, tie-dye |
| `madhubani` | Madhubani | 208 | 11 | 0 | kalamkari |
| `sequins` | Sequins | 194 | 6 | 8 | embellished |
| `ajrak` | Ajrakh | 157 | 4 | 1 | block-print |
| `chikankari` | Chikankari | 84 | 3 | 0 | embroidered |
| `mirror-work` | Mirror Work | 35 | 3 | 2 | embellished |

### Medium/low confidence (top 60 by docs)

| raw value | docs | → primary | also | confidence |
|---|---:|---|---|---|
| self design | 5270 | `textured` |  | medium |
| jacquard | 2241 | `textured` |  | medium |
| woven design | 2047 | `textured` |  | medium |
| self | 1944 | `textured` |  | medium |
| woven | 737 | `textured` |  | medium |
| self-design | 601 | `textured` |  | medium |
| pleated | 478 | `textured` |  | medium |
| banarasi | 416 | `zari-brocade` |  | medium |
| dobby | 406 | `textured` |  | medium |
| yoke design | 400 | `textured` |  | medium |
| ombre | 390 | `abstract` |  | medium |
| melange | 377 | `textured` |  | medium |
| jaquard | 365 | `textured` |  | medium |
| cartoon | 319 | `graphic` |  | medium |
| cutwork | 312 | `embellished` |  | medium |
| solid contrast | 292 | `solid` | colorblock | medium |
| paithani | 283 | `zari-brocade` |  | medium |
| thread butta | 279 | `embroidered` |  | medium |
| embossed | 272 | `textured` |  | medium |
| buti | 259 | `motif` |  | medium |
| rib | 251 | `textured` |  | medium |
| patterned | 244 | `printed` |  | medium |
| jari border | 241 | `zari-brocade` |  | medium |
| ribbed | 220 | `textured` |  | medium |
| zariwork | 207 | `zari-brocade` |  | medium |
| foil print | 205 | `embellished` | printed | medium |
| shibori | 180 | `tie-dye` |  | medium |
| structured | 172 | `textured` |  | medium |
| knitted | 157 | `textured` |  | medium |
| graphic block print | 156 | `graphic` | block-print | medium |
| turkoman jewellery style | 146 | `embellished` |  | medium |
| pintuck | 144 | `textured` |  | medium |
| tropical print | 140 | `graphic` | printed | medium |
| dyed | 134 | `textured` |  | medium |
| camo print | 133 | `graphic` | printed | medium |
| booti | 131 | `motif` |  | medium |
| filigree | 124 | `embellished` |  | medium |
| kundan | 123 | `embellished` |  | medium |
| peacock motif | 122 | `motif` |  | medium |
| tribal | 119 | `ethnic-motifs` |  | medium |
| block print border | 117 | `block-print` |  | medium |
| jamdani | 115 | `textured` |  | medium |
| puff print | 113 | `embellished` | printed | medium |
| panelled | 112 | `textured` |  | medium |
| yarn dyed | 109 | `textured` |  | medium |
| jaal weave | 108 | `jaal` | textured | medium |
| heathered | 103 | `textured` |  | medium |
| all over | 93 | `printed` |  | medium |
| mandala | 92 | `geometric` |  | medium |
| argyle | 90 | `checked` |  | medium |
| weaving | 90 | `textured` |  | medium |
| wave | 84 | `abstract` |  | medium |
| nature-inspired prints | 84 | `printed` |  | medium |
| punched | 80 | `textured` |  | medium |
| stylish patterns | 76 | `abstract` |  | medium |
| cut and sew | 71 | `colorblock` |  | medium |
| braided | 67 | `textured` |  | medium |
| criss-cross | 67 | `geometric` |  | medium |
| print and solids | 63 | `solid` | printed | medium |
| botanical | 61 | `floral` |  | medium |

### Unmapped values with ≥ 20 docs

- clear/transparent (38)
- brogue (29)
- oxidized (28)

## Fit families

364 raw values (≥ 5 docs) → 24 families. Unmapped (`none`): 69. Not returned by the model: 0. Medium/low confidence: 132.

| id | label | docs | raw values | also-in | related |
|---|---|---:|---:|---:|---|
| `regular` | Regular | 3,46,302 | 26 | 3 | straight |
| `flowy` | Flowy | 52,157 | 3 | 2 | relaxed, a-line |
| `slim` | Slim | 48,766 | 34 | 0 | skinny, tailored |
| `straight` | Straight | 19,092 | 4 | 11 | regular, slim |
| `relaxed` | Relaxed | 19,057 | 26 | 10 | loose, regular |
| `tailored` | Tailored | 14,948 | 13 | 1 | slim, regular |
| `oversized` | Oversized | 7,655 | 5 | 0 | loose, boxy |
| `a-line` | A-Line | 6,053 | 4 | 0 | flared, fit-and-flare |
| `fitted` | Fitted | 5,024 | 58 | 6 | bodycon, slim |
| `loose` | Loose | 4,723 | 29 | 1 | relaxed, oversized |
| `comfort` | Comfort | 3,966 | 28 | 11 | relaxed, regular |
| `skinny` | Skinny | 3,282 | 12 | 0 | slim, bodycon |
| `boxy` | Boxy | 2,892 | 6 | 2 | oversized, relaxed |
| `flared` | Flared | 2,551 | 8 | 2 | a-line, wide-leg |
| `fit-and-flare` | Fit and Flare | 2,036 | 6 | 1 | a-line, flared |
| `tapered` | Tapered | 1,605 | 4 | 6 | slim, straight |
| `bodycon` | Bodycon | 1,562 | 5 | 0 | fitted, skinny |
| `wide-leg` | Wide Leg | 1,422 | 3 | 2 | flared, relaxed |
| `bootcut` | Bootcut | 1,125 | 4 | 1 | flared, straight |
| `cropped` | Cropped | 489 | 7 | 5 | skinny, slim |
| `jogger` | Jogger | 407 | 6 | 0 | tapered, relaxed |
| `mom-fit` | Mom Fit | 141 | 1 | 0 | relaxed, tapered |
| `athletic` | Athletic | 34 | 2 | 0 | slim, fitted |
| `boyfriend` | Boyfriend | 5 | 1 | 0 | relaxed, loose |

### Medium/low confidence (top 60 by docs)

| raw value | docs | → primary | also | confidence |
|---|---:|---|---|---|
| slim comfort | 377 | `slim` | comfort | medium |
| anarkali | 356 | `a-line` |  | medium |
| muscle fit | 349 | `fitted` |  | medium |
| smart fit | 337 | `tailored` |  | medium |
| narrow | 261 | `slim` |  | medium |
| contemporary fit | 255 | `regular` |  | medium |
| easy fit | 230 | `comfort` |  | medium |
| cargo | 216 | `jogger` |  | medium |
| anti fit | 213 | `loose` |  | medium |
| modern fit | 206 | `regular` |  | medium |
| snug fit | 205 | `fitted` |  | medium |
| india fit | 194 | `regular` |  | medium |
| argon-cropped fit | 178 | `cropped` |  | medium |
| compression fit | 164 | `fitted` |  | medium |
| ultra narrow fit | 157 | `slim` |  | medium |
| structured | 150 | `tailored` |  | medium |
| crop fit | 136 | `cropped` |  | medium |
| perfect fit | 116 | `fitted` |  | medium |
| relax fit | 114 | `relaxed` |  | medium |
| perfect fit design | 97 | `fitted` |  | medium |
| semi fit | 78 | `fitted` |  | medium |
| slim straight | 74 | `slim` | straight | medium |
| snug | 72 | `fitted` |  | medium |
| made to measure | 63 | `tailored` |  | medium |
| loose fitted | 58 | `loose` | fitted | medium |
| resort fit | 53 | `comfort` |  | medium |
| sheath | 50 | `bodycon` |  | medium |
| cargo fit | 50 | `jogger` |  | medium |
| compression | 50 | `fitted` |  | medium |
| comfort cropped fit | 49 | `comfort` | cropped | medium |
| wide | 48 | `wide-leg` |  | medium |
| casual fit | 47 | `comfort` |  | medium |
| body-fitted | 47 | `fitted` |  | medium |
| gentle fit | 42 | `comfort` |  | medium |
| fit & flared | 40 | `fit-and-flare` | flared | medium |
| structured fit | 37 | `tailored` |  | medium |
| helium-skinny fit | 37 | `skinny` |  | medium |
| breezy and comfortable | 37 | `comfort` |  | medium |
| normal | 36 | `regular` |  | medium |
| freedom fit | 36 | `comfort` |  | medium |
| radon-anti fit | 36 | `loose` |  | medium |
| neon-slim fit | 35 | `slim` |  | medium |
| body adaptive fit | 34 | `fitted` |  | medium |
| grip fit | 33 | `fitted` |  | medium |
| oganesson-jogger fit | 33 | `jogger` |  | medium |
| flattering fit | 32 | `fitted` |  | medium |
| comfortable | 31 | `comfort` |  | medium |
| cosmo classic | 31 | `regular` |  | low |
| close fit through thigh and hip, skinny leg | 31 | `skinny` |  | medium |
| slightly oversized | 30 | `oversized` |  | medium |
| relaxed straight fit | 30 | `relaxed` | straight | medium |
| skinny leg | 27 | `skinny` |  | medium |
| hugged fit | 27 | `fitted` |  | medium |
| carrot fit | 27 | `tapered` |  | medium |
| control fit | 27 | `fitted` |  | medium |
| narrow fit | 25 | `slim` |  | medium |
| ultra-fit | 23 | `fitted` |  | medium |
| true to size fit | 23 | `regular` |  | medium |
| slim at arms and shoulders , relaxed from torso and waist | 23 | `slim` | relaxed | medium |
| mini flared | 22 | `flared` |  | medium |

### Unmapped values with ≥ 20 docs

- true to size (1256)
- smart (1141)
- moderno fit (355)
- flattering (222)
- anti (205)
- brooklyn (103)
- freesize (50)
- flattering silhouette (46)
- urban (44)
- low-rise (32)
- full brief (32)
- kansas (27)
- fs (26)
- bikini (26)
- hourglass (24)
- full coverage (23)
- hipster (22)
- fuller bust (21)
- high leg (20)

## Use cases

1059 raw values (≥ 5 docs) → 22 families. Unmapped (`none`): 169. Not returned by the model: 0. Medium/low confidence: 342.

| id | label | docs | raw values | also-in | related |
|---|---|---:|---:|---:|---|
| `casual` | Casual | 2,91,711 | 89 | 40 | daily-wear, lounge |
| `daily-wear` | Daily Wear | 2,66,418 | 24 | 16 | casual, lounge |
| `festive` | Festive | 2,52,752 | 86 | 52 | wedding, party |
| `party` | Party/Club | 1,97,146 | 45 | 44 | evening, festive |
| `wedding` | Wedding | 1,43,543 | 81 | 15 | festive, party |
| `office` | Office/Work | 74,574 | 55 | 7 | formal, daily-wear |
| `sports-active` | Sports/Active | 39,057 | 32 | 6 | gym |
| `formal` | Formal | 34,139 | 70 | 31 | office, evening |
| `lounge` | Lounge/Leisure | 30,209 | 30 | 1 | sleep, casual |
| `winter` | Winter/Cold Weather | 24,621 | 8 | 1 | travel |
| `travel` | Travel/Vacation | 21,246 | 30 | 19 | beach, casual |
| `evening` | Evening/Soirée | 16,305 | 76 | 25 | party, formal |
| `streetwear` | Streetwear | 6,110 | 15 | 0 | casual |
| `ethnic-traditional` | Ethnic/Traditional | 4,980 | 55 | 21 | festive, wedding |
| `gym` | Gym/Workout | 4,747 | 14 | 0 | sports-active, yoga |
| `beach` | Beach/Pool/Resort | 4,287 | 18 | 1 | travel |
| `family-gathering` | Family Gathering | 3,311 | 68 | 29 | festive, wedding |
| `date` | Date/Brunch | 2,553 | 51 | 15 | evening, party |
| `gift-giving` | Gift/Gifting | 1,401 | 18 | 0 | festive |
| `school` | School/College | 1,049 | 10 | 0 | daily-wear |
| `yoga` | Yoga/Pilates | 954 | 4 | 1 | gym, sports-active |
| `sleep` | Sleep/Nightwear | 734 | 11 | 0 | lounge |

### Medium/low confidence (top 60 by docs)

| raw value | docs | → primary | also | confidence |
|---|---:|---|---|---|
| special occasions | 4001 | `formal` | party, festive, wedding | medium |
| celebration | 981 | `festive` | party | medium |
| celebrations | 683 | `festive` | party | medium |
| weekend | 678 | `casual` |  | medium |
| cultural events | 653 | `ethnic-traditional` | festive | medium |
| layering | 605 | `winter` |  | medium |
| brunch | 580 | `date` | casual | medium |
| occasion wear | 564 | `formal` | party, festive, wedding | medium |
| playtime | 518 | `sports-active` |  | medium |
| cultural celebrations | 502 | `festive` | ethnic-traditional | medium |
| resort | 394 | `beach` | travel | medium |
| outdoor | 384 | `sports-active` | travel | medium |
| cultural gatherings | 348 | `family-gathering` | festive | medium |
| daytime celebrations | 295 | `festive` | family-gathering | medium |
| resort wear | 286 | `beach` | travel | medium |
| special celebration | 274 | `festive` | party | medium |
| brunches | 233 | `date` | casual | medium |
| playdates | 232 | `family-gathering` | casual | medium |
| special occasion | 211 | `formal` | party, festive, wedding | medium |
| family celebrations | 205 | `family-gathering` | festive | medium |
| smart-casual outings | 201 | `casual` | formal | medium |
| dining | 200 | `date` | evening | medium |
| outdoor adventures | 181 | `travel` | sports-active | medium |
| gatherings | 158 | `family-gathering` |  | medium |
| ceremonial | 156 | `festive` | ethnic-traditional | medium |
| outdoor activities | 150 | `sports-active` | travel | medium |
| errands | 144 | `casual` |  | medium |
| special events | 139 | `formal` | party, festive, wedding | medium |
| religious | 133 | `ethnic-traditional` | festive | medium |
| evening outings | 128 | `evening` | casual | medium |
| social gatherings | 126 | `family-gathering` |  | medium |
| religious rituals | 123 | `ethnic-traditional` | festive | medium |
| outings | 122 | `casual` |  | medium |
| festive gatherings | 117 | `festive` | family-gathering | medium |
| smart-casual occasions | 110 | `casual` | formal | medium |
| daytime festivities | 109 | `festive` | family-gathering | medium |
| intimate celebrations | 106 | `festive` | family-gathering | medium |
| semi festive | 104 | `festive` |  | medium |
| daytime events | 103 | `festive` | family-gathering | medium |
| comfort | 95 | `lounge` |  | medium |
| weekend outings | 95 | `casual` | travel | medium |
| evening gatherings | 95 | `evening` | family-gathering | medium |
| intimate wear | 92 | `lounge` |  | medium |
| daytime | 90 | `daily-wear` |  | medium |
| anniversary | 90 | `date` | family-gathering | medium |
| fusion | 89 | `ethnic-traditional` |  | medium |
| spiritual | 85 | `ethnic-traditional` |  | medium |
| meetups | 82 | `casual` |  | medium |
| celebratory | 79 | `festive` |  | medium |
| special event | 76 | `festive` |  | medium |
| laid-back occasions | 75 | `lounge` |  | medium |
| traditional gatherings | 75 | `family-gathering` | ethnic-traditional | medium |
| play | 74 | `sports-active` |  | medium |
| occasional wear | 68 | `festive` |  | medium |
| casual gatherings | 66 | `casual` | family-gathering | medium |
| dressy | 61 | `formal` |  | medium |
| outdoor activity | 58 | `sports-active` |  | medium |
| occasion | 55 | `festive` |  | medium |
| birthdays | 55 | `family-gathering` |  | medium |
| daily commute | 55 | `daily-wear` | travel | medium |

### Unmapped values with ≥ 20 docs

- home decor (2770)
- summer (1725)
- fashion (1157)
- decorative (284)
- shopping (207)
- storage (169)
- potty training (133)
- statement (121)
- lifestyle (112)
- events (100)
- home décor (92)
- pregnancy (81)
- serving (76)
- summer wear (53)
- personal care (53)
- creative endeavors (53)
- decorative | home decor (52)
- feeding (51)
- hygiene (49)
- utility (44)
- decor (42)
- protection (40)
- office decor (40)
- anti-pollution (40)
- nursing (37)
- creative (37)
- organizing (37)
- fashion statement (37)
- decoration (35)
- self-care (31)
- occasions (29)
- occasion-wear (28)
- recovery (27)
- collectible (26)
- swaddling (24)
- drooling (23)
- maternity (23)
- social (22)
- kitchen (21)
- planning (21)

## Brands

301 brands. Renamed for display: 23. Merged: 0.

- Jackjones → **Jack & Jones**
- Houseofdesigners → **House of Designers**
- Louisphilippe → **Louis Philippe**
- Myraymond → **MyRaymond**
- Chhabra555 → **Chhabra 555**
- Ornatejewels → **Ornate Jewels**
- Ministerwhite → **Minister White**
- Anitadongre → **Anita Dongre**
- Bombayshirts → **Bombay Shirt Company**
- Ka-sha → **Ka-Sha**
- Cavaathleisure → **Cava Athleisure**
- Yogue-activewear → **Yogue Activewear**
- Pashaindia → **Pasha India**
- KAPRAÃHA → **Kapraaha**
- Studiomedium → **Studio Medium**
- Spiritanimal → **Spirit Animal**
- Neemans → **Neeman's**
- Columbiasportswear → **Columbia Sportswear**
- Nitinbalchauhan → **Nitin Bal Chauhan**
- Steellifestyle → **Steel Lifestyle**
- COSSET CLOTHING → **Cosset Clothing**
- Lildivafashion → **Lil Diva Fashion**
- Beaumondeaccessories → **Beaumonde Accessories**

## Excluded category values (non-fashion deny-list)

other, baby care essentials, fragrances, soft-sided luggage, luggages & trolleys, gift cards, premium beauty, hard-sided luggage, accessory gift sets, soft toys, western wear, lipsticks, fashion accessories, masks & protective gear, activity toys, cabin trolleys, gadgets, kids accessories, fitness gadgets, makeup, skincare, women, smart wearables, infant care, beauty & personal care, action figure / play sets, bindis, bath & body, men, learning & development, speakers, hair care, kids, headphones
