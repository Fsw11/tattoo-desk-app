import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import DashboardCard from "@/components/dashboard/DashboardCard";
import QuickAction from "@/components/dashboard/QuickAction";
import AppointmentCard from "@/components/dashboard/AppointmentCard";
import StudioHeader from "@/components/dashboard/StudioHeader";
import DashboardChart from "@/components/dashboard/DashboardChart";


export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const estudioId = session.user.estudioId;


  // ========================================
  // FECHAS
  // ========================================

  const ahora = new Date();

  const inicioHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );

  const finHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + 1
  );

  const inicioMes = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    1
  );

  const inicioSiguienteMes = new Date(
    ahora.getFullYear(),
    ahora.getMonth() + 1,
    1
  );


  // ========================================
  // CONSULTAS
  // ========================================

  const [
    clientes,
    citasPendientes,
    citasHoy,
    tatuajesActivos,
    stockBajo,
    productosStockBajo,
    proximasCitas,
    configuracion,
    suscripcion,
    recordatorios,
  ] = await Promise.all([

    // CLIENTES
    prisma.cliente.count({
      where: {
        estudioId,
        eliminadoEn: null,
      },
    }),


    // CITAS PENDIENTES
    prisma.cita.count({
      where: {
        estudioId,
        eliminadoEn: null,
        estado: "PENDIENTE",
      },
    }),


    // CITAS DE HOY
    prisma.cita.count({
      where: {
        estudioId,
        eliminadoEn: null,
        fecha: {
          gte: inicioHoy,
          lt: finHoy,
        },
      },
    }),


    // TATUAJES ACTIVOS
    prisma.tatuaje.count({
      where: {
        estudioId,
        eliminadoEn: null,
        estado: {
          in: [
            "PENDIENTE",
            "EN_PROCESO",
          ],
        },
      },
    }),


    // TOTAL STOCK BAJO
    prisma.inventario.count({
      where: {
        estudioId,
        activo: true,
        eliminadoEn: null,
        cantidad: {
          lte: prisma.inventario.fields.minimo,
        },
      },
    }),


    // PRODUCTOS CON STOCK BAJO
    prisma.inventario.findMany({
      where: {
        estudioId,
        activo: true,
        eliminadoEn: null,
        cantidad: {
          lte: prisma.inventario.fields.minimo,
        },
      },
      orderBy: {
        cantidad: "asc",
      },
      take: 5,
    }),


    // PROXIMAS CITAS
    prisma.cita.findMany({
      where: {
        estudioId,
        eliminadoEn: null,
        fecha: {
          gte: ahora,
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


    // CONFIGURACION
    prisma.configuracionEstudio.findUnique({
      where: {
        estudioId,
      },
    }),


    // SUSCRIPCION
    prisma.suscripcion.findUnique({
      where: {
        estudioId,
      },
    }),

    // RECORDATORIOS PENDIENTES
    prisma.recordatorioCita.findMany({
      where: {
        estudioId,
        estado: "PENDIENTE",
      },
      orderBy: { programadoPara: "asc" },
      take: 8,
      include: {
        cita: {
          include: {
            cliente: { select: { nombre: true, telefono: true } },
          },
        },
      },
    }),




  ]);




  return (
    <main className="min-h-screen bg-muted/40 p-4 md:p-6">

      <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">


        {/* ENCABEZADO */}

        <StudioHeader
          nombre={session.user.name ?? "Tattoo Desk"}
          logoUrl={configuracion?.logoUrl}
          nombreMostrar={configuracion?.nombreMostrar}
          plan={suscripcion?.plan}
          usuario={session.user.name}
          email={session.user.email}
        />


        {/* RESUMEN GENERAL */}

        <section>

          <div className="mb-4">

            <h2 className="text-xl font-semibold">
              Resumen general
            </h2>

            <p className="text-sm text-muted-foreground">
              Estado actual de tu estudio
            </p>

          </div>


          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <DashboardCard
              titulo="Clientes"
              valor={clientes.toString()}
            />

            <DashboardCard
              titulo="Citas pendientes"
              valor={citasPendientes.toString()}
            />

            <DashboardCard
              titulo="Citas hoy"
              valor={citasHoy.toString()}
            />

            <DashboardCard
              titulo="Tatuajes activos"
              valor={tatuajesActivos.toString()}
            />

          </div>

        </section>


        {/* ACCESOS RAPIDOS */}

        <section>

          <h2 className="mb-4 text-xl font-semibold">
            Accesos rápidos
          </h2>


          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

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
              titulo="Consentimiento"
              descripcion="Firmar waiver"
              href="/consentimiento"
              icono="✍️"
            />

            <QuickAction
              titulo="Inventario"
              descripcion="Materiales y stock"
              href="/inventario"
              icono="📦"
            />

            <QuickAction
              titulo="Finanzas"
              descripcion="Ingresos y gastos"
              href="/finanzas"
              icono="💰"
            />

          </div>

        </section>


        {recordatorios.length > 0 && (
          <section className="rounded-2xl border bg-background p-4 sm:p-5 md:p-6">
            <h2 className="mb-2 text-xl font-semibold">Avisos pendientes</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Recordatorios de cita listos para enviar por WhatsApp
            </p>
            <div className="space-y-3">
              {recordatorios.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {r.cita.cliente.nombre}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.mensaje}
                    </p>
                  </div>
                  {r.urlWhatsapp && (
                    <a
                      href={r.urlWhatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                    >
                      Abrir WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}


        {/* DOS COLUMNAS */}

        <section className="grid gap-6 lg:grid-cols-2">


          {/* PROXIMAS CITAS */}

          <div className="rounded-2xl border bg-background p-4 sm:p-5 md:p-6">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-semibold">
                  Próximas citas
                </h2>

                <p className="text-sm text-muted-foreground">
                  Las siguientes citas programadas
                </p>

              </div>

            </div>


            {proximasCitas.length === 0 ? (

              <div className="py-10 text-center">

                <p className="text-3xl">
                  📅
                </p>

                <p className="mt-3 text-sm text-muted-foreground">
                  No hay próximas citas.
                </p>

              </div>

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

          </div>


          {/* ALERTA INVENTARIO */}

          <div className="rounded-2xl border bg-background p-4 sm:p-5 md:p-6">

            <div className="mb-5">

              <h2 className="text-xl font-semibold">
                Inventario
              </h2>

              <p className="text-sm text-muted-foreground">
                Productos que requieren atención
              </p>

            </div>


            {stockBajo === 0 ? (

              <div className="py-10 text-center">

                <p className="text-3xl">
                  ✅
                </p>

                <p className="mt-3 font-medium">
                  Inventario en buen estado
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  No hay productos con stock bajo.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {productosStockBajo.map((producto) => (

                  <div
                    key={producto.id}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >

                    <div>

                      <p className="font-medium">
                        {producto.nombre}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Stock mínimo: {Number(producto.minimo)}
                      </p>

                    </div>


                    <div className="text-right">

                      <p className="text-lg font-bold">
                        {Number(producto.cantidad)}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        disponibles
                      </p>

                    </div>

                  </div>

                ))}


                {stockBajo > 5 && (

                  <p className="pt-2 text-center text-sm text-muted-foreground">
                    + {stockBajo - 5} productos más requieren atención
                  </p>

                )}

              </div>

            )}

          </div>


        </section>


      </div>

    </main>
  );
}

