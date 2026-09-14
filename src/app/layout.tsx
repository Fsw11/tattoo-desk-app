import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import AppShell from "@/components/layout/AppShell";
import ThemeProvider from "@/components/providers/ThemeProvider";
import PwaRegister from "@/components/providers/PwaRegister";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tattoo Desk",
  description: "Gestión profesional para estudios de tatuajes",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tattoo Desk",
  },
};

export const viewport: Viewport = {
  themeColor: "#D4AF37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  const configuracion = session?.user?.estudioId
    ? await prisma.configuracionEstudio.findUnique({
        where: { estudioId: session.user.estudioId },
      })
    : null;

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">
        <ThemeProvider configuracion={configuracion}>
          <AuthSessionProvider session={session}>
            <PwaRegister />
            <AppShell
              configuracion={configuracion}
              usuario={session?.user ?? null}
            >
              {children}
            </AppShell>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
