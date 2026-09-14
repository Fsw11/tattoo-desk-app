"use client";

import Link from "next/link";

type Appointment = {
  id: string;
  fecha: Date | string;
  estado: string;
  cliente: {
    nombre: string;
  };
};

export default function AppointmentCard({
  cita,
}: {
  cita: Appointment;
}) {

  return (
    <Link
      href="/citas"
      className="block rounded-xl border bg-background p-4 transition hover:bg-muted hover:shadow-md"
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="font-semibold">
            {cita.cliente.nombre}
          </p>

          <p className="text-sm text-muted-foreground">
            {new Date(cita.fecha).toLocaleString("es-MX")}
          </p>

        </div>


        <span className="rounded-full border px-2.5 py-1 text-xs">
          {cita.estado}
        </span>

      </div>

    </Link>
  );
}
