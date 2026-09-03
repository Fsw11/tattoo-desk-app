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

  console.log("Creando estudio...");

  let estudio = await prisma.estudio.findFirst({
    where: {
      nombre: "Tattoo Desk",
    },
  });

  if (!estudio) {
    estudio = await prisma.estudio.create({
      data: {
        nombre: "Tattoo Desk",
      },
    });

    console.log("Estudio creado:", estudio.id);
  } else {
    console.log("El estudio ya existe:", estudio.id);
  }


  console.log("Creando usuario administrador...");

  const passwordHash = await bcrypt.hash(
    "Admin12345",
    10
  );

  const usuarioExistente =
    await prisma.usuario.findUnique({
      where: {
        email: "admin@tattoodesk.com",
      },
    });


  if (!usuarioExistente) {

    const usuario =
      await prisma.usuario.create({
        data: {
          nombre: "Administrador",
          email: "admin@tattoodesk.com",
          password: passwordHash,
          rol: "ADMIN",
          activo: true,
          estudioId: estudio.id,
        },
      });

    console.log("Usuario creado:");
    console.log("ID:", usuario.id);

  } else {

    console.log(
      "El usuario ya existe. Actualizando estudio y contraseña..."
    );

    await prisma.usuario.update({
      where: {
        email: "admin@tattoodesk.com",
      },
      data: {
        password: passwordHash,
        activo: true,
        rol: "ADMIN",
        estudioId: estudio.id,
      },
    });

  }


  console.log("");
  console.log("==============================");
  console.log("USUARIO ADMINISTRADOR LISTO");
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
