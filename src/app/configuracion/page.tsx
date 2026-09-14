"use client";

import { FormEvent, useEffect, useState } from "react";
import { notificarCambioTema } from "@/components/providers/theme-events";
import { ACENTOS_PRESET } from "@/lib/theme";
import PageShell from "@/components/ui/PageShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";

type PlanInfo = {
  codigo: string;
  estado: string;
  venceEn: string | null;
  pruebaHasta: string | null;
  limites: {
    clientes: number;
    fotos: number;
    usuarios: number;
  };
  features?: Record<string, boolean | number>;
  featureLabels?: Record<string, string>;
  uso: {
    clientes: number;
    fotos: number;
    usuarios: number;
  };
};

type Configuracion = {
  logoUrl: string | null;
  nombreMostrar: string | null;
  telefono: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tema: string;
  colorPrincipal: string;
  radio: string;
  plantillaConsentimiento: string | null;
  plantillaRecordatorio: string | null;
  exigirConsentimiento: boolean;
  horasAntesRecordatorio: number;
  plan?: PlanInfo;
};

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
};

type Horario = {
  diaSemana: number;
  abierto: boolean;
  horaInicio: string;
  horaFin: string;
};

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function ConfiguracionPage() {
  const [configuracion, setConfiguracion] = useState<Configuracion>({
    logoUrl: "",
    nombreMostrar: "",
    telefono: "",
    whatsapp: "",
    instagram: "",
    tema: "system",
    colorPrincipal: "#D4AF37",
    radio: "medio",
    plantillaConsentimiento: "",
    plantillaRecordatorio: "",
    exigirConsentimiento: true,
    horasAntesRecordatorio: 24,
  });
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "TATUADOR",
  });

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const [cfgRes, usersRes, horRes] = await Promise.all([
      fetch("/api/configuracion"),
      fetch("/api/usuarios"),
      fetch("/api/horarios"),
    ]);

    if (cfgRes.ok) {
      const datos = await cfgRes.json();
      setConfiguracion((prev) => ({ ...prev, ...datos }));
    }
    if (usersRes.ok) setUsuarios(await usersRes.json());
    if (horRes.ok) setHorarios(await horRes.json());
  }

  function actualizar<K extends keyof Configuracion>(
    campo: K,
    valor: Configuracion[K],
  ) {
    const nueva = { ...configuracion, [campo]: valor };
    setConfiguracion(nueva);
    if (
      campo === "tema" ||
      campo === "colorPrincipal" ||
      campo === "radio"
    ) {
      notificarCambioTema({
        tema: String(nueva.tema),
        colorPrincipal: String(nueva.colorPrincipal),
        radio: String(nueva.radio),
      });
    }
  }

  async function subirLogo(archivo: File) {
    const datos = new FormData();
    datos.append("archivo", archivo);
    const respuesta = await fetch("/api/upload", {
      method: "POST",
      body: datos,
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      setMensaje(resultado.error || "Error subiendo logo");
      return;
    }
    actualizar("logoUrl", resultado.url);
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");

    const respuesta = await fetch("/api/configuracion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configuracion),
    });

    if (respuesta.ok) {
      notificarCambioTema({
        tema: configuracion.tema,
        colorPrincipal: configuracion.colorPrincipal,
        radio: configuracion.radio,
      });
      setMensaje("Configuración guardada.");
    } else {
      const datos = await respuesta.json();
      setMensaje(datos.error || "No se pudo guardar.");
    }
    setGuardando(false);
  }

  async function guardarHorarios() {
    const respuesta = await fetch("/api/horarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horarios }),
    });
    if (respuesta.ok) {
      setHorarios(await respuesta.json());
      setMensaje("Horarios guardados.");
    }
  }

  async function crearUsuario(event: FormEvent) {
    event.preventDefault();
    const respuesta = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoUsuario),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      setMensaje(datos.error || "No se pudo crear usuario");
      return;
    }
    setUsuarios((u) => [...u, datos]);
    setNuevoUsuario({
      nombre: "",
      email: "",
      password: "",
      rol: "TATUADOR",
    });
    setMensaje("Usuario invitado.");
  }

  async function activarPlan(plan: string) {
    const respuesta = await fetch("/api/plan", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-plan-key": "dev",
      },
      body: JSON.stringify({ plan }),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      const checkout = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const cobro = await checkout.json();
      if (cobro.checkoutUrl) {
        window.location.href = cobro.checkoutUrl;
        return;
      }
      setMensaje(datos.error || cobro.error || "No se pudo cambiar el plan");
      return;
    }
    await cargar();
    setMensaje(`Plan ${plan} activado.`);
  }

  return (
    <PageShell
      title="Configuración"
      description="Marca, horarios, equipo y plan de tu estudio."
    >
      {mensaje && (
        <p className="rounded-[var(--radius)] border border-border bg-muted/40 px-4 py-2 text-sm">
          {mensaje}
        </p>
      )}

      <form onSubmit={guardar} className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Identidad</h2>
          <div className="flex items-center gap-4">
            {configuracion.logoUrl ? (
              <img
                src={configuracion.logoUrl}
                alt="Logo"
                className="h-16 w-16 rounded-[var(--radius)] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius)] border border-border text-xs text-muted-foreground">
                Logo
              </div>
            )}
            <label className="cursor-pointer rounded-[var(--radius)] border border-border px-3 py-2 text-sm hover:bg-muted">
              Subir logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void subirLogo(file);
                }}
              />
            </label>
          </div>
          <Input
            label="Nombre visible"
            value={configuracion.nombreMostrar || ""}
            onChange={(e) => actualizar("nombreMostrar", e.target.value)}
          />
          <Input
            label="Teléfono"
            value={configuracion.telefono || ""}
            onChange={(e) => actualizar("telefono", e.target.value)}
          />
          <Input
            label="WhatsApp"
            value={configuracion.whatsapp || ""}
            onChange={(e) => actualizar("whatsapp", e.target.value)}
          />
          <Input
            label="Instagram"
            value={configuracion.instagram || ""}
            onChange={(e) => actualizar("instagram", e.target.value)}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Apariencia</h2>
          <Select
            label="Tema"
            value={configuracion.tema}
            onChange={(e) => actualizar("tema", e.target.value)}
          >
            <option value="system">Sistema</option>
            <option value="dark">Oscuro</option>
            <option value="light">Claro</option>
          </Select>
          <Select
            label="Esquinas"
            value={configuracion.radio}
            onChange={(e) => actualizar("radio", e.target.value)}
          >
            <option value="compacto">Compacto</option>
            <option value="medio">Medio</option>
            <option value="suave">Suave</option>
          </Select>
          <div>
            <p className="mb-2 text-sm font-medium">Color de acento</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {ACENTOS_PRESET.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.label}
                  onClick={() => actualizar("colorPrincipal", p.color)}
                  className={`h-9 w-9 rounded-full border-2 ${
                    configuracion.colorPrincipal === p.color
                      ? "border-foreground"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: p.color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={configuracion.colorPrincipal}
              onChange={(e) => actualizar("colorPrincipal", e.target.value)}
              className="h-12 w-full cursor-pointer rounded-[var(--radius)] border border-border"
            />
          </div>
          <div className="rounded-[var(--radius)] border border-border p-4">
            <p className="text-sm text-muted-foreground">Vista previa</p>
            <Button type="button" className="mt-3">
              Botón primario
            </Button>
          </div>
        </Card>

        <Card className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold">Consentimiento y recordatorios</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={configuracion.exigirConsentimiento}
              onChange={(e) =>
                actualizar("exigirConsentimiento", e.target.checked)
              }
            />
            Exigir waiver firmado para finalizar citas
          </label>
          <div>
            <label className="text-sm font-medium">Plantilla de consentimiento</label>
            <textarea
              className="mt-1 min-h-32 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2"
              value={configuracion.plantillaConsentimiento || ""}
              onChange={(e) =>
                actualizar("plantillaConsentimiento", e.target.value)
              }
            />
          </div>
          <Input
            label="Horas antes del recordatorio"
            type="number"
            value={configuracion.horasAntesRecordatorio}
            onChange={(e) =>
              actualizar("horasAntesRecordatorio", Number(e.target.value))
            }
          />
          <div>
            <label className="text-sm font-medium">
              Plantilla recordatorio (usa {"{nombre}"}, {"{hora}"}, {"{estudio}"})
            </label>
            <textarea
              className="mt-1 min-h-20 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2"
              value={configuracion.plantillaRecordatorio || ""}
              onChange={(e) =>
                actualizar("plantillaRecordatorio", e.target.value)
              }
            />
          </div>
          <Button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar configuración"}
          </Button>
        </Card>
      </form>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Horario del estudio</h2>
          <Button type="button" variant="secondary" onClick={guardarHorarios}>
            Guardar horarios
          </Button>
        </div>
        <div className="space-y-3">
          {horarios.map((h, idx) => (
            <div
              key={h.diaSemana}
              className="grid grid-cols-2 gap-2 md:grid-cols-4 md:items-center"
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={h.abierto}
                  onChange={(e) => {
                    const next = [...horarios];
                    next[idx] = { ...h, abierto: e.target.checked };
                    setHorarios(next);
                  }}
                />
                {DIAS[h.diaSemana]}
              </label>
              <Input
                type="time"
                value={h.horaInicio}
                disabled={!h.abierto}
                onChange={(e) => {
                  const next = [...horarios];
                  next[idx] = { ...h, horaInicio: e.target.value };
                  setHorarios(next);
                }}
              />
              <Input
                type="time"
                value={h.horaFin}
                disabled={!h.abierto}
                onChange={(e) => {
                  const next = [...horarios];
                  next[idx] = { ...h, horaFin: e.target.value };
                  setHorarios(next);
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Equipo</h2>
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-border px-3 py-2"
            >
              <div>
                <p className="font-medium">{u.nombre}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{u.rol}</Badge>
                {!u.activo && <Badge tone="danger">Inactivo</Badge>}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await fetch(`/api/usuarios?id=${u.id}`, {
                      method: "DELETE",
                    });
                    await cargar();
                  }}
                >
                  Desactivar
                </Button>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={crearUsuario} className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Nombre"
            value={nuevoUsuario.nombre}
            onChange={(e) =>
              setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
            }
            required
          />
          <Input
            placeholder="Correo"
            type="email"
            value={nuevoUsuario.email}
            onChange={(e) =>
              setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
            }
            required
          />
          <Input
            placeholder="Contraseña temporal"
            type="password"
            value={nuevoUsuario.password}
            onChange={(e) =>
              setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
            }
            required
          />
          <Select
            value={nuevoUsuario.rol}
            onChange={(e) =>
              setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })
            }
          >
            <option value="TATUADOR">Tatuador</option>
            <option value="RECEPCION">Recepción</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Button type="submit" className="md:col-span-4">
            Invitar usuario
          </Button>
        </form>
      </Card>

      {configuracion.plan && (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Tu plan</h2>
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">{configuracion.plan.codigo}</Badge>
            <Badge>{configuracion.plan.estado}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Los planes desbloquean herramientas (equipo, POS, firmas…), no un
            tope de clientes. Usuarios: {configuracion.plan.uso.usuarios}/
            {configuracion.plan.limites.usuarios}.
          </p>
          {configuracion.plan.features && configuracion.plan.featureLabels && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {Object.entries(configuracion.plan.featureLabels).map(
                ([key, label]) => {
                  const on = Boolean(configuracion.plan?.features?.[key]);
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span>{label}</span>
                      <Badge tone={on ? "success" : "default"}>
                        {on ? "Incluido" : "No"}
                      </Badge>
                    </li>
                  );
                },
              )}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => activarPlan("FREE")}>
              FREE
            </Button>
            <Button type="button" onClick={() => activarPlan("PRO")}>
              Subir a PRO
            </Button>
            <Button type="button" variant="outline" onClick={() => activarPlan("BUSINESS")}>
              BUSINESS
            </Button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
