"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
};

type Cita = {
  id: number;
  fecha: string;
  duracion: number;
  motivo: string | null;
  notas: string | null;
  estado: "PENDIENTE" | "CONFIRMADA" | "FINALIZADA" | "CANCELADA";
  cliente: Cliente;
  usuario: {
    id: number;
    nombre: string;
  } | null;
};

type Vista = "DIA" | "SEMANA" | "MES";

const estados = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "CONFIRMADA", label: "Confirmada" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
] as const;

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const meses = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function inicioDelDia(fecha: Date) {
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate()
  );
}

function mismoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inicioSemana(fecha: Date) {
  const dia = fecha.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;
  const inicio = inicioDelDia(fecha);
  inicio.setDate(inicio.getDate() + diferencia);
  return inicio;
}

function finSemana(fecha: Date) {
  const inicio = inicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 7);
  return fin;
}

function formatoFechaTitulo(fecha: Date) {
  return `${diasSemana[
    fecha.getDay() === 0 ? 6 : fecha.getDay() - 1
  ]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

function formatoHora(fecha: Date) {
  return fecha.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatoHoraCorta(fecha: Date) {
  return fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fechaParaInput(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function fechaHoraParaInput(fecha: Date) {
  const fechaTexto = fechaParaInput(fecha);
  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");

  return `${fechaTexto}T${horas}:${minutos}`;
}

function fechaLocalAISO(valor: string) {
  return new Date(valor).toISOString();
}

function estadoLabel(estado: Cita["estado"]) {
  return (
    estados.find((item) => item.value === estado)?.label ??
    estado
  );
}

function claseEstado(estado: Cita["estado"]) {
  switch (estado) {
    case "CONFIRMADA":
      return "border-green-500/40 bg-green-500/10";
    case "FINALIZADA":
      return "border-blue-500/40 bg-blue-500/10";
    case "CANCELADA":
      return "border-red-500/40 bg-red-500/10 opacity-70";
    default:
      return "border-yellow-500/40 bg-yellow-500/10";
  }
}



function SelectorFechaHora({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const fechaSeleccionada = valor
    ? new Date(valor)
    : new Date();

  const [mostrarFecha, setMostrarFecha] =
    useState(false);

  const [mesCalendario, setMesCalendario] =
    useState(fechaSeleccionada.getMonth());

  const [anioCalendario, setAnioCalendario] =
    useState(fechaSeleccionada.getFullYear());

  const mesesCalendario = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const horas = Array.from(
    { length: 24 },
    (_, i) => i
  );

  const minutos = [
    "00",
    "15",
    "30",
    "45",
  ];

  const [diaTemporal, setDiaTemporal] =
    useState(fechaSeleccionada.getDate());

  function abrirCalendario() {
    setMesCalendario(
      fechaSeleccionada.getMonth()
    );

    setAnioCalendario(
      fechaSeleccionada.getFullYear()
    );

    setDiaTemporal(
      fechaSeleccionada.getDate()
    );

    setMostrarFecha(true);
  }

  function confirmarFecha() {
    const nueva = new Date(
      anioCalendario,
      mesCalendario,
      diaTemporal,
      fechaSeleccionada.getHours(),
      fechaSeleccionada.getMinutes()
    );

    const resultado =
      `${nueva.getFullYear()}-${String(
        nueva.getMonth() + 1
      ).padStart(2, "0")}-${String(
        nueva.getDate()
      ).padStart(2, "0")}T${String(
        nueva.getHours()
      ).padStart(2, "0")}:${String(
        nueva.getMinutes()
      ).padStart(2, "0")}`;

    onChange(resultado);
    setMostrarFecha(false);
  }

  function cambiarMes(valor: number) {
    let nuevoMes =
      mesCalendario + valor;

    let nuevoAnio =
      anioCalendario;

    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio--;
    }

    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio++;
    }

    setMesCalendario(nuevoMes);
    setAnioCalendario(nuevoAnio);

    const diasDelNuevoMes =
      new Date(
        nuevoAnio,
        nuevoMes + 1,
        0
      ).getDate();

    if (diaTemporal > diasDelNuevoMes) {
      setDiaTemporal(diasDelNuevoMes);
    }
  }

  function cambiarHora(
    hora: number,
    minuto: string
  ) {
    const nueva =
      new Date(fechaSeleccionada);

    nueva.setHours(
      hora,
      Number(minuto),
      0,
      0
    );

    const resultado =
      `${nueva.getFullYear()}-${String(
        nueva.getMonth() + 1
      ).padStart(2, "0")}-${String(
        nueva.getDate()
      ).padStart(2, "0")}T${String(
        nueva.getHours()
      ).padStart(2, "0")}:${String(
        nueva.getMinutes()
      ).padStart(2, "0")}`;

    onChange(resultado);
  }

  const primerDia = new Date(
    anioCalendario,
    mesCalendario,
    1
  );

  const diasMes = new Date(
    anioCalendario,
    mesCalendario + 1,
    0
  ).getDate();

  const espacioInicial =
    primerDia.getDay() === 0
      ? 6
      : primerDia.getDay() - 1;

  const calendario: (
    number | null
  )[] = [];

  for (
    let i = 0;
    i < espacioInicial;
    i++
  ) {
    calendario.push(null);
  }

  for (
    let i = 1;
    i <= diasMes;
    i++
  ) {
    calendario.push(i);
  }

  return (
    <div className="space-y-3">

      <button
        type="button"
        onClick={abrirCalendario}
        className="w-full rounded-xl border bg-background px-4 py-3 text-left transition hover:bg-muted"
      >
        <span className="block text-xs text-muted-foreground">
          Fecha de la cita
        </span>

        <span className="mt-1 block font-medium">
          {fechaSeleccionada.toLocaleDateString(
            "es-MX",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )}
        </span>
      </button>


      <Modal
        open={mostrarFecha}
        onClose={() => setMostrarFecha(false)}
        title="Seleccionar fecha"
        size="md"
      >

        <div className="space-y-5">

          <div className="flex items-center justify-between">

            <button
              type="button"
              onClick={() =>
                cambiarMes(-1)
              }
              className="rounded-lg border px-3 py-2 transition hover:bg-muted"
              aria-label="Mes anterior"
            >
              ←
            </button>


            <div className="flex gap-2">

              <select
                value={mesCalendario}
                onChange={(e) =>
                  setMesCalendario(
                    Number(e.target.value)
                  )
                }
                className="rounded-lg border bg-background px-3 py-2"
              >
                {mesesCalendario.map(
                  (mes, index) => (
                    <option
                      key={mes}
                      value={index}
                    >
                      {mes}
                    </option>
                  )
                )}
              </select>


              <select
                value={anioCalendario}
                onChange={(e) =>
                  setAnioCalendario(
                    Number(e.target.value)
                  )
                }
                className="rounded-lg border bg-background px-3 py-2"
              >
                {Array.from(
                  {
                    length: 21,
                  },
                  (_, i) =>
                    anioCalendario - 10 + i
                ).map((anio) => (
                  <option
                    key={anio}
                    value={anio}
                  >
                    {anio}
                  </option>
                ))}
              </select>

            </div>


            <button
              type="button"
              onClick={() =>
                cambiarMes(1)
              }
              className="rounded-lg border px-3 py-2 transition hover:bg-muted"
              aria-label="Mes siguiente"
            >
              →
            </button>

          </div>


          <div className="grid grid-cols-7 gap-1 text-center">

            {[
              "Lu",
              "Ma",
              "Mi",
              "Ju",
              "Vi",
              "Sa",
              "Do",
            ].map((dia) => (
              <div
                key={dia}
                className="py-2 text-xs font-medium text-muted-foreground"
              >
                {dia}
              </div>
            ))}


            {calendario.map(
              (dia, index) =>
                dia ? (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setDiaTemporal(dia)
                    }
                    className={`rounded-lg border p-3 transition ${
                      dia === diaTemporal
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {dia}
                  </button>
                ) : (
                  <div
                    key={index}
                  />
                )
            )}

          </div>


          <div className="rounded-xl border bg-muted/30 p-4">

            <p className="text-sm font-medium">
              Fecha seleccionada
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(
                anioCalendario,
                mesCalendario,
                diaTemporal
              ).toLocaleDateString(
                "es-MX",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>

          </div>


          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={() =>
                setMostrarFecha(false)
              }
              className="rounded-lg border px-4 py-2 transition hover:bg-muted"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmarFecha}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90"
            >
              Confirmar fecha
            </button>

          </div>

        </div>

      </Modal>


      <div className="grid grid-cols-2 gap-2 sm:gap-3">

        <select
          value={fechaSeleccionada.getHours()}
          onChange={(e) =>
            cambiarHora(
              Number(e.target.value),
              String(
                fechaSeleccionada.getMinutes()
              ).padStart(2, "0")
            )
          }
          className="rounded-xl border bg-background px-3 py-2"
        >
          {horas.map((hora) => (
            <option
              key={hora}
              value={hora}
            >
              {String(hora).padStart(2, "0")} hrs
            </option>
          ))}
        </select>


        <select
          value={String(
            fechaSeleccionada.getMinutes()
          ).padStart(2, "0")}
          onChange={(e) =>
            cambiarHora(
              fechaSeleccionada.getHours(),
              e.target.value
            )
          }
          className="rounded-xl border bg-background px-3 py-2"
        >
          {minutos.map((minuto) => (
            <option
              key={minuto}
              value={minuto}
            >
              :{minuto}
            </option>
          ))}
        </select>

      </div>

    </div>
  );
}

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vista, setVista] = useState<Vista>("MES");
  const [fechaActual, setFechaActual] = useState(new Date());
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] =
    useState<Cita | null>(null);

  const [editandoCita, setEditandoCita] = useState(false);
  const [fechaEditarCita, setFechaEditarCita] = useState("");
  const [duracionEditarCita, setDuracionEditarCita] = useState("120");
  const [motivoEditarCita, setMotivoEditarCita] = useState("");
  const [notasEditarCita, setNotasEditarCita] = useState("");
  const [guardandoEdicionCita, setGuardandoEdicionCita] =
    useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [fechaHora, setFechaHora] = useState(
    fechaHoraParaInput(new Date())
  );
  const [duracion, setDuracion] = useState("120");
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [resCitas, resClientes] = await Promise.all([
        fetch("/api/citas", { cache: "no-store" }),
        fetch("/api/clientes", { cache: "no-store" }),
      ]);

      const datosCitas = await resCitas.json();
      const datosClientes = await resClientes.json();

      if (!resCitas.ok || !resClientes.ok) {
        throw new Error(
          "No se pudieron cargar las citas y clientes."
        );
      }

      setCitas(
        Array.isArray(datosCitas) ? datosCitas : []
      );

      setClientes(
        Array.isArray(datosClientes)
          ? datosClientes.map((cliente: Cliente) => ({
              id: Number(cliente.id),
              nombre: cliente.nombre,
              telefono: cliente.telefono,
            }))
          : []
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar la agenda."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function limpiarFormulario() {
    setClienteId("");
    setFechaHora(fechaHoraParaInput(new Date()));
    setDuracion("120");
    setMotivo("");
    setNotas("");
  }

  function abrirNuevaCita(fecha?: Date) {
    const objetivo = fecha
      ? new Date(fecha)
      : new Date();

    if (fecha) {
      objetivo.setHours(11, 0, 0, 0);
    } else {
      objetivo.setSeconds(0, 0);
    }

    setFechaHora(fechaHoraParaInput(objetivo));
    setError("");
    setMostrarFormulario(true);
  }

  function abrirCita(cita: Cita) {
    const fecha = new Date(cita.fecha);

    setCitaSeleccionada(cita);
    setFechaActual(fecha);
    setError("");
  }

  function iniciarEdicionCita(cita: Cita) {
    setEditandoCita(true);
    setFechaEditarCita(
      fechaHoraParaInput(new Date(cita.fecha))
    );
    setDuracionEditarCita(String(cita.duracion));
    setMotivoEditarCita(cita.motivo ?? "");
    setNotasEditarCita(cita.notas ?? "");
  }

  async function guardarEdicionCita() {
    if (!citaSeleccionada) {
      return;
    }

    try {
      setGuardandoEdicionCita(true);
      setError("");

      const respuesta = await fetch("/api/citas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: citaSeleccionada.id,
          fecha: fechaLocalAISO(fechaEditarCita),
          duracion: Number(duracionEditarCita),
          motivo: motivoEditarCita,
          notas: notasEditarCita,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo actualizar la cita."
        );
      }

      const citaActualizada = {
        ...citaSeleccionada,
        ...datos,
      };

      setCitas((actuales) =>
        actuales.map((cita) =>
          cita.id === datos.id
            ? citaActualizada
            : cita
        )
      );

      setCitaSeleccionada(citaActualizada);
      setEditandoCita(false);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al guardar la cita."
      );
    } finally {
      setGuardandoEdicionCita(false);
    }
  }

  function moverPeriodo(direccion: number) {
    const nueva = new Date(fechaActual);

    if (vista === "DIA") {
      nueva.setDate(nueva.getDate() + direccion);
    } else if (vista === "SEMANA") {
      nueva.setDate(nueva.getDate() + direccion * 7);
    } else {
      nueva.setMonth(nueva.getMonth() + direccion);
    }

    setFechaActual(nueva);
  }

  function irHoy() {
    setFechaActual(new Date());
  }

  async function crearCita(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!clienteId) {
      setError("Selecciona un cliente.");
      return;
    }

    if (!fechaHora) {
      setError("Selecciona fecha y hora.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch("/api/citas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId: Number(clienteId),
          fecha: fechaLocalAISO(fechaHora),
          duracion: Number(duracion),
          motivo: motivo.trim() || null,
          notas: notas.trim() || null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo crear la cita."
        );
      }

      setCitas((actuales) =>
        [...actuales, datos].sort(
          (a, b) =>
            new Date(a.fecha).getTime() -
            new Date(b.fecha).getTime()
        )
      );

      limpiarFormulario();
      setMostrarFormulario(false);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al crear la cita."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(
    cita: Cita,
    estado: Cita["estado"]
  ) {
    if (cita.estado === estado) {
      return;
    }

    try {
      setError("");

      const respuesta = await fetch("/api/citas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: cita.id,
          estado,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo actualizar la cita."
        );
      }

      setCitas((actuales) =>
        actuales.map((actual) =>
          actual.id === cita.id ? datos : actual
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al actualizar la cita."
      );
    }
  }

  const citasDelDia = useMemo(
    () =>
      citas.filter((cita) =>
        mismoDia(
          new Date(cita.fecha),
          fechaActual
        )
      ),
    [citas, fechaActual]
  );

  const citasDeLaSemana = useMemo(() => {
    const inicio = inicioSemana(fechaActual);
    const fin = finSemana(fechaActual);

    return citas.filter((cita) => {
      const fecha = new Date(cita.fecha);
      return fecha >= inicio && fecha < fin;
    });
  }, [citas, fechaActual]);

  const citasDelMes = useMemo(
    () =>
      citas.filter((cita) => {
        const fecha = new Date(cita.fecha);

        return (
          fecha.getFullYear() ===
            fechaActual.getFullYear() &&
          fecha.getMonth() ===
            fechaActual.getMonth()
        );
      }),
    [citas, fechaActual]
  );

  const tituloPeriodo = useMemo(() => {
    if (vista === "DIA") {
      return formatoFechaTitulo(fechaActual);
    }

    if (vista === "SEMANA") {
      const inicio = inicioSemana(fechaActual);
      const fin = new Date(inicio);

      fin.setDate(fin.getDate() + 6);

      if (
        inicio.getMonth() ===
        fin.getMonth()
      ) {
        return `${inicio.getDate()}–${fin.getDate()} de ${meses[
          inicio.getMonth()
        ]} de ${inicio.getFullYear()}`;
      }

      return `${inicio.getDate()} de ${meses[
        inicio.getMonth()
      ]} – ${fin.getDate()} de ${meses[
        fin.getMonth()
      ]} de ${fin.getFullYear()}`;
    }

    return `${meses[
      fechaActual.getMonth()
    ]} de ${fechaActual.getFullYear()}`;
  }, [fechaActual, vista]);

  function generarDiasMes() {
    const primerDia = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth(),
      1
    );

    const diasEnMes = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth() + 1,
      0
    ).getDate();

    const desplazamiento =
      primerDia.getDay() === 0
        ? 6
        : primerDia.getDay() - 1;

    const totalCeldas =
      Math.ceil(
        (desplazamiento + diasEnMes) / 7
      ) * 7;

    const dias: Date[] = [];

    for (
      let indice = 0;
      indice < totalCeldas;
      indice++
    ) {
      const dia =
        indice - desplazamiento + 1;

      dias.push(
        new Date(
          fechaActual.getFullYear(),
          fechaActual.getMonth(),
          dia
        )
      );
    }

    return dias;
  }

  function renderCita(
    cita: Cita,
    compacto = false
  ) {
    const fecha = new Date(cita.fecha);

    return (
      <button
        key={cita.id}
        type="button"
        onClick={() => abrirCita(cita)}
        className={`w-full rounded-lg border p-2 text-left transition hover:brightness-110 ${claseEstado(
          cita.estado
        )}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold">
            {compacto
              ? formatoHoraCorta(fecha)
              : formatoHora(fecha)}
          </span>

          <span className="text-[10px] uppercase opacity-80">
            {cita.estado}
          </span>
        </div>

        <p className="truncate text-sm font-medium">
          {cita.cliente.nombre}
        </p>

        {!compacto && cita.motivo && (
          <p className="truncate text-xs opacity-75">
            {cita.motivo}
          </p>
        )}
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-muted/40 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Agenda del estudio
            </p>

            <h1 className="text-3xl font-bold">
              Citas
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Administra citas, horarios y estados
              desde una sola ventana.
            </p>
          </div>


        </header>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {mostrarFormulario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-background p-4 md:p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Nueva cita
                </h2>

                <p className="text-sm text-muted-foreground">
                  Registra la cita directamente desde la agenda.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  limpiarFormulario();
                }}
                className="w-full rounded-lg border px-4 py-2 sm:w-auto"
              >
                Cerrar
              </button>
            </div>

            <form
              onSubmit={crearCita}
              className="space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Cliente *
                  </label>

                  <select
                    value={clienteId}
                    onChange={(e) =>
                      setClienteId(e.target.value)
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                    required
                  >
                    <option value="">
                      Selecciona un cliente
                    </option>

                    {clientes.map((cliente) => (
                      <option
                        key={cliente.id}
                        value={cliente.id}
                      >
                        {cliente.nombre} —{" "}
                        {cliente.telefono}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Fecha y hora *
                  </label>

                  <SelectorFechaHora
                    valor={fechaHora}
                    onChange={setFechaHora}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Duración
                  </label>

                  <select
                    value={duracion}
                    onChange={(e) =>
                      setDuracion(e.target.value)
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="30">
                      30 minutos
                    </option>
                    <option value="60">
                      1 hora
                    </option>
                    <option value="90">
                      1 hora 30 min
                    </option>
                    <option value="120">
                      2 horas
                    </option>
                    <option value="180">
                      3 horas
                    </option>
                    <option value="240">
                      4 horas
                    </option>
                    <option value="300">
                      5 horas
                    </option>
                    <option value="360">
                      6 horas
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Motivo / trabajo
                  </label>

                  <input
                    value={motivo}
                    onChange={(e) =>
                      setMotivo(e.target.value)
                    }
                    placeholder="Ej. Sesión de tatuaje"
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Notas
                  </label>

                  <textarea
                    value={notas}
                    onChange={(e) =>
                      setNotas(e.target.value)
                    }
                    placeholder="Detalles de la cita..."
                    rows={3}
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    limpiarFormulario();
                  }}
                  className="rounded-lg border px-5 py-2.5"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground disabled:opacity-50"
                >
                  {guardando
                    ? "Guardando..."
                    : "Guardar cita"}
                </button>
              </div>
            </form>
          </section>
          </div>
        )}

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => abrirNuevaCita()}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              + Nueva cita
            </button>
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => moverPeriodo(-1)}
                className="rounded-lg border px-3 py-2"
                aria-label="Periodo anterior"
              >
                ←
              </button>

              <button
                type="button"
                onClick={irHoy}
                className="w-full rounded-lg border px-4 py-2 sm:w-auto"
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => moverPeriodo(1)}
                className="rounded-lg border px-3 py-2"
                aria-label="Siguiente periodo"
              >
                →
              </button>

              <h2 className="ml-2 text-xl font-semibold capitalize">
                {tituloPeriodo}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {([
                ["DIA", "Agenda diaria"],
                ["SEMANA", "Agenda semanal"],
                ["MES", "Vista mensual"],
              ] as const).map(
                ([valor, label]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() =>
                      setVista(valor)
                    }
                    className={`rounded-lg border px-4 py-2 ${
                      vista === valor
                        ? "bg-foreground text-background"
                        : ""
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {cargando ? (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
              Cargando agenda...
            </div>
          ) : vista === "DIA" ? (
            <div className="space-y-3">
              {citasDelDia.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                  No hay citas para este día.
                </div>
              ) : (
                citasDelDia.map((cita) => (
                  <div
                    key={cita.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-[110px_1fr] md:grid-cols-[120px_1fr_auto] md:items-start">
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-xl font-bold">
                          {formatoHora(
                            new Date(cita.fecha)
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {cita.duracion} min
                        </p>
                      </div>

                      <div>
                        <p className="text-lg font-semibold">
                          {cita.cliente.nombre}
                        </p>

                        <p className="text-sm">
                          {cita.cliente.telefono}
                        </p>

                        {cita.motivo && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {cita.motivo}
                          </p>
                        )}

                        {cita.notas && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {cita.notas}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-muted-foreground">
                          Tatuador:{" "}
                          {cita.usuario?.nombre ??
                            "Sin asignar"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${claseEstado(
                            cita.estado
                          )}`}
                        >
                          {estadoLabel(
                            cita.estado
                          )}
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {estados.map(
                            (estado) => (
                              <button
                                key={estado.value}
                                type="button"
                                onClick={() =>
                                  cambiarEstado(
                                    cita,
                                    estado.value
                                  )
                                }
                                className={`rounded-lg border px-3 py-1.5 text-xs ${
                                  cita.estado ===
                                  estado.value
                                    ? "bg-foreground text-background"
                                    : ""
                                }`}
                              >
                                {estado.label}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : vista === "SEMANA" ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-7">
              {Array.from({ length: 7 }).map(
                (_, indice) => {
                  const dia =
                    inicioSemana(fechaActual);

                  dia.setDate(
                    dia.getDate() + indice
                  );

                  const citasDia =
                    citasDeLaSemana.filter(
                      (cita) =>
                        mismoDia(
                          new Date(cita.fecha),
                          dia
                        )
                    );

                  const hoy = mismoDia(
                    dia,
                    new Date()
                  );

                  return (
                    <div
                      key={dia.toISOString()}
                      className={`min-h-[260px] rounded-xl border p-2 ${
                        hoy
                          ? "ring-1 ring-primary"
                          : ""
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 border-b pb-2">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">
                            {diasSemana[
                              indice
                            ].slice(0, 3)}
                          </p>

                          <p className="text-lg font-semibold">
                            {dia.getDate()}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            abrirNuevaCita(
                              dia
                            )
                          }
                          className="rounded-md border px-2 py-1 text-xs"
                        >
                          + Cita
                        </button>
                      </div>

                      <div className="space-y-2">
                        {citasDia.length === 0 ? (
                          <p className="py-4 text-center text-xs text-muted-foreground">
                            Libre
                          </p>
                        ) : (
                          citasDia.map(
                            (cita) =>
                              renderCita(
                                cita
                              )
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
              <div className="min-w-[720px] overflow-hidden rounded-xl border md:min-w-[900px]">
                <div className="grid grid-cols-7 border-l border-t">
                  {diasSemana.map((dia) => (
                    <div
                      key={dia}
                      className="border-b border-r bg-muted/50 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-3 sm:text-xs"
                    >
                      {dia}
                    </div>
                  ))}

                  {generarDiasMes().map((dia) => {
                    const esMesActual =
                      dia.getMonth() === fechaActual.getMonth() &&
                      dia.getFullYear() === fechaActual.getFullYear();

                    const esHoy = mismoDia(
                      dia,
                      new Date()
                    );

                    const citasDia = citasDelMes.filter(
                      (cita) =>
                        mismoDia(
                          new Date(cita.fecha),
                          dia
                        )
                    );

                    return (
                      <div
                        key={dia.toISOString()}
                        className={`group min-h-[120px] border-b border-r p-1.5 transition sm:min-h-[150px] sm:p-2 ${
                          !esMesActual
                            ? "bg-muted/10 text-muted-foreground"
                            : "bg-background"
                        } ${
                          esHoy
                            ? "bg-primary/5 ring-2 ring-inset ring-primary"
                            : ""
                        }`}
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-1 sm:mb-2 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => abrirNuevaCita(dia)}
                            className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold transition sm:h-7 sm:min-w-7 sm:px-2 sm:text-sm ${
                              esHoy
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                            title="Agregar cita"
                          >
                            {dia.getDate()}
                          </button>

                          <div className="flex items-center gap-1">
                            {citasDia.length > 0 && (
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold sm:px-2 sm:text-[10px]">
                                {citasDia.length}{" "}
                                {citasDia.length === 1
                                  ? "cita"
                                  : "citas"}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => abrirNuevaCita(dia)}
                              className="rounded-md border px-1.5 py-1 text-[10px] font-medium opacity-70 transition hover:bg-muted hover:opacity-100 sm:px-2 sm:text-xs"
                              aria-label={`Agregar cita el ${dia.getDate()}`}
                              title="Agregar cita"
                            >
                              + Cita
                            </button>
                          </div>
                        </div>

                        {citasDia.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => abrirNuevaCita(dia)}
                            className="flex min-h-[70px] w-full items-center justify-center rounded-lg border border-dashed px-1 text-[10px] text-muted-foreground transition hover:bg-muted/50 sm:min-h-[90px] sm:text-xs"
                          >
                            Día libre
                          </button>
                        ) : (
                          <div className="space-y-1.5">
                            {citasDia.map((cita) =>
                              renderCita(cita, true)
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {estados.map((estado) => (
            <div
              key={estado.value}
              className="rounded-xl border bg-background p-4"
            >
              <p className="text-sm text-muted-foreground">
                {estado.label}
              </p>

              <p className="mt-1 text-2xl font-bold">
                {
                  citas.filter(
                    (cita) =>
                      cita.estado ===
                      estado.value
                  ).length
                }
              </p>
            </div>
          ))}
        </section>

        {citaSeleccionada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <section className="w-full max-w-lg rounded-xl border bg-background p-4 md:p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editandoCita
                    ? "Editar cita"
                    : "Detalle de cita"}
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    setCitaSeleccionada(null);
                    setEditandoCita(false);
                  }}
                  className="rounded-lg border px-3 py-1 text-sm"
                >
                  Cerrar
                </button>
              </div>

              {!editandoCita ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Cliente
                    </p>
                    <p className="font-semibold">
                      {citaSeleccionada.cliente.nombre}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Teléfono
                    </p>
                    <p className="font-medium">
                      {citaSeleccionada.cliente.telefono}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fecha
                    </p>
                    <p className="font-medium">
                      {new Date(
                        citaSeleccionada.fecha
                      ).toLocaleString("es-MX")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Duración
                    </p>
                    <p className="font-medium">
                      {citaSeleccionada.duracion} minutos
                    </p>
                  </div>

                  {citaSeleccionada.motivo && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Motivo
                      </p>
                      <p className="font-medium">
                        {citaSeleccionada.motivo}
                      </p>
                    </div>
                  )}

                  {citaSeleccionada.notas && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Notas
                      </p>
                      <p className="whitespace-pre-wrap font-medium">
                        {citaSeleccionada.notas}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      iniciarEdicionCita(citaSeleccionada)
                    }
                    className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
                  >
                    Editar cita
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Fecha y hora
                    </label>

                    <SelectorFechaHora
                      valor={fechaEditarCita}
                      onChange={setFechaEditarCita}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Duración (minutos)
                    </label>

                    <input
                      type="number"
                      value={duracionEditarCita}
                      onChange={(e) =>
                        setDuracionEditarCita(e.target.value)
                      }
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Motivo
                    </label>

                    <input
                      type="text"
                      value={motivoEditarCita}
                      onChange={(e) =>
                        setMotivoEditarCita(e.target.value)
                      }
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Notas
                    </label>

                    <textarea
                      value={notasEditarCita}
                      onChange={(e) =>
                        setNotasEditarCita(e.target.value)
                      }
                      rows={4}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditandoCita(false)
                      }
                      className="flex-1 rounded-lg border px-4 py-2"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={guardandoEdicionCita}
                      onClick={guardarEdicionCita}
                      className="flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                    >
                      {guardandoEdicionCita
                        ? "Guardando..."
                        : "Guardar"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {estados.map((estado) => (
                  <button
                    key={estado.value}
                    type="button"
                    onClick={() => {
                      cambiarEstado(
                        citaSeleccionada,
                        estado.value
                      );

                      setCitaSeleccionada({
                        ...citaSeleccionada,
                        estado: estado.value,
                      });
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      citaSeleccionada.estado === estado.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {estado.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

      </div>
    </main>
  );
}
