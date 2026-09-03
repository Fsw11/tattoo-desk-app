-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'TATUADOR', 'RECEPCION');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoTatuaje" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'CANCELADO', 'PAUSADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('MATERIAL', 'EQUIPO', 'RENTA', 'SERVICIOS', 'MARKETING', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoFoto" AS ENUM ('TATUAJE', 'ANTES', 'DESPUES', 'DISENO', 'OTRA');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('ACTIVA', 'CANCELADA', 'VENCIDA', 'PRUEBA');

-- CreateTable
CREATE TABLE "Estudio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'TATUADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "estudioId" INTEGER NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "instagram" TEXT,
    "direccion" TEXT,
    "alergias" TEXT,
    "enfermedades" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "estudioId" INTEGER NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER NOT NULL DEFAULT 120,
    "motivo" TEXT,
    "notas" TEXT,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "estudioId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "usuarioId" INTEGER,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tatuaje" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estilo" TEXT,
    "zona" TEXT,
    "precio" DECIMAL(10,2),
    "anticipo" DECIMAL(10,2),
    "estado" "EstadoTatuaje" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "estudioId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "usuarioId" INTEGER,

    CONSTRAINT "Tatuaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "concepto" TEXT,
    "notas" TEXT,
    "metodo" "MetodoPago" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estudioId" INTEGER NOT NULL,
    "clienteId" INTEGER,
    "tatuajeId" INTEGER,
    "usuarioId" INTEGER,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" SERIAL NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" "CategoriaGasto" NOT NULL,
    "notas" TEXT,
    "estudioId" INTEGER NOT NULL,
    "usuarioId" INTEGER,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoFoto" NOT NULL DEFAULT 'TATUAJE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estudioId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tatuajeId" INTEGER,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "unidad" TEXT,
    "minimo" DECIMAL(10,2),
    "costo" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "estudioId" INTEGER NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMovimientoInventario" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estudioId" INTEGER NOT NULL,
    "inventarioId" INTEGER NOT NULL,
    "usuarioId" INTEGER,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionEstudio" (
    "id" SERIAL NOT NULL,
    "estudioId" INTEGER NOT NULL,
    "logoUrl" TEXT,
    "nombreMostrar" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "tema" TEXT NOT NULL DEFAULT 'dark',
    "colorPrincipal" TEXT NOT NULL DEFAULT '#D4AF37',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionEstudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suscripcion" (
    "id" SERIAL NOT NULL,
    "plan" "Plan" NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estudioId" INTEGER NOT NULL,

    CONSTRAINT "Suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_estudioId_idx" ON "Usuario"("estudioId");

-- CreateIndex
CREATE INDEX "Cliente_estudioId_idx" ON "Cliente"("estudioId");

-- CreateIndex
CREATE INDEX "Cliente_telefono_idx" ON "Cliente"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_estudioId_telefono_key" ON "Cliente"("estudioId", "telefono");

-- CreateIndex
CREATE INDEX "Cita_estudioId_fecha_idx" ON "Cita"("estudioId", "fecha");

-- CreateIndex
CREATE INDEX "Cita_clienteId_idx" ON "Cita"("clienteId");

-- CreateIndex
CREATE INDEX "Tatuaje_estudioId_idx" ON "Tatuaje"("estudioId");

-- CreateIndex
CREATE INDEX "Tatuaje_clienteId_idx" ON "Tatuaje"("clienteId");

-- CreateIndex
CREATE INDEX "Tatuaje_usuarioId_idx" ON "Tatuaje"("usuarioId");

-- CreateIndex
CREATE INDEX "Pago_estudioId_idx" ON "Pago"("estudioId");

-- CreateIndex
CREATE INDEX "Gasto_estudioId_fecha_idx" ON "Gasto"("estudioId", "fecha");

-- CreateIndex
CREATE INDEX "Foto_estudioId_idx" ON "Foto"("estudioId");

-- CreateIndex
CREATE INDEX "Foto_clienteId_idx" ON "Foto"("clienteId");

-- CreateIndex
CREATE INDEX "Foto_tatuajeId_idx" ON "Foto"("tatuajeId");

-- CreateIndex
CREATE INDEX "Inventario_estudioId_idx" ON "Inventario"("estudioId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_estudioId_idx" ON "MovimientoInventario"("estudioId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_inventarioId_idx" ON "MovimientoInventario"("inventarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionEstudio_estudioId_key" ON "ConfiguracionEstudio"("estudioId");

-- CreateIndex
CREATE UNIQUE INDEX "Suscripcion_estudioId_key" ON "Suscripcion"("estudioId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tatuaje" ADD CONSTRAINT "Tatuaje_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tatuaje" ADD CONSTRAINT "Tatuaje_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tatuaje" ADD CONSTRAINT "Tatuaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_tatuajeId_fkey" FOREIGN KEY ("tatuajeId") REFERENCES "Tatuaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_tatuajeId_fkey" FOREIGN KEY ("tatuajeId") REFERENCES "Tatuaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionEstudio" ADD CONSTRAINT "ConfiguracionEstudio_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suscripcion" ADD CONSTRAINT "Suscripcion_estudioId_fkey" FOREIGN KEY ("estudioId") REFERENCES "Estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
