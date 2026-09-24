import { CompareView } from "@/components/compare/CompareView";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ComparePage({ searchParams }: Props) {
  const sp = await searchParams;
  return <CompareView idsParam={one(sp.ids)} query={one(sp.q)} criterion={one(sp.c)} />;
}
