import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const estudioId = session.user.estudioId;

  const [clientes, citas, ingresos, pendientes] = await Promise.all([
    prisma.cliente.count({
      where: {
        estudioId,
      },
    }),

    prisma.cita.count({
      where: {
        estudioId,
        estado: "PENDIENTE",
      },
    }),

    prisma.pago.aggregate({
      where: {
        estudioId,
      },
      _sum: {
        monto: true,
      },
    }),

    prisma.cita.count({
      where: {
        estudioId,
        estado: "PENDIENTE",
      },
    }),
  ]);

  const totalIngresos = Number(ingresos._sum.monto ?? 0);

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
            valor={clientes.toString()}
          />

          <DashboardCard
            titulo="Citas pendientes"
            valor={citas.toString()}
          />

          <DashboardCard
            titulo="Ingresos"
            valor={`$${totalIngresos.toFixed(2)}`}
          />

          <DashboardCard
            titulo="Pendientes"
            valor={pendientes.toString()}
          />
        </section>

        <section className="rounded-xl border bg-background p-6">
          <h2 className="text-lg font-semibold">
            Resumen del estudio
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Estos indicadores están conectados directamente con
            PostgreSQL mediante Prisma.
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
