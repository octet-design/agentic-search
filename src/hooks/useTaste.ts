"use client";

import { useMemo } from "react";
import { deriveTaste, tastePayload } from "@/lib/taste";
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
