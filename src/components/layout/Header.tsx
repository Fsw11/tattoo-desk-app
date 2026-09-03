"use client";


type Configuracion = {
  logoUrl: string | null;
  nombreMostrar: string | null;
};

export default function Header({
  configuracion,
}: {
  configuracion: Configuracion | null;
}) {

  const nombre =
    configuracion?.nombreMostrar ||
    "Tattoo Desk";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">

      <div className="flex items-center gap-3">

        {configuracion?.logoUrl && (
          <img
            src={configuracion.logoUrl}
            alt="Logo del estudio"
            className="h-10 w-10 rounded-lg object-cover"
          />
        )}

        <div>
          <h2 className="font-semibold">
            {nombre}
          </h2>

          <p className="text-xs text-muted-foreground">
            Panel de administración
          </p>
        </div>

      </div>


      <div className="flex items-center gap-3">

        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
        >
          ⚙️
        </button>


        <div className="rounded-full border px-3 py-1 text-sm">
          Usuario
        </div>

      </div>

    </header>
  );
}
