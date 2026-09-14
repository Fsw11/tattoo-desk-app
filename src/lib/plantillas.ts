export const PLANTILLA_CONSENTIMIENTO_DEFAULT = `Yo, el abajo firmante, declaro que la información de salud que proporcioné es veraz.

Autorizo al estudio a realizar el procedimiento de tatuaje / piercing descrito y confirmo que:

1. Entiendo los riesgos (infección, alergia, cicatrización irregular).
2. He informado alergias, enfermedades y medicamentos relevantes.
3. Soy mayor de edad o cuento con autorización de tutor.
4. Autorizo el uso de fotografías del trabajo con fines de portafolio del estudio, salvo que indique lo contrario por escrito.

Firma voluntaria y consciente.`;

export const PLANTILLA_RECORDATORIO_DEFAULT =
  "Hola {nombre}, te recordamos tu cita mañana a las {hora} en {estudio}. ¡Te esperamos!";

export function renderPlantilla(
  plantilla: string,
  vars: Record<string, string>,
) {
  return Object.entries(vars).reduce(
    (texto, [clave, valor]) =>
      texto.replaceAll(`{${clave}}`, valor),
    plantilla,
  );
}

export function whatsappUrl(telefono: string, mensaje: string) {
  const digitos = telefono.replace(/\D/g, "");
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
}
