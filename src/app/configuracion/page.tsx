"use client";

import { FormEvent, useEffect, useState } from "react";
import { notificarCambioTema } from "@/components/providers/theme-events";

type Configuracion = {
  logoUrl: string | null;
  nombreMostrar: string | null;
  telefono: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tema: string;
  colorPrincipal: string;
};

export default function ConfiguracionPage() {

  const [configuracion, setConfiguracion] =
    useState<Configuracion>({
      logoUrl: "",
      nombreMostrar: "",
      telefono: "",
      whatsapp: "",
      instagram: "",
      tema: "dark",
      colorPrincipal: "#D4AF37",
    });


  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [subiendoLogo, setSubiendoLogo] =
    useState(false);




  useEffect(() => {
    cargar();
  }, []);


  async function cargar() {

    const respuesta =
      await fetch("/api/configuracion");

    const datos =
      await respuesta.json();

    if (datos) {
      setConfiguracion(datos);
    }

  }


  function actualizar(
    campo: keyof Configuracion,
    valor: string
  ) {

    const nuevaConfiguracion = {
      ...configuracion,
      [campo]: valor,
    };

    setConfiguracion(nuevaConfiguracion);

    if (
      campo === "tema" ||
      campo === "colorPrincipal"
    ) {
      notificarCambioTema({
        tema: nuevaConfiguracion.tema,
        colorPrincipal:
          nuevaConfiguracion.colorPrincipal,
      });
    }

  }


  function vistaPrevia() {

    notificarCambioTema({
      tema: configuracion.tema,
      colorPrincipal: configuracion.colorPrincipal,
    });

  }



  async function subirLogo(
    archivo: File
  ) {

    try {

      setSubiendoLogo(true);

      const datos =
        new FormData();

      datos.append(
        "archivo",
        archivo
      );


      const respuesta =
        await fetch(
          "/api/upload",
          {
            method: "POST",
            body: datos,
          }
        );


      const resultado =
        await respuesta.json();


      if (!respuesta.ok) {

        throw new Error(
          resultado.error ||
          "No se pudo subir la imagen."
        );

      }


      actualizar(
        "logoUrl",
        resultado.url
      );


    } catch(error){

      console.error(error);

      setMensaje(
        error instanceof Error
        ? error.message
        : "Error subiendo logo."
      );

    } finally {

      setSubiendoLogo(false);

    }

  }





  async function guardar(
    event: FormEvent
  ) {

    event.preventDefault();

    setGuardando(true);
    setMensaje("");

    const respuesta =
      await fetch(
        "/api/configuracion",
        {
          method:"PATCH",
          headers:{
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(configuracion),
        }
      );


    if(respuesta.ok){

      notificarCambioTema({
        tema: configuracion.tema,
        colorPrincipal:
          configuracion.colorPrincipal,
      });

      setMensaje(
        "Configuración guardada."
      );

    }


    setGuardando(false);

  }


  return (

    <main className="min-h-screen bg-muted/40 p-6">

      <div className="mx-auto max-w-5xl space-y-6">


        <header>

          <h1 className="text-3xl font-bold">
            Configuración
          </h1>

          <p className="text-muted-foreground">
            Personaliza la identidad visual de tu estudio.
          </p>

        </header>



        <form
          onSubmit={guardar}
          className="grid gap-6 md:grid-cols-2"
        >



          <section className="rounded-xl border bg-background p-6 space-y-5">

            <h2 className="text-xl font-semibold">
              🏢 Identidad del estudio
            </h2>


            <div className="flex items-center gap-4">

              {configuracion.logoUrl ? (

                <img
                  src={configuracion.logoUrl}
                  className="h-20 w-20 rounded-xl object-cover border"
                />

              ) : (

                <div className="flex h-20 w-20 items-center justify-center rounded-xl border text-3xl">
                  🎨
                </div>

              )}


              <div className="space-y-2">

                <label className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-muted">

                  {
                    subiendoLogo
                    ? "Subiendo..."
                    : "Seleccionar logo"
                  }

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e)=>{

                      const archivo =
                        e.target.files?.[0];

                      if(archivo){
                        subirLogo(archivo);
                      }

                    }}
                  />

                </label>

              </div>

            </div>


            {[
              ["nombreMostrar","Nombre del estudio"],
              ["telefono","Teléfono"],
              ["whatsapp","WhatsApp"],
              ["instagram","Instagram"],
            ].map(([campo,label]) => (

              <div key={campo}>

                <label className="text-sm font-medium">
                  {label}
                </label>

                <input
                  value={
                    configuracion[
                      campo as keyof Configuracion
                    ] ?? ""
                  }
                  onChange={(e)=>
                    actualizar(
                      campo as keyof Configuracion,
                      e.target.value
                    )
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />

              </div>

            ))}


          </section>




          <section className="rounded-xl border bg-background p-6 space-y-5">

            <h2 className="text-xl font-semibold">
              🎨 Apariencia
            </h2>


            <div>

              <label className="text-sm font-medium">
                Tema
              </label>


              <select
                value={configuracion.tema}
                onChange={(e)=>
                  actualizar(
                    "tema",
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >

                <option value="dark">
                  Oscuro
                </option>

                <option value="light">
                  Claro
                </option>

              </select>

            </div>



            <div>

              <label className="text-sm font-medium">
                Color principal
              </label>


              <input
                type="color"
                value={
                  configuracion.colorPrincipal
                }
                onChange={(e)=>
                  actualizar(
                    "colorPrincipal",
                    e.target.value
                  )
                }
                className="mt-2 h-16 w-full cursor-pointer rounded-lg border"
              />

            </div>



            <div className="rounded-xl border p-4">

              <p className="text-sm text-muted-foreground">
                Vista previa
              </p>


              <button
                type="button"
                onClick={vistaPrevia}
                className="mt-3 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
              >
                Aplicar vista previa
              </button>

            </div>


          </section>



          <div className="md:col-span-2">

            <button
              disabled={guardando}
              className="rounded-lg bg-primary px-6 py-3 text-primary-foreground"
            >

              {
                guardando
                ? "Guardando..."
                : "Guardar configuración"
              }

            </button>


            {mensaje && (
              <p className="mt-3 text-sm">
                {mensaje}
              </p>
            )}

          </div>


        </form>


      </div>

    </main>

  );

}
