// --- CONFIGURACIÓN CON TU DIRECCIÓN WEB REAL ---
const API_URL = "https://script.google.com/macros/s/AKfycbwH1ix0sHFy571J_j-QODBMJYBZtY4XIN_SWrQqopVlU6qSUe1wW1iiiEIqWmdMWyqQ0Q/exec"; 
const IMG_DIPLOMA = "diploma_malvinas.png";

const MAPA_QSLS = {
    "LU1ENM": "qsl1.png", "LU1BCP": "qsl1.png", "LU1CBQ": "qsl1.png", 
    "LU3AFJ": "qsl1.png", "LU4EGP": "qsl1.png", "LU4XYL": "qsl1.png",
    "LU5DU": "qsl1.png",  "LU6EWR": "qsl1.png", "LU9FWM": "qsl1.png",
    "LW1DPS": "qsl1.png", "LW3DQF": "qsl1.png", "LU3WGO": "qsl1.png",
    "LW6DIV": "qsl1.png", "LW9DTR": "qsl1.png", "LU1DAS": "qsl1.png", 
    "LU1WA": "qsl1.png",  "LU2AWJ": "qsl1.png", "LU2DWR": "qsl1.png", 
    "LU9MAH": "qsl1.png"
};
const QSL_POR_DEFECTO = "qsl1.png"; 

let canvasesGenerados = [];
let certNumberAsignado = "";

async function verQSL() {
    const sd = document.getElementById('sdVisitante').value.trim().toUpperCase();
    if (!sd) return alert("Ingrese su señal");

    const container = document.getElementById('qslContainer');
    container.innerHTML = "Escaneando el horizonte...";
    document.getElementById('panelProgreso').style.display = 'none';
    document.getElementById('accionesDescarga').style.display = 'none';
    canvasesGenerados = [];
    certNumberAsignado = "";

    try {
        const res = await fetch(API_URL);
        const allData = await res.json();
        container.innerHTML = "";

        // Filtrar todos los contactos de la señal ingresada
        let misContactos = allData.filter(c => c.call && c.call.toUpperCase() === sd);
        
        if (misContactos.length === 0) {
            container.innerHTML = "No se encontraron contactos para " + sd;
        } else {
            const conCert = misContactos.find(c => c.certNumber);
            if (conCert) certNumberAsignado = conCert.certNumber;

            // Registrar las estaciones distintas (dueños/activadores)
            const estacionesDistintas = new Set(misContactos.map(c => c.owner.toUpperCase()));

            // Renderizar una QSL independiente por cada QSO individual
            for (let i = 0; i < misContactos.length; i++) {
                const contacto = misContactos[i];
                const activador = contacto.owner.toUpperCase();
                const rutaImagen = MAPA_QSLS[activador] || QSL_POR_DEFECTO;
                await generarQSL(activador, contacto, rutaImagen, i + 1);
            }

            // Regla: 5 estaciones distintas + la obligatoria LU2CN (Total mínimo de 6)
            const tieneObligatoria = estacionesDistintas.has("LU2CN");
            const totalEstaciones = estacionesDistintas.size;
            const calificaDiploma = tieneObligatoria && totalEstaciones >= 6;

            mostrarProgreso(estacionesDistintas, calificaDiploma, sd);
            document.getElementById('accionesDescarga').style.display = 'flex';
        }
    } catch (err) {
        container.innerHTML = "Error al conectar con el servidor o procesar los datos.";
        console.error(err);
    }
}

function mostrarProgreso(estacionesSet, calificaDiploma, visitante) {
    const panel = document.getElementById('panelProgreso');
    panel.style.display = 'block';
    
    const listaEstaciones = Array.from(estacionesSet).join(", ");
    const tieneLu2cn = estacionesSet.has("LU2CN") ? "✅ Contactada" : "❌ Falta LU2CN (Obligatoria)";

    document.getElementById('estadisticas').innerHTML = `
        <p>Estaciones válidas logradas: ${estacionesSet.size}<br>
        <small>(${listaEstaciones})</small><br>
        Estación Obligatoria LU2CN: ${tieneLu2cn}</p>
    `;

    const mensaje = document.getElementById('mensajeDiploma');
    if (calificaDiploma) {
        mensaje.innerHTML = `
            <br>⭐ <strong>¡DIPLOMA DISPONIBLE!</strong><br>
            <small>Cumple con las 5 estaciones + la obligatoria (Total: ${estacionesSet.size} estaciones)</small><br>
            <input type="text" id="nombreOperador" class="input-nombre" placeholder="Nombre y Apellido">
            <button onclick="prepararDiploma('${visitante}')" style="background:#d4af37; color:#000;">🏆 GENERAR DIPLOMA</button>
                `;
    } else {
        let faltantesTexto = "";
        if (!estacionesSet.has("LU2CN")) {
            faltantesTexto += "- Contactar obligatoriamente a LU2CN.<br>";
        }
        if (estacionesSet.size < 6) {
            faltantesTexto += `- Sumar ${6 - estacionesSet.size} estación(es) distinta(s) más para alcanzar las 6 requeridas.`;
        }
        mensaje.innerHTML = `<br><span style="color:#ffc107;">Requisitos pendientes para el diploma:</span><br>${faltantesTexto}`;
    }
}

async function generarQSL(activador, contacto, rutaImagen, index) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 420;
        canvas.style.maxWidth = "400px"; canvas.style.width = "100%";

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = rutaImagen;
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(60, 200); ctx.rotate(-Math.PI / 2);
            ctx.font = 'bold 45px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = "#fcfafb";
            ctx.fillText(activador, 0, 0); ctx.restore();

            ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#fcfafb'; ctx.textAlign = 'center';
            ctx.fillText(`QSO con ${contacto.call} | Fecha: ${contacto.date || ''}`, 350, 355);
            ctx.fillText(`${contacto.time || ''} UTC | ${contacto.band || ''} | ${contacto.mode || ''} | ${contacto.rst || ''}`, 350, 385);

            const card = document.createElement('div');
            card.className = 'qslCard';
            card.appendChild(canvas);
            
            const btn = document.createElement('button');
            btn.textContent = "⬇️ DESCARGAR QSL";
            btn.onclick = () => descargarIndividual(canvas, `${activador}_QSO_${index}`, contacto.call);
            card.appendChild(btn);
            
            document.getElementById('qslContainer').appendChild(card);
            canvasesGenerados.push({canvas, name: `QSL_${activador}_QSO_${index}_${contacto.call}`});
            resolve();
        };
        img.onerror = () => { resolve(); };
    });
}

function descargarIndividual(canvas, activador, visitante) {
    const link = document.createElement('a');
    link.download = `QSL_${activador}_${visitante}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function descargarTodas() {
    if (canvasesGenerados.length === 0) return alert("No hay imágenes para descargar.");
    const zip = new JSZip();
    canvasesGenerados.forEach(item => {
        const dataUrl = item.canvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
        zip.file(`${item.name}.png`, base64Data, {base64: true});
    });
    zip.generateAsync({type: "blob"}).then(function(content) {
        saveAs(content, "todas_las_qsls.zip");
    });
}

function prepararDiploma(visitante) {
    const nombre = document.getElementById('nombreOperador').value.trim();
    if (!nombre) return alert("Por favor, ingresá tu nombre y apellido para el diploma.");
    alert(`¡Excelente ${nombre}! El diploma para ${visitante} se procesará con el número de certificado: ${certNumberAsignado || 'S/N'}`);
}
