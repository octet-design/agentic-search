"use client";

import { useMemo } from "react";
import { deriveTaste, seedIds, tastePayload } from "@/lib/taste";
import { useSession } from "@/store/session";

export function useTastePayload() {
  const profile = useSession((s) => s.profile);
  const signals = useSession((s) => s.signals);
  return useMemo(() => tastePayload({ profile, signals }), [profile, signals]);
}

export function useTaste() {
  const profile = useSession((s) => s.profile);
  const signals = useSession((s) => s.signals);
  return useMemo(() => deriveTaste({ profile, signals }), [profile, signals]);
}

/** Product ids that best represent the user's taste (saves + clicks + views…), for "For you". */
export function useTasteSeeds(n = 10) {
  const profile = useSession((s) => s.profile);
  const signals = useSession((s) => s.signals);
  return useMemo(() => seedIds({ profile, signals }, n), [profile, signals, n]);
}
