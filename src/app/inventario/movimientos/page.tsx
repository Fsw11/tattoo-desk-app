"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type Inventario = {
  id: number;
  nombre: string;
  cantidad: string | number;
  unidad: string | null;
};

type Movimiento = {
  id: number;
  tipo: string;
  cantidad: string | number;
  motivo: string | null;
  fecha: string;

  inventario: {
    nombre: string;
    unidad: string | null;
  };

  usuario?: {
    nombre: string;
  } | null;
};


export default function MovimientosInventarioPage() {

  const [inventario, setInventario] =
    useState<Inventario[]>([]);

  const [movimientos, setMovimientos] =
    useState<Movimiento[]>([]);


  const [inventarioId, setInventarioId] =
    useState("");

  const [tipo, setTipo] =
    useState("ENTRADA");

  const [cantidad, setCantidad] =
    useState("");

  const [motivo, setMotivo] =
    useState("");


  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");



  async function cargarDatos() {

    try {

      setCargando(true);
      setError("");

      const [
        respuestaInventario,
        respuestaMovimientos,
      ] = await Promise.all([

        fetch("/api/inventario"),

        fetch(
          "/api/movimientos-inventario"
        ),

      ]);


      const inventarioData =
        await respuestaInventario.json();


      const movimientosData =
        await respuestaMovimientos.json();


      if (!respuestaInventario.ok) {
        throw new Error(
          "Error al cargar inventario"
        );
      }


      if (!respuestaMovimientos.ok) {
        throw new Error(
          "Error al cargar movimientos"
        );
      }


      setInventario(
        inventarioData
      );


      setMovimientos(
        movimientosData
      );


    } catch (error) {

      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar datos"
      );


    } finally {

      setCargando(false);

    }

  }



  useEffect(() => {

    cargarDatos();

  }, []);




  async function crearMovimiento(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    try {

      setGuardando(true);
      setError("");


      const respuesta =
        await fetch(
          "/api/movimientos-inventario",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              inventarioId:
                Number(inventarioId),

              tipo,

              cantidad,

              motivo,

            }),

          }
        );


      const datos =
        await respuesta.json();



      if (!respuesta.ok) {

        throw new Error(
          datos.error ||
          "No se pudo guardar"
        );

      }


      setCantidad("");
      setMotivo("");

      await cargarDatos();



    } catch (error) {

      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al guardar movimiento"
      );


    } finally {

      setGuardando(false);

    }

  }



  function formatoFecha(
    fecha: string
  ) {

    return new Date(
      fecha
    ).toLocaleDateString(
      "es-MX"
    );

  }
    return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">


        <header>
          <p className="text-sm text-muted-foreground">
            Control de materiales
          </p>

          <h1 className="text-3xl font-bold">
            Movimientos de inventario
          </h1>
        </header>



        <section className="rounded-xl border bg-background p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Registrar movimiento
          </h2>


          <form
            onSubmit={crearMovimiento}
            className="space-y-5"
          >


            <div className="grid gap-4 md:grid-cols-2">


              <select
                value={inventarioId}
                onChange={(e) =>
                  setInventarioId(
                    e.target.value
                  )
                }
                className="rounded-lg border px-3 py-2"
                required
              >

                <option value="">
                  Seleccionar material
                </option>


                {inventario.map(
                  (item) => (

                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.nombre}
                      {" "}
                      (
                      {item.cantidad}
                      {item.unidad
                        ? ` ${item.unidad}`
                        : ""}
                      )
                    </option>

                  )
                )}

              </select>




              <select
                value={tipo}
                onChange={(e) =>
                  setTipo(
                    e.target.value
                  )
                }
                className="rounded-lg border px-3 py-2"
              >

                <option value="ENTRADA">
                  Entrada
                </option>

                <option value="SALIDA">
                  Salida
                </option>

              </select>



              <input
                type="number"
                placeholder="Cantidad"
                value={cantidad}
                onChange={(e) =>
                  setCantidad(
                    e.target.value
                  )
                }
                className="rounded-lg border px-3 py-2"
                required
              />


              <input
                placeholder="Motivo"
                value={motivo}
                onChange={(e) =>
                  setMotivo(
                    e.target.value
                  )
                }
                className="rounded-lg border px-3 py-2"
              />

            </div>



            {error && (

              <div className="rounded-lg bg-red-50 p-3 text-red-700">

                {error}

              </div>

            )}



            <button
              disabled={guardando}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >

              {guardando
                ? "Guardando..."
                : "Guardar movimiento"}

            </button>


          </form>

        </section>





        <section className="rounded-xl border bg-background">

          {cargando ? (

            <div className="p-6">
              Cargando movimientos...
            </div>


          ) : movimientos.length === 0 ? (

            <div className="p-6 text-muted-foreground">
              No hay movimientos registrados.
            </div>


          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">


                <thead>

                  <tr className="border-b text-left text-sm">

                    <th className="px-5 py-3">
                      Fecha
                    </th>

                    <th className="px-5 py-3">
                      Material
                    </th>

                    <th className="px-5 py-3">
                      Tipo
                    </th>

                    <th className="px-5 py-3">
                      Cantidad
                    </th>

                    <th className="px-5 py-3">
                      Motivo
                    </th>

                  </tr>

                </thead>



                <tbody>


                  {movimientos.map(
                    (movimiento) => (

                      <tr
                        key={
                          movimiento.id
                        }
                        className="border-b"
                      >

                        <td className="px-5 py-4">
                          {
                            formatoFecha(
                              movimiento.fecha
                            )
                          }
                        </td>


                        <td className="px-5 py-4 font-medium">

                          {
                            movimiento
                              .inventario
                              .nombre
                          }

                        </td>



                        <td className="px-5 py-4">

                          {movimiento.tipo ===
                          "ENTRADA" ? (
                            <span>
                              Entrada
                            </span>
                          ) : (
                            <span>
                              Salida
                            </span>
                          )}

                        </td>



                        <td className="px-5 py-4">

                          {
                            movimiento.cantidad
                          }

                          {" "}

                          {
                            movimiento
                              .inventario
                              .unidad || ""
                          }

                        </td>



                        <td className="px-5 py-4">

                          {
                            movimiento.motivo ||
                            "—"
                          }

                        </td>


                      </tr>

                    )
                  )}


                </tbody>


              </table>

            </div>

          )}


        </section>


      </div>
    </main>
  );
}
