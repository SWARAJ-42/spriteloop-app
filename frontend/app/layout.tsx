import React from "react"
import type { Metadata, Viewport } from 'next'
import { PaymentListener } from "@/components/payment-listener";
import { Toaster } from "sonner";

import './globals.css'

export const metadata: Metadata = {
  title: 'SpriteLoop - 2D Character to Game Animation',
  description: 'Transform your 2D Character into animated game sprites using AI. Upload any image and watch it come alive with stunning animations.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#1a1f3a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Toaster />
        <PaymentListener />
        {children}
      </body>
    </html>
  )
}
