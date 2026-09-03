-- AlterTable
ALTER TABLE "MovimientoInventario" ADD COLUMN     "costoTotal" DECIMAL(10,2),
ADD COLUMN     "costoUnitario" DECIMAL(10,2),
ADD COLUMN     "tatuajeId" INTEGER;

-- CreateIndex
CREATE INDEX "MovimientoInventario_tatuajeId_idx" ON "MovimientoInventario"("tatuajeId");

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_tatuajeId_fkey" FOREIGN KEY ("tatuajeId") REFERENCES "Tatuaje"("id") ON DELETE SET NULL ON UPDATE CASCADE;
