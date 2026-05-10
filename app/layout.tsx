import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Notebook RAG — Chat with your documents",
  description:
    "Upload a PDF or text file, and ask questions grounded in its content. Powered by Google Gemini (Kimi K2.6 + nv-embedqa-e5-v5).",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#252525",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
