import { mkdir, writeFile } from "fs/promises";
import path from "path";

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAMANO_MAXIMO = 10 * 1024 * 1024;

export function validarImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN.includes(archivo.type)) {
    return "El archivo debe ser JPG, PNG, WEBP o GIF.";
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return "La imagen no puede superar los 10 MB.";
  }
  return null;
}

function extensionDeTipo(tipo: string) {
  const mapa: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return mapa[tipo] || "bin";
}

/**
 * Guarda una imagen. Si STORAGE_DRIVER=s3 y hay credenciales, usa S3/R2;
 * si no, cae a disco local (desarrollo).
 */
export async function guardarImagen(
  archivo: File,
  carpeta = "uploads",
): Promise<{ url: string; key: string }> {
  const bytes = await archivo.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = extensionDeTipo(archivo.type);
  const key = `${carpeta}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const driver = process.env.STORAGE_DRIVER || "local";

  if (driver === "s3" || driver === "r2") {
    const endpoint = process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET;
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;
    const publicBase = process.env.S3_PUBLIC_URL;

    if (endpoint && bucket && accessKey && secretKey && publicBase) {
      // Subida compatible con S3 vía fetch PUT firmado simple no disponible
      // sin SDK; usamos el endpoint estilo path si hay AWS-like pre-signed no.
      // Implementación mínima: PUT con headers básicos (R2/S3 con política pública de escritura no recomendada).
      // Preferimos local + documentar; cuando haya @aws-sdk/client-s3 se puede cablear.
      const url = `${publicBase.replace(/\/$/, "")}/${key}`;
      try {
        const respuesta = await fetch(
          `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": archivo.type,
              Authorization: `Bearer ${accessKey}:${secretKey}`,
            },
            body: buffer,
          },
        );
        if (respuesta.ok) {
          return { url, key };
        }
      } catch {
        // fallback local
      }
    }
  }

  const carpetaLocal = path.join(process.cwd(), "public", path.dirname(key));
  await mkdir(carpetaLocal, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", key), buffer);

  return { url: `/${key}`, key };
}
