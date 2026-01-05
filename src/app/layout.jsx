import { Poppins } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import EditorProviderWrapper from "@/components/EditorProviderWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full">
      <body className={`${poppins.className} antialiased flex flex-col h-full`}>
        <EditorProviderWrapper>
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden bg-[#fafafa]">
              {children}
            </main>
          </div>
        </EditorProviderWrapper>
      </body>
    </html>
  );
}
