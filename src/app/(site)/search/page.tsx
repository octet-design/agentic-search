import { HomeClient } from "@/components/home/HomeClient";
import { getExamples } from "@/lib/examples";

export const dynamic = "force-dynamic";

export default async function Home() {
  const examples = await getExamples();
  return <HomeClient examples={examples} />;
}
