import { Geist, Geist_Mono, Inter } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const metadataBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  title: "RepoLens",
  description:
    "Upload a GitHub Javascript/TypeScript repository ZIP file to visualize its structure and dependencies.",
  applicationName: "RepoLens",
  keywords: [
    "RepoLens",
    "GitHub",
    "repository",
    "visualization",
    "dependency graph",
    "code map",
  ],
  authors: [
    { name: "Elliot", url: "https://github.com/BuiltByElly" },
    { name: "Triumph", url: "https://github.com/WebsTechne" },
  ],
  metadataBase: new URL(metadataBaseUrl),
  openGraph: {
    title: "RepoLens",
    description:
      "Upload a GitHub Javascript/TypeScript repository ZIP file to visualize its structure and dependencies.",
    type: "website",
    url: "/",
    siteName: "RepoLens",
  },
  twitter: {
    card: "summary",
    title: "RepoLens",
    description:
      "Upload a GitHub Javascript/TypeScript repository ZIP file to visualize its structure and dependencies.",
  },
}

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
