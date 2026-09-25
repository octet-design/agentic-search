"use client";

import { RotateCcw, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useTaste } from "@/hooks/useTaste";
import { cn } from "@/lib/format";
import { useSession, type AudienceKey } from "@/store/session";

const AUD: AudienceKey[] = ["women", "men", "girls", "boys"];

/** Learned preferences as removable chips + editable profile + reset (brief §8.4). */
export function TastePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const taste = useTaste();
  const profile = useSession((s) => s.profile);
  const signals = useSession((s) => s.signals);
  const memory = useSession((s) => s.memory);
  const { setProfile, removeSignal, reset, setOnboardingOpen, removeMemory } = useSession.getState();

  const toggleAud = (a: AudienceKey) =>
    setProfile({ audiences: profile.audiences.includes(a) ? profile.audiences.filter((x) => x !== a) : [...profile.audiences, a] });

  // Removing a learned value drops the signals that taught it.
  const forget = (field: LearnedField, value: string) => {
    for (const p of [...signals.liked, ...signals.clicked, ...(signals.interactions ?? []).map((i) => i.p)]) {
      if ((p[field] ?? "").toLowerCase() === value) {
        removeSignal("liked", p.id);
        removeSignal("clicked", p.id);
        removeSignal("interactions", p.id);
      }
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Your taste">
      <Section title="Shopping for">
        <div className="flex flex-wrap gap-1.5">
          {AUD.map((a) => (
            <button key={a} onClick={() => toggleAud(a)} className={cn("rounded-full border px-3 py-1 text-sm capitalize", profile.audiences.includes(a) ? "border-ink bg-ink text-canvas" : "border-line")}>
              {a}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Drape remembers">
        {memory.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing yet. Tell Drape things like “I wear size M” or “I avoid polyester” in a chat.</p>
        ) : (
          <ul className="space-y-1.5">
            {memory.map((m) => (
              <li key={m.id} className="flex items-start gap-2 text-sm">
                <span className="flex-1">{m.text}</span>
                <button onClick={() => removeMemory(m.id)} aria-label={`Forget: ${m.text}`} className="rounded-full p-0.5 text-ink-faint hover:bg-sand hover:text-ink">
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Learned from your likes, views and clicks">
        {taste.empty ? (
          <p className="text-sm text-ink-soft">Nothing yet. Tap ♥ on things you like and I&apos;ll learn.</p>
        ) : (
          <>
            <Learned label="Brands" field="brand" values={taste.brands} onForget={forget} />
            <Learned label="Colours" field="color" values={taste.colors} onForget={forget} />
            <Learned label="Categories" field="category" values={taste.categories} onForget={forget} />
            <Learned label="Fabrics" field="fabric" values={taste.fabrics} onForget={forget} />
            {taste.priceBand && (
              <p className="text-sm text-ink-soft">
                Usual price: ₹{taste.priceBand.min.toLocaleString("en-IN")}–₹{taste.priceBand.max.toLocaleString("en-IN")}
              </p>
            )}
          </>
        )}
      </Section>

      <Section title="Avoiding">
        <AvoidEditor
          label="Colours"
          values={profile.avoidColors}
          learned={taste.avoidColors.filter((c) => !profile.avoidColors.includes(c))}
          onChange={(v) => setProfile({ avoidColors: v })}
        />
        <AvoidEditor
          label="Fabrics"
          values={profile.avoidFabrics}
          learned={taste.avoidFabrics.filter((c) => !profile.avoidFabrics.includes(c))}
          onChange={(v) => setProfile({ avoidFabrics: v })}
        />
        {taste.avoidBrands.length > 0 && <p className="text-sm text-ink-soft">Brands you passed on twice: {taste.avoidBrands.join(", ")}</p>}
      </Section>

      <Section title="Sizes & budget">
        <div className="grid grid-cols-3 gap-2 text-sm">
          {(["top", "bottom", "footwear"] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1 capitalize text-ink-soft">
              {k}
              <input
                value={profile.sizes[k] ?? ""}
                onChange={(e) => setProfile({ sizes: { ...profile.sizes, [k]: e.target.value || undefined } })}
                className="rounded-md border border-line px-2 py-1 text-ink"
                placeholder={k === "footwear" ? "UK 7" : k === "bottom" ? "32" : "M"}
              />
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={profile.onlyMySize} onChange={(e) => setProfile({ onlyMySize: e.target.checked })} /> Only show my size
        </label>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-ink-soft">Budget per item</span>
          <input
            inputMode="numeric"
            value={profile.budget?.min ?? ""}
            onChange={(e) => setProfile({ budget: { ...profile.budget, min: Number(e.target.value) || undefined } })}
            placeholder="Min ₹"
            className="w-20 rounded-md border border-line px-2 py-1"
          />
          –
          <input
            inputMode="numeric"
            value={profile.budget?.max ?? ""}
            onChange={(e) => setProfile({ budget: { ...profile.budget, max: Number(e.target.value) || undefined } })}
            placeholder="Max ₹"
            className="w-20 rounded-md border border-line px-2 py-1"
          />
        </div>
      </Section>

      <div className="flex gap-2 p-5">
        <button onClick={() => setOnboardingOpen(true)} className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink">
          Redo quick setup
        </button>
        <button onClick={() => reset()} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-warn/40 px-4 py-2 text-sm text-warn hover:bg-warn/5">
          <RotateCcw size={14} /> Reset session
        </button>
      </div>
    </Drawer>
  );
}

type LearnedField = "brand" | "color" | "category" | "fabric";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-4">
      <h3 className="mb-2 text-xs uppercase tracking-wide text-ink-faint">{title}</h3>
      {children}
    </section>
  );
}

function Learned({ label, field, values, onForget }: { label: string; field: LearnedField; values: string[]; onForget: (field: LearnedField, value: string) => void }) {
  if (!values.length) return null;
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5 text-sm">
      <span className="w-20 text-ink-soft">{label}</span>
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-sand py-0.5 pl-2.5 pr-1">
          {v}
          <button onClick={() => onForget(field, v)} aria-label={`Forget ${v}`} className="rounded-full p-0.5 hover:bg-line">
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

function AvoidEditor({ label, values, learned, onChange }: { label: string; values: string[]; learned: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5 text-sm">
      <span className="w-20 text-ink-soft">{label}</span>
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full border border-warn/30 py-0.5 pl-2.5 pr-1 text-warn">
          ✕ {v}
          <button onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Stop avoiding ${v}`} className="rounded-full p-0.5 hover:bg-warn/10">
            <X size={12} />
          </button>
        </span>
      ))}
      {learned.map((v) => (
        <span key={v} className="rounded-full border border-dashed border-line px-2.5 py-0.5 text-ink-soft" title="Learned from “Not for me”">
          ~ {v}
        </span>
      ))}
      <input
        placeholder="+ add"
        className="w-20 rounded-full border border-dashed border-line px-2 py-0.5"
        onKeyDown={(e) => {
          const v = (e.target as HTMLInputElement).value.trim().toLowerCase();
          if (e.key === "Enter" && v) {
            onChange([...new Set([...values, v])]);
            (e.target as HTMLInputElement).value = "";
          }
        }}
      />
    </div>
  );
}
