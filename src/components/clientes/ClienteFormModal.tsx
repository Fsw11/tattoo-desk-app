"use client";

import { FormEvent, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export type ClienteFormValues = {
  nombre: string;
  telefono: string;
  email: string;
  instagram: string;
  direccion: string;
  alergias: string;
  enfermedades: string;
  notas: string;
};

const vacio: ClienteFormValues = {
  nombre: "",
  telefono: "",
  email: "",
  instagram: "",
  direccion: "",
  alergias: "",
  enfermedades: "",
  notas: "",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (cliente: { id: string }) => void;
  /** Si se pasa id, es edición (PUT) */
  clienteId?: string | null;
  iniciales?: Partial<ClienteFormValues> | null;
  title?: string;
};

export default function ClienteFormModal({
  open,
  onClose,
  onSaved,
  clienteId,
  iniciales,
  title,
}: Props) {
  const [form, setForm] = useState<ClienteFormValues>(vacio);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const editando = Boolean(clienteId);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...vacio,
      ...(iniciales || {}),
      nombre: iniciales?.nombre || "",
      telefono: iniciales?.telefono || "",
      email: iniciales?.email || "",
      instagram: iniciales?.instagram || "",
      direccion: iniciales?.direccion || "",
      alergias: iniciales?.alergias || "",
      enfermedades: iniciales?.enfermedades || "",
      notas: iniciales?.notas || "",
    });
    setError("");
  }, [open, iniciales]);

  function set<K extends keyof ClienteFormValues>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError("Nombre y teléfono son obligatorios.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const payload = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || null,
        instagram: form.instagram.trim() || null,
        direccion: form.direccion.trim() || null,
        alergias: form.alergias.trim() || null,
        enfermedades: form.enfermedades.trim() || null,
        notas: form.notas.trim() || null,
      };

      const res = await fetch(
        editando ? `/api/clientes/${clienteId}` : "/api/clientes",
        {
          method: editando ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "No se pudo guardar");
      onSaved(datos);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || (editando ? "Editar cliente" : "Nuevo cliente")}
      size="lg"
    >
      <form onSubmit={guardar} className="space-y-5">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Contacto
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              required
            />
            <Input
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <Input
              label="Instagram"
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="@usuario"
            />
            <Input
              label="Dirección"
              value={form.direccion}
              onChange={(e) => set("direccion", e.target.value)}
              className="sm:col-span-2"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Salud</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Alergias"
              value={form.alergias}
              onChange={(e) => set("alergias", e.target.value)}
            />
            <Input
              label="Enfermedades"
              value={form.enfermedades}
              onChange={(e) => set("enfermedades", e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Notas</h3>
          <textarea
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            rows={3}
            className="w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Preferencias, referencias, etc."
          />
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : editando ? "Guardar" : "Crear"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
