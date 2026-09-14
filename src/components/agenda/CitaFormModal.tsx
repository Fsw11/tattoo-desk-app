"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TatuadorSelect from "@/components/ui/TatuadorSelect";
import WheelDateTimePicker from "@/components/ui/WheelDateTimePicker";
import { isoLocalDesdeFechaYHora, type CitaAgenda } from "./types";
import { usePuedeAsignarTatuador, useSessionUser } from "@/lib/rol-client";

type Cliente = { id: string; nombre: string; telefono: string };
type TatuajeLite = {
  id: string;
  nombre: string;
  estado: string;
  zona: string | null;
};

const DURACIONES = [60, 90, 120, 180];

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (cita: CitaAgenda) => void;
  iniciales?: {
    fecha?: Date;
    hora?: string;
    cita?: CitaAgenda | null;
  };
};

export default function CitaFormModal({
  open,
  onClose,
  onSaved,
  iniciales,
}: Props) {
  const editando = iniciales?.cita;
  const sessionUser = useSessionUser();
  const puedeAsignar = usePuedeAsignarTatuador();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tatuajes, setTatuajes] = useState<TatuajeLite[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [tatuajeId, setTatuajeId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [nuevoTatuaje, setNuevoTatuaje] = useState(false);
  const [tatuajeNombre, setTatuajeNombre] = useState("");
  const [tatuajeZona, setTatuajeZona] = useState("");
  const [tatuajeEstilo, setTatuajeEstilo] = useState("");
  const [tatuajePrecio, setTatuajePrecio] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("10:00");
  const [duracion, setDuracion] = useState("120");
  const [duracionCustom, setDuracionCustom] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");
  const [estado, setEstado] = useState("PENDIENTE");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/clientes/select")
      .then((r) => r.json())
      .then((d) => setClientes(Array.isArray(d) ? d : []))
      .catch(() => undefined);

    if (editando) {
      setClienteId(editando.clienteId);
      setTatuajeId(editando.tatuajeId || "");
      setUsuarioId(
        editando.usuario?.id != null
          ? String(editando.usuario.id)
          : sessionUser?.id || "",
      );
      const f = new Date(editando.fecha);
      const pad = (n: number) => String(n).padStart(2, "0");
      setFecha(
        `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`,
      );
      const mins = Math.round(f.getMinutes() / 5) * 5;
      setHora(`${pad(f.getHours())}:${pad(mins % 60)}`);
      setDuracion(String(editando.duracion));
      setDuracionCustom(!DURACIONES.includes(editando.duracion));
      setMotivo(editando.motivo || "");
      setNotas(editando.notas || "");
      setEstado(editando.estado);
      setNuevoTatuaje(false);
    } else {
      const base = iniciales?.fecha || new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setFecha(
        `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`,
      );
      const h0 = iniciales?.hora || "10:00";
      const [hh, mm] = h0.split(":").map(Number);
      const mins = Math.round((mm || 0) / 5) * 5;
      setHora(`${pad(hh || 10)}:${pad(mins % 60)}`);
      setClienteId("");
      setTatuajeId("");
      setUsuarioId(puedeAsignar ? "" : sessionUser?.id || "");
      setDuracion("120");
      setDuracionCustom(false);
      setMotivo("");
      setNotas("");
      setEstado("PENDIENTE");
      setNuevoTatuaje(false);
      setTatuajeNombre("");
      setTatuajeZona("");
      setTatuajeEstilo("");
      setTatuajePrecio("");
    }
    setError("");
  }, [
    open,
    editando,
    iniciales?.fecha,
    iniciales?.hora,
    puedeAsignar,
    sessionUser?.id,
  ]);

  useEffect(() => {
    if (!clienteId) {
      setTatuajes([]);
      return;
    }
    fetch(`/api/tatuajes`)
      .then((r) => r.json())
      .then((lista) => {
        if (!Array.isArray(lista)) return;
        setTatuajes(
          lista
            .filter(
              (t: { cliente?: { id: string }; clienteId?: string }) =>
                t.cliente?.id === clienteId ||
                (t as { clienteId?: string }).clienteId === clienteId,
            )
            .map((t: TatuajeLite) => ({
              id: t.id,
              nombre: t.nombre,
              estado: t.estado,
              zona: t.zona,
            })),
        );
      })
      .catch(() => undefined);
  }, [clienteId]);

  async function resolverTatuajeId(): Promise<string | null> {
    if (!nuevoTatuaje) return tatuajeId || null;
    if (!tatuajeNombre.trim()) {
      throw new Error("Nombre del tatuaje obligatorio.");
    }
    const uid = puedeAsignar
      ? usuarioId
        ? Number(usuarioId)
        : null
      : sessionUser?.id
        ? Number(sessionUser.id)
        : null;
    const res = await fetch("/api/tatuajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        nombre: tatuajeNombre.trim(),
        zona: tatuajeZona.trim() || null,
        estilo: tatuajeEstilo.trim() || null,
        precio: tatuajePrecio.trim() || null,
        usuarioId: uid,
      }),
    });
    const datos = await res.json();
    if (!res.ok) throw new Error(datos.error || "No se pudo crear el tatuaje.");
    return datos.id as string;
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (!clienteId) {
      setError("Selecciona un cliente.");
      return;
    }
    if (!fecha || !hora) {
      setError("Fecha y hora requeridas.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      const tid = await resolverTatuajeId();
      const [yy, mm, dd] = fecha.split("-").map(Number);
      const fechaDia = new Date(yy, mm - 1, dd);
      const fechaPayload = isoLocalDesdeFechaYHora(fechaDia, hora);
      const uid = puedeAsignar
        ? usuarioId
          ? Number(usuarioId)
          : null
        : sessionUser?.id
          ? Number(sessionUser.id)
          : null;
      const bodyBase = {
        fecha: new Date(fechaPayload).toISOString(),
        duracion: Number(duracion),
        motivo: motivo.trim() || null,
        notas: notas.trim() || null,
        tatuajeId: tid,
        clienteId,
        usuarioId: uid,
      };

      if (editando) {
        const res = await fetch("/api/citas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editando.id,
            ...bodyBase,
            estado,
          }),
        });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || "No se pudo guardar.");
        onSaved(datos);
      } else {
        const res = await fetch("/api/citas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyBase),
        });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || "No se pudo crear.");
        onSaved(datos);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarRapido() {
    if (!editando) return;
    const res = await fetch("/api/citas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editando.id, estado: "CONFIRMADA" }),
    });
    const datos = await res.json();
    if (res.ok) {
      onSaved(datos);
      setEstado("CONFIRMADA");
    } else {
      setError(datos.error || "No se pudo confirmar");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? "Cita" : "Nueva cita"}
      size="lg"
    >
      <form onSubmit={guardar} className="space-y-6">
        {editando && (
          <div className="flex flex-wrap gap-2 rounded-[var(--radius)] border border-border bg-muted/30 p-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void confirmarRapido()}
            >
              Confirmar
            </Button>
            <Link
              href={`/consentimiento?clienteId=${editando.clienteId}&citaId=${editando.id}`}
              className="inline-flex min-h-9 items-center rounded-[var(--radius)] border border-border px-3 text-sm"
            >
              Consentimiento
            </Link>
            <Link
              href={`/pos?clienteId=${editando.clienteId}&tatuajeId=${editando.tatuajeId || ""}&citaId=${editando.id}`}
              className="inline-flex min-h-9 items-center rounded-[var(--radius)] bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Abrir POS
            </Link>
          </div>
        )}

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cliente
          </h3>
          <Select
            label="Cliente"
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              setTatuajeId("");
            }}
            required
            disabled={Boolean(editando)}
          >
            <option value="">Selecciona...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} · {c.telefono}
              </option>
            ))}
          </Select>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Trabajo
          </h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={nuevoTatuaje}
              onChange={(e) => setNuevoTatuaje(e.target.checked)}
            />
            Crear tatuaje nuevo
          </label>
          {!nuevoTatuaje ? (
            <Select
              label="Tatuaje"
              value={tatuajeId}
              onChange={(e) => setTatuajeId(e.target.value)}
            >
              <option value="">Sin ligar / elegir después</option>
              {tatuajes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                  {t.zona ? ` · ${t.zona}` : ""} ({t.estado})
                </option>
              ))}
            </Select>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Nombre del tatuaje"
                value={tatuajeNombre}
                onChange={(e) => setTatuajeNombre(e.target.value)}
                required
              />
              <Input
                label="Zona"
                value={tatuajeZona}
                onChange={(e) => setTatuajeZona(e.target.value)}
              />
              <Input
                label="Estilo"
                value={tatuajeEstilo}
                onChange={(e) => setTatuajeEstilo(e.target.value)}
              />
              <Input
                label="Precio"
                type="number"
                value={tatuajePrecio}
                onChange={(e) => setTatuajePrecio(e.target.value)}
              />
            </div>
          )}
          {puedeAsignar ? (
            <TatuadorSelect value={usuarioId} onChange={setUsuarioId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Tatuador: tú ({sessionUser?.nombre || "sesión"})
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cuándo
          </h3>
          <WheelDateTimePicker
            fecha={fecha}
            hora={hora}
            onChange={(f, h) => {
              setFecha(f);
              setHora(h);
            }}
          />
          <div>
            <p className="mb-2 text-sm font-medium">Duración</p>
            <div className="flex flex-wrap gap-2">
              {DURACIONES.map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={
                    !duracionCustom && duracion === String(d)
                      ? "primary"
                      : "outline"
                  }
                  onClick={() => {
                    setDuracionCustom(false);
                    setDuracion(String(d));
                  }}
                >
                  {d} min
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={duracionCustom ? "primary" : "outline"}
                onClick={() => setDuracionCustom(true)}
              >
                Otra
              </Button>
            </div>
            {duracionCustom && (
              <Input
                className="mt-2"
                type="number"
                label="Minutos"
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                min={15}
                step={15}
              />
            )}
          </div>
        </section>

        <section className="space-y-3">
          <Input
            label="Motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <Input
            label="Notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
          {editando && (
            <Select
              label="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
            </Select>
          )}
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
