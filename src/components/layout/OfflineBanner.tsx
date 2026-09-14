"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { localDb, syncAll } from "@/lib/local/db";
import Button from "@/components/ui/Button";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [pendientes, setPendientes] = useState(0);
  const [syncing, setSyncing] = useState(false);

  async function refrescarPendientes() {
    if (!localDb) return;
    const outbox = await localDb.outbox.count();
    const fotos = await localDb.fotosPendientes.count();
    setPendientes(outbox + fotos);
  }

  useEffect(() => {
    setOnline(navigator.onLine);
    refrescarPendientes();

    function onOnline() {
      setOnline(true);
      syncAll().then(refrescarPendientes);
    }
    function onOffline() {
      setOnline(false);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const timer = setInterval(refrescarPendientes, 5000);

    if (navigator.onLine) {
      syncAll().then(refrescarPendientes);
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(timer);
    };
  }, []);

  if (online && pendientes === 0) return null;

  return (
    <div className="border-b border-border bg-warning/15 px-4 py-2 text-sm text-warning">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          <span>
            {!online
              ? "Sin conexión — los cambios se subirán al reconectar."
              : `Pendientes de sincronizar: ${pendientes}`}
          </span>
        </div>
        {online && pendientes > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              await syncAll();
              await refrescarPendientes();
              setSyncing(false);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {syncing ? "Sincronizando..." : "Sincronizar ahora"}
          </Button>
        )}
      </div>
    </div>
  );
}
