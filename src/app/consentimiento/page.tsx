import { Suspense } from "react";
import ConsentimientoClient from "./ConsentimientoClient";

export default function ConsentimientoPage() {
  return (
    <Suspense fallback={<main className="p-6">Cargando...</main>}>
      <ConsentimientoClient />
    </Suspense>
  );
}
