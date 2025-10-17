// netlify/functions/auth.js
export async function handler(event) {
  const body = JSON.parse(event.body || "{}");
  const inputClave = body.clave?.trim();
  const claveReal = process.env.AUTH_PASSWORD;

  if (!inputClave) {
    return { statusCode: 400, body: "Falta clave" };
  }

  if (inputClave === claveReal) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
      headers: { "Content-Type": "application/json" },
    };
  } else {
    return {
      statusCode: 401,
      body: JSON.stringify({ ok: false, msg: "Clave incorrecta" }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
