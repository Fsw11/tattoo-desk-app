"use client";

import Link from "next/link";

export default function QuickAction({
  titulo,
  descripcion,
  href,
  icono,
}: {
  titulo: string;
  descripcion: string;
  href: string;
  icono?: string;
}) {

  return (
    <Link
      href={href}
      className="group rounded-xl border bg-background p-5 transition hover:bg-muted hover:shadow-md"
    >

      <div className="flex items-center justify-between">

        <span className="text-2xl">
          {icono ?? "📌"}
        </span>

        <span className="opacity-0 transition group-hover:opacity-100">
          →
        </span>

      </div>


      <h3 className="mt-4 font-semibold">
        {titulo}
      </h3>


      <p className="mt-1 text-sm text-muted-foreground">
        {descripcion}
      </p>

    </Link>
  );

}
