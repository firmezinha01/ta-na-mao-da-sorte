import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tá Na Mão da SORTE | Bingo Online & Loteria Digital",
  description: "Sorteios diários às 19h com premiação de R$ 500,00 ou acumulado até domingo. Compre milhares de 0000 a 9999 por apenas R$ 2,00 via Pix!",
  keywords: ["bingo online", "loteria digital", "pix mercado pago", "sorteio diário", "tá na mão da sorte"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
        {children}
      </body>
    </html>
  );
}
