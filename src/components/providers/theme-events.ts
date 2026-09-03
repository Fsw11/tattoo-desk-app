export const EVENTO_TEMA_CAMBIADO =
  "tema-cambiado";


export function notificarCambioTema(
  configuracion: {
    tema?: string;
    colorPrincipal?: string;
  }
) {

  window.dispatchEvent(
    new CustomEvent(
      EVENTO_TEMA_CAMBIADO,
      {
        detail: configuracion,
      }
    )
  );

}
