import { z } from "zod";

/** Subset of the UCP catalog shapes we render. Unknown keys are stripped; almost everything is optional. */

const Money = z.object({ amount: z.number(), currency: z.string() });
export type Money = z.infer<typeof Money>;

const Media = z.object({ type: z.string().optional(), url: z.string(), alt_text: z.string().nullish() });
const Rating = z.object({ value: z.number(), scale_max: z.number().default(5), count: z.number().nullish() });
const Description = z.object({ plain: z.string().nullish() }).nullish();

const Seller = z.object({
  id: z.string().nullish(),
  name: z.string().nullish(),
  url: z.string().nullish(),
  links: z.array(z.object({ type: z.string(), url: z.string() })).default([]),
});

const Variant = z.object({
  id: z.string(),
  title: z.string().nullish(),
  description: Description,
  url: z.string().nullish(),
  checkout_url: z.string().nullish(),
  price: Money.nullish(),
  availability: z.object({ available: z.boolean().nullish() }).nullish(),
  options: z.array(z.object({ name: z.string(), label: z.string() })).default([]),
  media: z.array(Media).default([]),
  seller: Seller.nullish(),
});
export type Variant = z.infer<typeof Variant>;

const OptionValue = z.object({ label: z.string(), available: z.boolean().nullish(), exists: z.boolean().nullish() });

export const Product = z.object({
  id: z.string(),
  title: z.string(),
  description: Description,
  rating: Rating.nullish(),
  metadata: z
    .object({
      unique_selling_points: z.array(z.string()).default([]),
      top_features: z.array(z.string()).default([]),
      tech_specs: z.array(z.string()).default([]),
    })
    .nullish(),
  media: z.array(Media).default([]),
  options: z.array(z.object({ name: z.string(), values: z.array(OptionValue) })).default([]),
  variants: z.array(Variant).default([]),
  price_range: z.object({ min: Money, max: Money }).nullish(),
  selected: z.array(z.object({ name: z.string(), label: z.string() })).default([]),
});
export type Product = z.infer<typeof Product>;

export const SearchResult = z.object({
  products: z.array(Product).default([]),
  pagination: z.object({ cursor: z.string().nullish(), has_next_page: z.boolean().default(false), total_count: z.number().nullish() }).nullish(),
});

export const ProductResult = z.object({ product: Product.nullish() });

/** Slim grid card, safe to send to the client. */
export type ShopifyCard = {
  /** Short id: the last segment of `gid://shopify/p/<id>`. */
  id: string;
  title: string;
  image: string | null;
  price: Money | null;
  /** True when variants span a price range ("from ₹…"). */
  priceFrom: boolean;
  seller: string | null;
  /** gid://shopify/Shop/… ("more from this brand"). */
  sellerId: string | null;
  rating: { value: number; count: number | null } | null;
  /** Up to 3 merchant-supplied highlights. */
  features: string[];
  /** Store product page and one-click checkout for the default variant. */
  url: string | null;
  checkoutUrl: string | null;
  /** Default variant's options ("Slim Fit / White / S"); null when the product has no choices. */
  defaultOptions: string | null;
  /** Chat reference number, set by the Genuine Finds agent. */
  ref?: number;
};

export type ShopifyPage = { products: ShopifyCard[]; cursor: string | null; hasNext: boolean; total: number | null };
