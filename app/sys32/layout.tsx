import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sistema - El de la Suerte",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
