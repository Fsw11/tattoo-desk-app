"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setCargando(true);

    const resultado = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (resultado?.error) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Tattoo Desk</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión en tu estudio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="admin@tattoodesk.local"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
          >
            {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </main>
  );
}
