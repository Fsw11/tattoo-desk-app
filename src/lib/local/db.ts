import Dexie, { Table } from "dexie";

export type LocalCliente = {
  id: string;
  nombre: string;
  telefono: string;
  email?: string | null;
  instagram?: string | null;
  direccion?: string | null;
  alergias?: string | null;
  enfermedades?: string | null;
  notas?: string | null;
  actualizadoEn: string;
  eliminadoEn?: string | null;
  _pending?: boolean;
};

export type LocalCita = {
  id: string;
  fecha: string;
  duracion: number;
  motivo?: string | null;
  notas?: string | null;
  estado: string;
  clienteId: string;
  usuarioId?: number | null;
  actualizadoEn: string;
  eliminadoEn?: string | null;
  _pending?: boolean;
};

export type LocalPago = {
  id: string;
  monto: number;
  metodo: string;
  concepto?: string | null;
  notas?: string | null;
  fecha: string;
  clienteId?: string | null;
  tatuajeId?: string | null;
  actualizadoEn: string;
  _pending?: boolean;
};

export type OutboxItem = {
  id?: number;
  entity: "cliente" | "cita" | "pago" | "foto" | "consentimiento";
  op: "upsert" | "delete";
  recordId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  blob?: Blob;
};

export type Meta = {
  key: string;
  value: string;
};

export type LocalFotoPendiente = {
  id: string;
  clienteId: string;
  tatuajeId?: string | null;
  descripcion?: string | null;
  tipo?: string;
  blob: Blob;
  createdAt: string;
};

class TattooDeskDB extends Dexie {
  clientes!: Table<LocalCliente, string>;
  citas!: Table<LocalCita, string>;
  pagos!: Table<LocalPago, string>;
  outbox!: Table<OutboxItem, number>;
  meta!: Table<Meta, string>;
  fotosPendientes!: Table<LocalFotoPendiente, string>;

  constructor() {
    super("tattoo-desk");
    this.version(1).stores({
      clientes: "id, telefono, actualizadoEn",
      citas: "id, fecha, clienteId, actualizadoEn",
      pagos: "id, fecha, clienteId, actualizadoEn",
      outbox: "++id, entity, createdAt",
      meta: "key",
      fotosPendientes: "id, clienteId, createdAt",
    });
  }
}

export const localDb = typeof window !== "undefined" ? new TattooDeskDB() : null;

export async function enqueueMutation(
  item: Omit<OutboxItem, "id" | "createdAt"> & { createdAt?: string },
) {
  if (!localDb) return;
  await localDb.outbox.add({
    ...item,
    createdAt: item.createdAt || new Date().toISOString(),
  });
}

export async function pullSync() {
  if (!localDb || !navigator.onLine) return;

  const meta = await localDb.meta.get("lastSync");
  const since = meta?.value || new Date(0).toISOString();

  const respuesta = await fetch(`/api/sync?since=${encodeURIComponent(since)}`);
  if (!respuesta.ok) return;

  const datos = await respuesta.json();
  const changes = datos.changes || {};

  await localDb.transaction(
    "rw",
    localDb.clientes,
    localDb.citas,
    localDb.pagos,
    localDb.meta,
    async () => {
      for (const c of changes.clientes || []) {
        await localDb!.clientes.put({
          id: c.id,
          nombre: c.nombre,
          telefono: c.telefono,
          email: c.email,
          instagram: c.instagram,
          direccion: c.direccion,
          alergias: c.alergias,
          enfermedades: c.enfermedades,
          notas: c.notas,
          actualizadoEn: c.actualizadoEn,
          eliminadoEn: c.eliminadoEn,
        });
      }
      for (const c of changes.citas || []) {
        await localDb!.citas.put({
          id: c.id,
          fecha: c.fecha,
          duracion: c.duracion,
          motivo: c.motivo,
          notas: c.notas,
          estado: c.estado,
          clienteId: c.clienteId,
          usuarioId: c.usuarioId,
          actualizadoEn: c.actualizadoEn,
          eliminadoEn: c.eliminadoEn,
        });
      }
      for (const p of changes.pagos || []) {
        await localDb!.pagos.put({
          id: p.id,
          monto: Number(p.monto),
          metodo: p.metodo,
          concepto: p.concepto,
          notas: p.notas,
          fecha: p.fecha,
          clienteId: p.clienteId,
          tatuajeId: p.tatuajeId,
          actualizadoEn: p.actualizadoEn,
        });
      }
      await localDb!.meta.put({
        key: "lastSync",
        value: datos.serverTime || new Date().toISOString(),
      });
    },
  );
}

export async function pushSync() {
  if (!localDb || !navigator.onLine) return { pushed: 0, fotos: 0 };

  const items = await localDb.outbox.orderBy("id").toArray();
  if (items.length === 0 && (await localDb.fotosPendientes.count()) === 0) {
    return { pushed: 0, fotos: 0 };
  }

  const mutations = items.map((item) => ({
    entity: item.entity,
    op: item.op,
    id: item.recordId,
    data: item.payload,
  }));

  if (mutations.length > 0) {
    const respuesta = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mutations }),
    });
    if (respuesta.ok) {
      await localDb.outbox.clear();
    }
  }

  let fotos = 0;
  const pendientes = await localDb.fotosPendientes.toArray();
  for (const foto of pendientes) {
    const form = new FormData();
    form.append("archivo", foto.blob, `${foto.id}.jpg`);
    const upload = await fetch("/api/upload", { method: "POST", body: form });
    if (!upload.ok) continue;
    const { url } = await upload.json();
    const create = await fetch("/api/fotos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: foto.id,
        url,
        clienteId: foto.clienteId,
        tatuajeId: foto.tatuajeId,
        descripcion: foto.descripcion,
        tipo: foto.tipo || "TATUAJE",
      }),
    });
    if (create.ok) {
      await localDb.fotosPendientes.delete(foto.id);
      fotos += 1;
    }
  }

  return { pushed: mutations.length, fotos };
}

export async function syncAll() {
  await pushSync();
  await pullSync();
}
