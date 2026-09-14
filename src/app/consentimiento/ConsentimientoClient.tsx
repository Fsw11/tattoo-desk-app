"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { enqueueMutation, localDb } from "@/lib/local/db";

type Cliente = { id: string; nombre: string };
type Consentimiento = {
  id: string;
  textoPlantilla: string;
  firmaUrl: string;
  firmadoEn: string;
  cliente: { id: string; nombre: string };
  cita: { id: string; fecha: string } | null;
};

type Tab = "historial" | "firmar";

export default function ConsentimientoClient() {
  const search = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [tab, setTab] = useState<Tab>(
    search.get("firmar") === "1" || search.get("clienteId")
      ? "firmar"
      : "historial",
  );
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [lista, setLista] = useState<Consentimiento[]>([]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [detalle, setDetalle] = useState<Consentimiento | null>(null);
  const [clienteId, setClienteId] = useState(search.get("clienteId") || "");
  const [citaId, setCitaId] = useState(search.get("citaId") || "");
  const [texto, setTexto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  async function cargarHistorial() {
    setCargando(true);
    const qs = filtroCliente ? `?clienteId=${filtroCliente}` : "";
    const res = await fetch(`/api/consentimientos${qs}`);
    const datos = await res.json();
    if (res.ok) setLista(Array.isArray(datos) ? datos : []);
    setCargando(false);
  }

  useEffect(() => {
    fetch("/api/clientes/select")
      .then((r) => r.json())
      .then((d) => setClientes(Array.isArray(d) ? d : []))
      .catch(() => undefined);
    fetch("/api/configuracion")
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg.plantillaConsentimiento) setTexto(cfg.plantillaConsentimiento);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (tab === "historial") void cargarHistorial();
  }, [tab, filtroCliente]);

  useEffect(() => {
    if (tab !== "firmar") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [tab]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    dibujando.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    dibujando.current = false;
  }

  function limpiar() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (!clienteId || !canvasRef.current) return;
    setGuardando(true);
    setMensaje("");

    const blob = await new Promise<Blob | null>((resolve) =>
      canvasRef.current!.toBlob(resolve, "image/png"),
    );
    if (!blob) {
      setMensaje("No se pudo capturar la firma.");
      setGuardando(false);
      return;
    }

    const id = crypto.randomUUID();

    try {
      if (!navigator.onLine) {
        if (localDb) {
          await localDb.fotosPendientes.put({
            id: `${id}-firma`,
            clienteId,
            blob,
            createdAt: new Date().toISOString(),
            descripcion: "firma-consentimiento",
            tipo: "OTRA",
          });
          await enqueueMutation({
            entity: "consentimiento",
            op: "upsert",
            recordId: id,
            payload: {
              clienteId,
              citaId: citaId || null,
              textoPlantilla: texto,
              firmaUrl: `pending:${id}-firma`,
            },
          });
        }
        setMensaje("Firma guardada offline. Se subirá al reconectar.");
        setGuardando(false);
        return;
      }

      const form = new FormData();
      form.append("archivo", blob, `firma-${id}.png`);
      const upload = await fetch("/api/upload", { method: "POST", body: form });
      const up = await upload.json();
      if (!upload.ok) throw new Error(up.error || "Error subiendo firma");

      const respuesta = await fetch("/api/consentimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          clienteId,
          citaId: citaId || null,
          textoPlantilla: texto,
          firmaUrl: up.url,
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || "Error guardando");

      setMensaje("Consentimiento firmado correctamente.");
      limpiar();
      setTab("historial");
      await cargarHistorial();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "Error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PageShell
      title="Consentimientos"
      description="Consulta firmas o registra un nuevo waiver."
      actions={
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={tab === "historial" ? "primary" : "outline"}
            onClick={() => setTab("historial")}
          >
            Historial
          </Button>
          <Button
            size="sm"
            variant={tab === "firmar" ? "primary" : "outline"}
            onClick={() => setTab("firmar")}
          >
            Firmar
          </Button>
        </div>
      }
    >
      {tab === "historial" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <div className="space-y-3">
            <Select
              label="Filtrar por cliente"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            {cargando ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : lista.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay consentimientos.
              </p>
            ) : (
              lista.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDetalle(c)}
                  className={`flex w-full items-center gap-3 rounded-[var(--radius)] border p-3 text-left ${
                    detalle?.id === c.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <img
                    src={c.firmaUrl}
                    alt="Firma"
                    className="h-12 w-20 rounded border border-border bg-white object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.cliente.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.firmadoEn).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <Badge tone="success">Firmado</Badge>
                </button>
              ))
            )}
          </div>

          <Card className="space-y-3">
            {!detalle ? (
              <p className="text-sm text-muted-foreground">
                Selecciona una firma para ver el detalle.
              </p>
            ) : (
              <>
                <h2 className="text-lg font-semibold">
                  {detalle.cliente.nombre}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(detalle.firmadoEn).toLocaleString("es-MX")}
                </p>
                <img
                  src={detalle.firmaUrl}
                  alt="Firma"
                  className="w-full rounded-lg border border-border bg-white"
                />
                <div className="max-h-48 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {detalle.textoPlantilla}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/clientes/${detalle.cliente.id}`}
                    className="text-sm text-primary underline"
                  >
                    Ver cliente
                  </Link>
                  {detalle.cita && (
                    <Link href="/citas" className="text-sm text-primary underline">
                      Ir a agenda
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setClienteId(detalle.cliente.id);
                      setCitaId(detalle.cita?.id || "");
                      setTab("firmar");
                    }}
                  >
                    Nueva firma
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "¿Eliminar esta firma? No se podrá recuperar desde el historial.",
                        )
                      ) {
                        return;
                      }
                      const res = await fetch(
                        `/api/consentimientos?id=${detalle.id}`,
                        { method: "DELETE" },
                      );
                      if (!res.ok) {
                        const d = await res.json();
                        setMensaje(d.error || "No se pudo eliminar");
                        return;
                      }
                      setDetalle(null);
                      void cargarHistorial();
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      ) : (
        <form onSubmit={guardar} className="mx-auto max-w-3xl space-y-4">
          <Card className="space-y-4">
            <Select
              label="Cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
            >
              <option value="">Selecciona...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Input
              label="ID de cita (opcional)"
              value={citaId}
              onChange={(e) => setCitaId(e.target.value)}
              placeholder="Opcional"
            />
            <div>
              <label className="text-sm font-medium">
                Texto del consentimiento
              </label>
              <textarea
                className="mt-1 min-h-40 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Firma</label>
                <Button type="button" size="sm" variant="ghost" onClick={limpiar}>
                  Limpiar
                </Button>
              </div>
              <canvas
                ref={canvasRef}
                width={800}
                height={240}
                className="w-full touch-none rounded-[var(--radius)] border border-border bg-white"
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerLeave={end}
              />
            </div>
            {mensaje && <p className="text-sm">{mensaje}</p>}
            <Button type="submit" disabled={guardando || !clienteId}>
              {guardando ? "Guardando..." : "Guardar firma"}
            </Button>
          </Card>
        </form>
      )}
    </PageShell>
  );
}
