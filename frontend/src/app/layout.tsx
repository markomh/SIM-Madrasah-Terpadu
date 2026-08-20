import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth-context";
import { DataVersionProvider, TahunAjaranProvider } from "@/components/app-providers";
import { ToastProvider } from "@/components/toast-context";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIM Madrasah Terpadu",
  description: "Sistem Informasi Manajemen Madrasah Terpadu — Tahap 1 UI/UX (mock)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper font-sans text-ink">
        <AuthProvider>
          <DataVersionProvider>
            <TahunAjaranProvider>
              <ToastProvider>{children}</ToastProvider>
            </TahunAjaranProvider>
          </DataVersionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
