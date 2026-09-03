import Image from "next/image";

export default function StudioHeader({
  nombre,
  logoUrl,
  nombreMostrar,
  plan,
  usuario,
  email,
}: {
  nombre: string;
  logoUrl?: string | null;
  nombreMostrar?: string | null;
  plan?: string | null;
  usuario?: string | null;
  email?: string | null;
}) {

  const nombreEstudio =
    nombreMostrar?.trim() || nombre;

  return (
    <header className="rounded-2xl border bg-background p-6 shadow-sm">

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-4">

          {logoUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-xl border bg-muted">
              <Image
                src={logoUrl}
                alt={`Logo de ${nombreEstudio}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-muted text-2xl">
              🎨
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">
              Panel administrativo
            </p>

            <h1 className="text-2xl font-bold">
              {nombreEstudio}
            </h1>

            {usuario && (
              <p className="mt-1 text-sm text-muted-foreground">
                {usuario}
                {email ? ` · ${email}` : ""}
              </p>
            )}
          </div>

        </div>


        {plan && (
          <div className="rounded-full border px-4 py-2 text-sm font-medium">
            Plan {plan}
          </div>
        )}

      </div>

    </header>
  );
}
