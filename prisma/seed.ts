import "dotenv/config";
import bcrypt from "bcryptjs";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminEmail = "admin@tattoodesk.local";
  const adminPassword = "CambiarEstaPassword123!";

  const usuarioExistente = await prisma.usuario.findUnique({
    where: {
      email: adminEmail,
    },
  });

  if (usuarioExistente) {
    console.log("El administrador ya existe.");
    console.log("Email:", usuarioExistente.email);
    console.log("Estudio ID:", usuarioExistente.estudioId);

    return;
  }

  const password = await bcrypt.hash(adminPassword, 12);

  const estudio = await prisma.estudio.create({
    data: {
      nombre: "Mi Estudio de Tatuajes",
      email: adminEmail,

      usuarios: {
        create: {
          nombre: "Administrador",
          email: adminEmail,
          password,
          rol: "ADMIN",
        },
      },
    },

    include: {
      usuarios: true,
    },
  });

  console.log("Estudio creado:", estudio.nombre);
  console.log(
    "Administrador creado:",
    estudio.usuarios[0]?.email,
  );
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
