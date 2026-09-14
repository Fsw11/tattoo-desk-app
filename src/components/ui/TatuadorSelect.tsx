"use client";

import { useEffect, useState } from "react";
import Select from "@/components/ui/Select";

export type TatuadorLite = {
  id: number;
  nombre: string;
  rol: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
  /** Si hay un solo artista, preseleccionarlo (útil en formularios). */
  autoSelectSingle?: boolean;
};

export default function TatuadorSelect({
  value,
  onChange,
  label = "Tatuador",
  required = false,
  allowEmpty = true,
  emptyLabel = "Sin asignar",
  className,
  disabled,
  autoSelectSingle = true,
}: Props) {
  const [tatuadores, setTatuadores] = useState<TatuadorLite[]>([]);

  useEffect(() => {
    fetch("/api/usuarios/select")
      .then((r) => r.json())
      .then((d) => {
        const lista = Array.isArray(d) ? d : [];
        setTatuadores(lista);
        if (autoSelectSingle && !value && lista.length === 1) {
          onChange(String(lista[0].id));
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required && tatuadores.length > 1}
      className={className}
      disabled={disabled}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {tatuadores.map((t) => (
        <option key={t.id} value={t.id}>
          {t.nombre}
          {t.rol === "ADMIN" ? " (admin)" : ""}
        </option>
      ))}
    </Select>
  );
}
