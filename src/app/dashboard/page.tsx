import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardCard from "@/components/dashboard/DashboardCard";
import QuickAction from "@/components/dashboard/QuickAction";
import AppointmentCard from "@/components/dashboard/AppointmentCard";
import StudioHeader from "@/components/dashboard/StudioHeader";

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
    configuracion,
    suscripcion,
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

    prisma.configuracionEstudio.findUnique({
      where: {
        estudioId,
      },
    }),

    prisma.suscripcion.findUnique({
      where: {
        estudioId,
      },
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


        <StudioHeader
          nombre={session.user.name ?? "Tattoo Desk"}
          logoUrl={configuracion?.logoUrl}
          nombreMostrar={configuracion?.nombreMostrar}
          plan={suscripcion?.plan}
          usuario={session.user.name}
          email={session.user.email}
        />



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

            <QuickAction
              titulo="Clientes"
              descripcion="Gestionar clientes"
              href="/clientes"
              icono="👤"
            />

            <QuickAction
              titulo="Citas"
              descripcion="Agenda del estudio"
              href="/citas"
              icono="📅"
            />

            <QuickAction
              titulo="Tatuajes"
              descripcion="Trabajos activos"
              href="/tatuajes"
              icono="🎨"
            />

            <QuickAction
              titulo="Inventario"
              descripcion="Materiales y stock"
              href="/inventario"
              icono="📦"
            />

            <QuickAction
              titulo="Movimientos"
              descripcion="Entradas y salidas"
              href="/inventario/movimientos"
              icono="↕️"
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
                <AppointmentCard
                  key={cita.id}
                  cita={cita}
                />
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
