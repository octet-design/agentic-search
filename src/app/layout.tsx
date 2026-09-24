import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { CompareTray } from "@/components/compare/CompareTray";
import { Header } from "@/components/Header";
import { APP_NAME } from "@/lib/config";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_NAME} · your AI stylist`,
  description: "Describe what you want in your own words: English, Hinglish or Hindi. Get picks that respect every detail.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <CompareTray />
      </body>
    </html>
  );
}
