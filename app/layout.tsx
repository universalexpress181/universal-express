import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Universal Express",
  description: "Global Logistics Partner",
  // 👇 ADD THIS TO SHOW YOUR LOGO IN THE BROWSER TAB
  icons: {
    icon: "/icon.png", 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}