"use client";

export default function DashboardCard({
  titulo,
  valor,
  icono,
  descripcion,
}: {
  titulo: string;
  valor: string;
  icono?: string;
  descripcion?: string;
}) {

  return (
    <div className="rounded-xl border bg-background p-5 transition hover:shadow-md">

      <div className="flex items-center justify-between">

        <p className="text-sm text-muted-foreground">
          {titulo}
        </p>

        {icono && (
          <span className="text-xl">
            {icono}
          </span>
        )}

      </div>


      <p className="mt-3 text-2xl font-bold">
        {valor}
      </p>


      {descripcion && (
        <p className="mt-1 text-xs text-muted-foreground">
          {descripcion}
        </p>
      )}

    </div>
  );
}
