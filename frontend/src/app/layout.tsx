import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Morphorama - AI Photo Evolution',
  description: 'Upload photos and watch them evolve through AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
