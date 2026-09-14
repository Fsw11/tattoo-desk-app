"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function RegistroPage() {
  const router = useRouter();
  const [nombreEstudio, setNombreEstudio] = useState("");
  const [nombreAdmin, setNombreAdmin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreEstudio,
          nombreAdmin,
          email,
          password,
        }),
      });

      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo registrar.");
      }

      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (login?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar.");
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Crea tu estudio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            14 días de prueba. Sin tarjeta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del estudio"
            required
            value={nombreEstudio}
            onChange={(e) => setNombreEstudio(e.target.value)}
          />
          <Input
            label="Tu nombre"
            required
            value={nombreAdmin}
            onChange={(e) => setNombreAdmin(e.target.value)}
          />
          <Input
            label="Correo"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </main>
  );
}
