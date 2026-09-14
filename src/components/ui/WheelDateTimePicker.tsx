"use client";

import { useEffect, useMemo, useRef } from "react";

type Props = {
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  onChange: (fecha: string, hora: string) => void;
  diasAdelante?: number;
};

const ITEM_H = 40;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function etiquetaDia(d: Date, hoy: Date) {
  const mismo =
    d.getFullYear() === hoy.getFullYear() &&
    d.getMonth() === hoy.getMonth() &&
    d.getDate() === hoy.getDate();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  const esManana =
    d.getFullYear() === manana.getFullYear() &&
    d.getMonth() === manana.getMonth() &&
    d.getDate() === manana.getDate();

  const short = d.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  if (mismo) return `Hoy · ${short}`;
  if (esManana) return `Mañana · ${short}`;
  return short;
}

function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  ariaLabel,
}: {
  items: { key: string; label: string }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lock = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || lock.current) return;
    el.scrollTop = selectedIndex * ITEM_H;
  }, [selectedIndex, items.length]);

  function onScrollEnd() {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    if (clamped !== selectedIndex) onSelect(clamped);
  }

  return (
    <div className="relative flex-1">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] h-10 -translate-y-1/2 rounded-lg border border-primary/30 bg-primary/10"
        aria-hidden
      />
      <div
        ref={ref}
        role="listbox"
        aria-label={ariaLabel}
        className="h-[200px] overflow-y-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: "y mandatory",
          paddingTop: 80,
          paddingBottom: 80,
        }}
        onScroll={() => {
          lock.current = true;
        }}
        onTouchEnd={onScrollEnd}
        onMouseUp={onScrollEnd}
        onWheel={() => {
          window.clearTimeout((onScrollEnd as unknown as { t?: number }).t);
          (onScrollEnd as unknown as { t?: number }).t = window.setTimeout(
            onScrollEnd,
            80,
          );
        }}
      >
        {items.map((item, i) => (
          <button
            key={item.key}
            type="button"
            role="option"
            aria-selected={i === selectedIndex}
            className={`flex w-full shrink-0 items-center justify-center text-sm transition ${
              i === selectedIndex
                ? "font-semibold text-foreground"
                : "text-muted-foreground"
            }`}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            onClick={() => {
              lock.current = false;
              onSelect(i);
              ref.current?.scrollTo({
                top: i * ITEM_H,
                behavior: "smooth",
              });
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WheelDateTimePicker({
  fecha,
  hora,
  onChange,
  diasAdelante = 60,
}: Props) {
  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dias = useMemo(() => {
    const list: { key: string; label: string; date: Date }[] = [];
    // Include a few past days for editing
    for (let i = -7; i <= diasAdelante; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      list.push({ key, label: etiquetaDia(d, hoy), date: d });
    }
    return list;
  }, [hoy, diasAdelante]);

  const horas = useMemo(
    () =>
      Array.from({ length: 24 }, (_, h) => ({
        key: pad(h),
        label: pad(h),
      })),
    [],
  );

  const minutos = useMemo(
    () =>
      [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
        key: pad(m),
        label: pad(m),
      })),
    [],
  );

  const [hh, mmRaw] = (hora || "10:00").split(":");
  const mm = pad(Math.round(Number(mmRaw || 0) / 5) * 5 % 60);

  let dayIndex = dias.findIndex((d) => d.key === fecha);
  if (dayIndex < 0) dayIndex = dias.findIndex((d) => d.key === dias[7]?.key) || 7;
  const hourIndex = Math.max(0, horas.findIndex((h) => h.key === pad(Number(hh))));
  let minIndex = minutos.findIndex((m) => m.key === mm);
  if (minIndex < 0) minIndex = 0;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Fecha y hora</p>
      <div className="flex gap-1 rounded-[var(--radius)] border border-border bg-card px-1 py-2">
        <WheelColumn
          ariaLabel="Día"
          items={dias}
          selectedIndex={dayIndex}
          onSelect={(i) => onChange(dias[i].key, `${pad(Number(hh))}:${mm}`)}
        />
        <WheelColumn
          ariaLabel="Hora"
          items={horas}
          selectedIndex={hourIndex}
          onSelect={(i) =>
            onChange(fecha || dias[dayIndex]?.key, `${horas[i].key}:${mm}`)
          }
        />
        <WheelColumn
          ariaLabel="Minuto"
          items={minutos}
          selectedIndex={minIndex}
          onSelect={(i) =>
            onChange(
              fecha || dias[dayIndex]?.key,
              `${pad(Number(hh))}:${minutos[i].key}`,
            )
          }
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {fecha} · {hora}
      </p>
    </div>
  );
}
