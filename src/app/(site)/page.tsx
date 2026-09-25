import { redirect } from "next/navigation";

// Temporary until the chat home lands (C1).
export default function Home() {
  redirect("/search");
}
