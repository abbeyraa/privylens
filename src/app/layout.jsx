import { Poppins } from "next/font/google";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import Header from "@/components/Header";
import EditorProviderWrapper from "@/components/EditorProviderWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "PrivyLens — Automation Plan Builder",
  description:
    "Rancang dan jalankan automation plan untuk pengisian form berbasis browser menggunakan Playwright.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full">
      <body className={`${poppins.className} antialiased flex flex-col h-full`}>
        <EditorProviderWrapper>
          <Header />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </EditorProviderWrapper>
      </body>
    </html>
  );
}
