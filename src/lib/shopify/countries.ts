/** Countries the Shopify tabs let you shop in. Shopify has no "supported countries" endpoint, so this is our list. */
export const COUNTRIES = [
  { code: "IN", name: "India", currency: "INR", flag: "🇮🇳", locale: "en-IN" },
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸", locale: "en-US" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧", locale: "en-GB" },
  { code: "AE", name: "UAE", currency: "AED", flag: "🇦🇪", locale: "en-AE" },
  { code: "CA", name: "Canada", currency: "CAD", flag: "🇨🇦", locale: "en-CA" },
  { code: "AU", name: "Australia", currency: "AUD", flag: "🇦🇺", locale: "en-AU" },
  { code: "SG", name: "Singapore", currency: "SGD", flag: "🇸🇬", locale: "en-SG" },
  { code: "DE", name: "Germany", currency: "EUR", flag: "🇩🇪", locale: "en-DE" },
  { code: "FR", name: "France", currency: "EUR", flag: "🇫🇷", locale: "en-FR" },
  { code: "JP", name: "Japan", currency: "JPY", flag: "🇯🇵", locale: "en-JP" },
] as const;

export type Country = (typeof COUNTRIES)[number];
export type CountryCode = Country["code"];

export const isCountryCode = (s: unknown): s is CountryCode => COUNTRIES.some((c) => c.code === s);

/** Unknown codes fall back to India. */
export const getCountry = (code: string | null | undefined): Country => COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
