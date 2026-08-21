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
    tatuajesActivos,
    ingresos,
    gastos,
    stockBajo,
    proximasCitas,
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


    prisma.tatuaje.count({
      where: {
        estudioId,
        estado: {
          in: [
            "PENDIENTE",
            "EN_PROCESO",
          ],
        },
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


    prisma.inventario.count({
      where: {
        estudioId,
        activo: true,
        cantidad: {
          lte: prisma.inventario.fields.minimo,
        },
      },
    }),


    prisma.cita.findMany({
      where: {
        estudioId,
        fecha: {
          gte: new Date(),
        },
      },
      include: {
        cliente: true,
      },
      orderBy: {
        fecha: "asc",
      },
      take: 5,
    }),

  ]);


  const totalIngresos =
    Number(
      ingresos._sum.monto ?? 0
    );


  const totalGastos =
    Number(
      gastos._sum.monto ?? 0
    );


  const utilidad =
    totalIngresos - totalGastos;



  return (
    <main className="min-h-screen bg-muted/40 p-6">

      <div className="mx-auto max-w-7xl space-y-8">


        <header>

          <p className="text-sm text-muted-foreground">
            Panel administrativo
          </p>


          <h1 className="text-3xl font-bold">
            {session.user.name}
          </h1>


          <p className="text-sm text-muted-foreground">
            {session.user.email}
          </p>

        </header>



        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

          <DashboardCard
            titulo="Clientes"
            valor={clientes.toString()}
          />


          <DashboardCard
            titulo="Citas pendientes"
            valor={citasPendientes.toString()}
          />


          <DashboardCard
            titulo="Tatuajes activos"
            valor={tatuajesActivos.toString()}
          />


          <DashboardCard
            titulo="Stock bajo"
            valor={stockBajo.toString()}
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
              descripcion="Trabajos activos"
              href="/tatuajes"
            />

            <MenuCard
              titulo="Inventario"
              descripcion="Materiales y stock"
              href="/inventario"
            />

            <MenuCard
              titulo="Movimientos"
              descripcion="Entradas y salidas"
              href="/inventario/movimientos"
            />

          </div>
        </section>



        <section className="rounded-xl border bg-background p-6">

          <h2 className="mb-4 text-xl font-semibold">
            Próximas citas
          </h2>


          {proximasCitas.length === 0 ? (

            <p className="text-sm text-muted-foreground">
              No hay próximas citas.
            </p>

          ) : (

            <div className="space-y-3">

              {proximasCitas.map((cita) => (

                <div
                  key={cita.id}
                  className="rounded-lg border p-4"
                >

                  <p className="font-semibold">
                    {cita.cliente.nombre}
                  </p>


                  <p className="text-sm text-muted-foreground">

                    {new Date(
                      cita.fecha
                    ).toLocaleString(
                      "es-MX"
                    )}

                  </p>


                  <p className="text-sm">
                    Estado: {cita.estado}
                  </p>

                </div>

              ))}

            </div>

          )}

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

    <div className="rounded-xl border bg-background p-5">

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
