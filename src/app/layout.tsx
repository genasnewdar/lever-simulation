import type { Metadata } from "next";
import { Hanken_Grotesk, Literata } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import Providers from "./providers";

const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const serif = Literata({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lever — IELTS Mock Exam",
  description: "A calm, accurate rehearsal of the real IELTS experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="bg-paper text-ink antialiased">
        <Providers>
          <main className="min-h-screen">{children}</main>
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar
            closeOnClick
            toastClassName="!font-sans !rounded-xl !bg-paper-2 !text-ink !border !border-rule"
          />
        </Providers>
      </body>
    </html>
  );
}
