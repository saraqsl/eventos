// netlify/functions/auth.js

export async function handler(event, context) {
  const CLAVE_CORRECTA = process.env.CLAVE_SECRETA; // ✅ ahora se toma del entorno seguro

  const { clave } = JSON.parse(event.body || "{}");

  if (clave === CLAVE_CORRECTA) {
    return {
      statusCode: 200,
      body: JSON.stringify({ autorizado: true }),
    };
  } else {
    return {
      statusCode: 401,
      body: JSON.stringify({ autorizado: false }),
    };
  }
}
