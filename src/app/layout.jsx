import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full">
      <body className={`${jetBrainsMono.className} antialiased min-h-screen bg-[#fafafa]`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
