"use client";

import {
  ReactNode,
  useEffect,
} from "react";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  size = "md",
}: ModalProps) {

  useEffect(() => {
    if (!open) {
      return;
    }

    function manejarTecla(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      manejarTecla
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        manejarTecla
      );
    };
  }, [open, onClose]);


  if (!open) {
    return null;
  }


  const tamaños = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };


  function manejarFondo(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={manejarFondo}
      role="presentation"
    >

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full ${tamaños[size]} max-h-[90vh] overflow-y-auto rounded-2xl border bg-background shadow-2xl`}
      >

        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-6 py-4 backdrop-blur">

          <h2
            id="modal-title"
            className="text-xl font-bold"
          >
            {title}
          </h2>


          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded-lg border px-3 py-1.5 text-sm transition hover:bg-muted"
          >
            ✕
          </button>

        </div>


        <div className="p-6">
          {children}
        </div>

      </section>

    </div>
  );
}
