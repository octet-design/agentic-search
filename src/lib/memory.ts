/**
 * Scout's memory, organised by person: "You" plus everyone the shopper buys for (Mom, Dad, Riya…). Pure and
 * client/server-safe: the browser stores it (store/memory.ts), the chat engine reads only the facts of the person
 * a request is for, so one person's preferences never shape another's results.
 */

export const MEMORY_KINDS = ["size", "avoid", "likes", "budget", "other"] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];
export type MemoryFact = { id: string; kind: MemoryKind; text: string; at: number };
export type MemoryPerson = { key: string; label: string; facts: MemoryFact[] };
/** A fact the agent heard in chat, before it's filed (`replaces` = the old fact it updates, if any). */
export type MemoryItem = { person: string; kind: MemoryKind; text: string; replaces?: string };
/** What was just saved, so the chat can offer "Undo". */
export type SavedFact = { key: string; label: string; id: string; text: string };

export const MAX_PEOPLE = 12;
export const MAX_FACTS = 15;
export const SELF = "self";

/** Relations in English and Hinglish → one key and label each. Order matters: "grandmother" before "mother". */
const RELATIONS: [RegExp, string, string][] = [
  [/^(me|myself|i|self|user|you|mine|mujhe|mere|meri|mera)$/, SELF, "You"],
  [/^(grand ?ma|grand ?mother|nani|dadi|naani|daadi)$/, "grandma", "Grandma"],
  [/^(grand ?pa|grand ?father|nana|dada|naana|daada)$/, "grandpa", "Grandpa"],
  [/^(mother[- ]in[- ]law|saas)$/, "mother-in-law", "Mother-in-law"],
  [/^(father[- ]in[- ]law|sasur)$/, "father-in-law", "Father-in-law"],
  [/^(mom|mum|mother|mummy|mommy|maa|ma|ammi|amma|mumma)$/, "mom", "Mom"],
  [/^(dad|daddy|papa|pappa|father|pitaji|abbu|appa)$/, "dad", "Dad"],
  [/^(wife|biwi|patni)$/, "wife", "Wife"],
  [/^(husband|pati|hubby)$/, "husband", "Husband"],
  [/^(son|beta)$/, "son", "Son"],
  [/^(daughter|beti)$/, "daughter", "Daughter"],
  [/^(sister|sis|didi|behen|bahen)$/, "sister", "Sister"],
  [/^(brother|bro|bhai|bhaiya)$/, "brother", "Brother"],
  [/^(girlfriend|gf)$/, "girlfriend", "Girlfriend"],
  [/^(boyfriend|bf)$/, "boyfriend", "Boyfriend"],
];

