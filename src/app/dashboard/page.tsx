import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm text-muted-foreground">
            Bienvenido
          </p>

          <h1 className="text-3xl font-bold">
            {session.user.name}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {session.user.email}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            titulo="Clientes"
            valor="0"
          />

          <DashboardCard
            titulo="Citas"
            valor="0"
          />

          <DashboardCard
            titulo="Ingresos"
            valor="$0"
          />

          <DashboardCard
            titulo="Pendientes"
            valor="$0"
          />
        </section>

        <section className="rounded-xl border bg-background p-6">
          <h2 className="text-lg font-semibold">
            Resumen del estudio
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Aquí aparecerá la actividad reciente de tu estudio.
          </p>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-6">
      <p className="text-sm text-muted-foreground">
        {titulo}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {valor}
      </p>
    </div>
  );
}
