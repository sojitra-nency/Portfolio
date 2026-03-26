import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Neural Nexus | Nency Sojitra — Portfolio",
  description:
    "An immersive, interactive neural network portfolio. Explore skills, projects, and experience as a living system of intelligence.",
  keywords: [
    "portfolio",
    "neural network",
    "interactive",
    "3D",
    "Nency Sojitra",
    "AI",
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
  ],
  authors: [{ name: "Nency Sojitra" }],
  openGraph: {
    title: "Neural Nexus | Nency Sojitra",
    description:
      "Explore a living neural network portfolio — skills, projects, and experience visualized as an interactive brain.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neural Nexus | Nency Sojitra",
    description:
      "An immersive 3D neural network portfolio experience.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${syne.variable} font-body antialiased bg-background text-foreground`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-surface focus:px-4 focus:py-2 focus:rounded-lg focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
