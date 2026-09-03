import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ThemeProvider from "@/components/providers/ThemeProvider";
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
  description:
    "Gestión profesional para estudios de tatuajes",
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await auth();

  const configuracion = session?.user?.estudioId
    ? await prisma.configuracionEstudio.findUnique({
        where: {
          estudioId: session.user.estudioId,
        },
      })
    : null;

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >

      <body className="min-h-full">

        <ThemeProvider configuracion={configuracion}>

          <div className="flex min-h-screen">

            <Sidebar
              configuracion={configuracion}
              usuario={session?.user ?? null}
            />

            <div className="flex flex-1 flex-col">

              <Header configuracion={configuracion} />

              <main className="flex-1">

                {children}

              </main>

            </div>

          </div>

        </ThemeProvider>

      </body>

    </html>
  );
}
