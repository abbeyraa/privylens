import { Inter } from "next/font/google";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import Header from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "PrivyLens — Automation Plan Builder",
  description:
    "Rancang dan jalankan automation plan untuk pengisian form berbasis browser menggunakan Playwright.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${inter.className} antialiased`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
