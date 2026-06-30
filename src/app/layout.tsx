import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Homebound Remit — Send Money Home, Pay the Actual Bill",
  description:
    "Pay your family's rent, school fees, or utility bills directly — in seconds, for cents. Purpose-bound diaspora remittances on Stellar.",
  keywords: ["remittance", "stellar", "USDC", "bill pay", "diaspora", "soroban", "blockchain"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans bg-stellar-dark text-white antialiased min-h-screen`}
      >
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
