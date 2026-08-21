import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const estudioId = session.user.estudioId;

  const [
    clientes,
    citasPendientes,
    ingresos,
    gastos,
  ] = await Promise.all([
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

    prisma.gasto.aggregate({
      where: {
        estudioId,
      },
      _sum: {
        monto: true,
      },
    }),
  ]);

  const totalIngresos = Number(
    ingresos._sum.monto ?? 0
  );

  const totalGastos = Number(
    gastos._sum.monto ?? 0
  );

  const utilidad = totalIngresos - totalGastos;

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

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <DashboardCard
            titulo="Clientes"
            valor={clientes.toString()}
          />

          <DashboardCard
            titulo="Citas pendientes"
            valor={citasPendientes.toString()}
          />

          <DashboardCard
            titulo="Ingresos"
            valor={formatoMoneda(totalIngresos)}
          />

          <DashboardCard
            titulo="Gastos"
            valor={formatoMoneda(totalGastos)}
          />

          <DashboardCard
            titulo="Utilidad"
            valor={formatoMoneda(utilidad)}
          />
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Accesos rápidos
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <MenuCard
              titulo="Clientes"
              descripcion="Gestionar clientes"
              href="/clientes"
            />

            <MenuCard
              titulo="Citas"
              descripcion="Agenda del estudio"
              href="/citas"
            />

            <MenuCard
              titulo="Tatuajes"
              descripcion="Diseños y trabajos"
              href="/tatuajes"
            />

            <MenuCard
              titulo="Pagos"
              descripcion="Ingresos registrados"
              href="/pagos"
            />

            <MenuCard
              titulo="Gastos"
              descripcion="Control financiero"
              href="/gastos"
            />
          </div>
        </section>

        <section className="rounded-xl border bg-background p-6">
          <h2 className="text-lg font-semibold">
            Resumen financiero
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Ingresos menos gastos del estudio.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Resumen
              titulo="Ingresos"
              valor={formatoMoneda(totalIngresos)}
            />

            <Resumen
              titulo="Gastos"
              valor={formatoMoneda(totalGastos)}
            />

            <Resumen
              titulo="Utilidad"
              valor={formatoMoneda(utilidad)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function formatoMoneda(
  cantidad: number
) {
  return cantidad.toLocaleString(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }
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

function MenuCard({
  titulo,
  descripcion,
  href,
}: {
  titulo: string;
  descripcion: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-background p-5 transition hover:bg-muted"
    >
      <h3 className="font-semibold">
        {titulo}
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        {descripcion}
      </p>
    </Link>
  );
}

function Resumen({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        {titulo}
      </p>

      <p className="mt-2 text-xl font-semibold">
        {valor}
      </p>
    </div>
  );
}