const clean = (s: string) =>
  s
    .toLowerCase()
    .replace(/^(my|our|the)\s+/, "")
    .replace(/[^a-z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** "Mummy" → mom/Mom; "my sister Riya" → sister/Sister; "Riya" → name:riya/Riya. */
export function personKey(raw: string): { key: string; label: string } {
  const s = clean(raw);
  if (!s) return { key: SELF, label: "You" };
  for (const [re, key, label] of RELATIONS) if (re.test(s)) return { key, label };
  // A relation word inside a longer phrase ("my younger sister", "riya my sister").
  for (const word of s.split(" ")) for (const [re, key, label] of RELATIONS) if (key !== SELF && re.test(word)) return { key, label };
  return { key: `name:${s.replace(/\s+/g, "-")}`, label: title(s) };
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9₹]+/g, " ").trim();

const VERB = /^(wears?|is|are|has|have|likes?|loves?|prefers?|avoids?|doesn'?t|does not|don'?t|never|always|usually|spends?|buys?|needs?|hates?|can'?t|allergic|size)\b/i;
/** Terse notes read as sentences in the Memory panel: "L" → "Wears size L", "cotton sarees" → "Likes cotton sarees". */
export function tidyFact(kind: MemoryKind, text: string): string {
  const t = text.trim().replace(/\.$/, "");
  if (!t || VERB.test(t)) return t.charAt(0).toUpperCase() + t.slice(1);
  const lead = { size: /^\d|^(xs|s|m|l|xl|xxl|xxxl|\d+\w*)\b/i.test(t) ? "Wears size" : "Wears", avoid: "Avoids", likes: "Likes", budget: "Usually spends", other: "" }[kind];
  return lead ? `${lead} ${t}` : t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Files facts under their person: skips exact repeats, drops the fact an item says it replaces (an updated size
 * or budget), creates people as needed, and keeps within the caps (oldest facts and people go first).
 */
export function mergeFacts(
  people: MemoryPerson[],
  items: MemoryItem[],
  now: number,
  newId: () => string,
): { people: MemoryPerson[]; saved: SavedFact[] } {
  let next = people.map((p) => ({ ...p, facts: [...p.facts] }));
  const saved: SavedFact[] = [];
  for (const item of items) {
    const text = tidyFact(item.kind, item.text);
    if (!text || !MEMORY_KINDS.includes(item.kind)) continue;
    const { key, label } = personKey(item.person);
    let person = next.find((p) => p.key === key);
    if (!person) {
      person = { key, label, facts: [] };
      next = [...next, person];
    }
    if (item.replaces?.trim()) person.facts = person.facts.filter((f) => norm(f.text) !== norm(item.replaces!));
    if (person.facts.some((f) => norm(f.text) === norm(text))) continue;
    const fact: MemoryFact = { id: newId(), kind: item.kind, text, at: now };
    person.facts = [...person.facts, fact].slice(-MAX_FACTS);
    saved.push({ key, label: person.label, id: fact.id, text });
  }
  next = next.filter((p) => p.facts.length);
  if (next.length > MAX_PEOPLE) {
    const lastTouched = (p: MemoryPerson) => Math.max(0, ...p.facts.map((f) => f.at));
    const keep = new Set([...next].sort((a, b) => lastTouched(b) - lastTouched(a)).slice(0, MAX_PEOPLE).map((p) => p.key));
    next = next.filter((p) => keep.has(p.key));
  }
  return { people: next, saved };
}

/** Removes the facts that were just saved (the chat's "Undo"); people left with no facts go too. */
export function undoFacts(people: MemoryPerson[], saved: SavedFact[]): MemoryPerson[] {
  const ids = new Set(saved.map((s) => s.id));
  return people.map((p) => ({ ...p, facts: p.facts.filter((f) => !ids.has(f.id)) })).filter((p) => p.facts.length);
}

/**
 * Who a message is for, when it names someone: "for my mom", "papa ke liye", "gift for Riya" (a known name).
 * Possessives are occasions, not wearers ("my friend's wedding"). Returns a person key, or null.
 */
export function recipientKey(message: string, people: Pick<MemoryPerson, "key" | "label">[] = []): string | null {
  const m = message.toLowerCase();
  const phrases = [
    ...m.matchAll(/\bfor\s+(?:my|our|a|the)\s+((?:[\w-]+\s+){0,3}[\w-]+)(?!['’]s)\b/g),
    ...m.matchAll(/\b((?:my\s+)?[\w-]+)\s+(?:ke|ki|ka)\s+liye\b/g),
    // Talking about someone: "my mom wears size L", "my sister loves pastels" (not "my mom's birthday").
    ...m.matchAll(/\bmy\s+((?:[\w-]+\s+){0,1}[\w-]+)\b(?!['’]s)/g),
  ].map((x) => x[1]);
  for (const phrase of phrases) {
    for (const word of phrase.split(/\s+/)) {
      // "for my mom's birthday": the word right before a possessive is an occasion's owner, not the wearer.
      if (new RegExp(`\\b${word}['’]s\\b`).test(m)) continue;
      const { key } = personKey(word);
      if (key !== SELF && !key.startsWith("name:")) return key;
    }
  }
  // A named person Scout already knows ("a kurta for Riya", "Riya's birthday gift").
  for (const p of people) {
    if (!p.key.startsWith("name:")) continue;
    const name = p.label.toLowerCase();
    if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(m)) return p.key;
  }
  return null;
}
