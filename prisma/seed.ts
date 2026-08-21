import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const password = await bcrypt.hash("TattooDesk123!", 12);

  const estudio = await prisma.estudio.upsert({
    where: {
      id: 1,
    },
    update: {},
    create: {
      nombre: "Mi Estudio de Tatuajes",
    },
  });

  const usuario = await prisma.usuario.upsert({
    where: {
      email: "admin@tattoodesk.local",
    },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@tattoodesk.local",
      password,
      rol: "ADMIN",
      estudioId: estudio.id,
    },
  });

  const clienteExistente = await prisma.cliente.findFirst({
    where: {
      estudioId: estudio.id,
      telefono: "6860000000",
    },
  });

  if (!clienteExistente) {
    const cliente = await prisma.cliente.create({
      data: {
        nombre: "Cliente de Prueba",
        telefono: "6860000000",
        email: "cliente@prueba.local",
        estudioId: estudio.id,
      },
    });

    console.log("Cliente creado:", cliente.nombre);
  } else {
    console.log("El cliente de prueba ya existe.");
  }

  console.log("Administrador:", usuario.email);
  console.log("Estudio ID:", estudio.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
