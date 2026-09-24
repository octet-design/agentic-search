import type { Metadata } from "next";
import { ImageResultsView } from "@/components/results/ImageResultsView";
import { ResultsView } from "@/components/results/ResultsView";
import { APP_NAME } from "@/lib/config";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${decodeURIComponent(slug)} · ${APP_NAME}` };
}

export default async function EditPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const query = decodeURIComponent(slug);
  const debug = one(sp.debug) === "1";
  const surprise = one(sp.surprise);
  if (one(sp.img) === "1") return <ImageResultsView key={query} text={query} debug={debug} />;
  return (
    <ResultsView
      key={`${query}|${one(sp.s) ?? ""}`}
      query={query}
      initialState={one(sp.s)}
      debug={debug}
      banner={surprise ? `Surprise: ${surprise}` : undefined}
    />
  );
}
