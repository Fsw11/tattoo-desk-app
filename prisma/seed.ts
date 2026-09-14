import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  PLANTILLA_CONSENTIMIENTO_DEFAULT,
  PLANTILLA_RECORDATORIO_DEFAULT,
} from "../src/lib/plantillas";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Creando estudio...");

  let estudio = await prisma.estudio.findFirst({
    where: { nombre: "Tattoo Desk" },
  });

  if (!estudio) {
    estudio = await prisma.estudio.create({
      data: { nombre: "Tattoo Desk" },
    });
  }

  const passwordHash = await bcrypt.hash("Admin12345", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@tattoodesk.com" },
    create: {
      nombre: "Administrador",
      email: "admin@tattoodesk.com",
      password: passwordHash,
      rol: "ADMIN",
      activo: true,
      estudioId: estudio.id,
    },
    update: {
      password: passwordHash,
      activo: true,
      rol: "ADMIN",
      estudioId: estudio.id,
    },
  });

  const ahora = new Date();
  const pruebaHasta = new Date(ahora);
  pruebaHasta.setDate(pruebaHasta.getDate() + 14);

  await prisma.configuracionEstudio.upsert({
    where: { estudioId: estudio.id },
    create: {
      estudioId: estudio.id,
      nombreMostrar: "Tattoo Desk",
      tema: "system",
      colorPrincipal: "#D4AF37",
      radio: "medio",
      plantillaConsentimiento: PLANTILLA_CONSENTIMIENTO_DEFAULT,
      plantillaRecordatorio: PLANTILLA_RECORDATORIO_DEFAULT,
    },
    update: {},
  });

  await prisma.suscripcion.upsert({
    where: { estudioId: estudio.id },
    create: {
      estudioId: estudio.id,
      plan: "FREE",
      estado: "PRUEBA",
      iniciaEn: ahora,
      pruebaHasta,
      venceEn: pruebaHasta,
    },
    update: {},
  });

  const horarios = await prisma.horarioEstudio.count({
    where: { estudioId: estudio.id },
  });
  if (horarios === 0) {
    await prisma.horarioEstudio.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
        estudioId: estudio.id,
        diaSemana: dia,
        abierto: dia >= 1 && dia <= 6,
        horaInicio: "10:00",
        horaFin: "20:00",
      })),
    });
  }

  console.log("==============================");
  console.log("Email: admin@tattoodesk.com");
  console.log("Password: Admin12345");
  console.log("Estudio ID:", estudio.id);
  console.log("==============================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
