import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from '@vercel/speed-insights/next';

// Load Calluna font
const calluna = localFont({
  src: [
    {
      path: "../../public/fonts/Calluna-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Calluna-Black.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-calluna",
  display: "swap",
});

// Load Helvetica font
const helvetica = localFont({
  src: "../../public/fonts/Helvetica.ttf",
  variable: "--font-helvetica",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Groundwork Books",
  description: "Nonprofit bookstore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${calluna.variable} ${helvetica.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            <SpeedInsights />
            <Analytics />

            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
