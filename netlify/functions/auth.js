// netlify/functions/auth.js

export async function handler(event) {
  try {
    const { clave } = JSON.parse(event.body || "{}");

    // 🔐 Cambia esta clave a la que desees usar (solo aquí, nunca en el HTML)
    const CLAVE_CORRECTA = "SARA2025";

    if (clave === CLAVE_CORRECTA) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false }),
      };
    }
  } catch (e) {
    console.error("Error en función auth:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Error interno" }),
    };
  }
}
