// --- CONFIGURACIÓN CON TU DIRECCIÓN WEB REAL ---
const API_URL = "https://script.google.com/macros/s/AKfycbwH1ix0sHFy571J_j-QODBMJYBZtY4XIN_SWrQqopVlU6qSUe1wW1iiiEIqWmdMWyqQ0Q/exec";

const IMG_DIPLOMA = "diploma_malvinas.png";

const MAPA_QSLS = {
    "LU1ENM": "qsl1.png",
    "LU1BCP": "qsl2.png",
    "LU1CBQ": "qsl2.png",
    "LU3AFJ": "qsl2.png",
    "LU4EGP": "qsl2.png",
    "LU4XYL": "qsl2.png",
    "LU5DU": "qsl2.png",
    "LU6EWR": "qsl2.png",
    "LU9FWM": "qsl2.png",
    "LW1DPS": "qsl2.png",
    "LW3DQF": "qsl2.png",
    "LU3WGO": "qsl2.png",
    "LW6DIV": "qsl2.png",
    "LW9DTR": "qsl2.png",
    "LU1DAS": "qsl2.png",
    "LU1WA": "qsl2.png",
    "LU2AWJ": "qsl2.png",
    "LU2DWR": "qsl2.png",
    "LU9MAH": "qsl1.png",
    "LU2CN": "qsl1.png",
    "LU7WH": "qsl1.png",
    "LU9ESA": "qsl1.png"
};

const QSL_POR_DEFECTO = "qsl2.png";

let canvasesGenerados = [];
let certNumberAsignado = "";


// =====================================================
// BUSCAR CONTACTOS
// =====================================================

async function verQSL() {

    const sd = document
        .getElementById('sdVisitante')
        .value
        .trim()
        .toUpperCase();

    if (!sd) {
        return alert("Ingrese su señal");
    }

    const container = document.getElementById('qslContainer');

    container.innerHTML = "Escaneando el horizonte...";

    document.getElementById('panelProgreso').style.display = 'none';
    document.getElementById('accionesDescarga').style.display = 'none';

    canvasesGenerados = [];
    certNumberAsignado = "";

    try {

        // Traemos todos los contactos como funcionaba originalmente
        const res = await fetch(API_URL);

        if (!res.ok) {
            throw new Error("Error HTTP: " + res.status);
        }

        const allData = await res.json();

        container.innerHTML = "";

        // Filtrar SOLAMENTE los contactos de la señal ingresada
        const misContactos = allData.filter(c =>
            c.call &&
            String(c.call).trim().toUpperCase() === sd
        );

        if (misContactos.length === 0) {

            container.innerHTML =
                "No se encontraron contactos para " + sd;

            return;
        }


        // =====================================================
        // ESTACIONES DISTINTAS
        // =====================================================

        const estacionesDistintas = new Set(
            misContactos
                .filter(c => c.owner)
                .map(c => String(c.owner).trim().toUpperCase())
        );


        // =====================================================
        // GENERAR QSL
        // =====================================================

        for (let i = 0; i < misContactos.length; i++) {

            const contacto = misContactos[i];

            if (!contacto.owner) {
                continue;
            }

            const activador =
                String(contacto.owner).trim().toUpperCase();

            const rutaImagen =
                MAPA_QSLS[activador] || QSL_POR_DEFECTO;

            await generarQSL(
                activador,
                contacto,
                rutaImagen,
                i + 1
            );
        }


        // =====================================================
        // REQUISITOS DEL DIPLOMA
        // 5 estaciones + LU2CN obligatoria = mínimo 6
        // =====================================================

        const tieneObligatoria =
            estacionesDistintas.has("LU2CN");

        const totalEstaciones =
            estacionesDistintas.size;

        const calificaDiploma =
            tieneObligatoria &&
            totalEstaciones >= 6;


        mostrarProgreso(
            estacionesDistintas,
            calificaDiploma,
            sd
        );


        document
            .getElementById('accionesDescarga')
            .style.display = 'flex';


    } catch (err) {

        container.innerHTML =
            "Error al conectar con el servidor o procesar los datos.";

        console.error("ERROR:", err);
    }
}


// =====================================================
// MOSTRAR PROGRESO
// =====================================================

function mostrarProgreso(
    estacionesSet,
    calificaDiploma,
    visitante
) {

    const panel =
        document.getElementById('panelProgreso');

    panel.style.display = 'block';


    const listaEstaciones =
        Array.from(estacionesSet).join(", ");


    const tieneLu2cn =
        estacionesSet.has("LU2CN")
            ? "✅ Contactada"
            : "❌ Falta LU2CN (Obligatoria)";


    document
        .getElementById('estadisticas')
        .innerHTML = `

        <p>

        Estaciones válidas logradas:
        <strong>${estacionesSet.size}</strong>

        <br>

        <small>
        (${listaEstaciones})
        </small>

        <br><br>

        Estación Obligatoria LU2CN:
        ${tieneLu2cn}

        </p>

    `;


    const mensaje =
        document.getElementById('mensajeDiploma');


    if (calificaDiploma) {

        mensaje.innerHTML = `

            <br>

            ⭐
            <strong>
            ¡DIPLOMA DISPONIBLE!
            </strong>

            <br>

            <small>
            Cumple con las 5 estaciones +
            la obligatoria LU2CN
            (Total: ${estacionesSet.size} estaciones)
            </small>

            <br><br>

            <input
                type="text"
                id="nombreOperador"
                class="input-nombre"
                placeholder="Nombre y Apellido"
            >

            <br>

            <button
                onclick="prepararDiploma('${visitante}')"
                style="
                    background:#d4af37;
                    color:#000;
                "
            >

            🏆 GENERAR DIPLOMA

            </button>

        `;

    } else {

        let faltantesTexto = "";


        if (!estacionesSet.has("LU2CN")) {

            faltantesTexto +=
                "- Contactar obligatoriamente a LU2CN.<br>";
        }


        if (estacionesSet.size < 6) {

            faltantesTexto +=
                `- Sumar ${6 - estacionesSet.size} estación(es) distinta(s) más para alcanzar las 6 requeridas.`;
        }


        mensaje.innerHTML = `

            <br>

            <span style="color:#ffc107;">
            Requisitos pendientes para el diploma:
            </span>

            <br>

            ${faltantesTexto}

        `;
    }
}


// =====================================================
// GENERAR QSL
// =====================================================

async function generarQSL(
    activador,
    contacto,
    rutaImagen,
    index
) {

    return new Promise((resolve) => {

        const canvas =
            document.createElement('canvas');

        canvas.width = 600;
        canvas.height = 420;

        canvas.style.maxWidth = "400px";
        canvas.style.width = "100%";


        const ctx =
            canvas.getContext('2d');


        const img =
            new Image();

        img.src = rutaImagen;


        img.onload = () => {

            ctx.drawImage(
                img,
                0,
                0,
                canvas.width,
                canvas.height
            );


            // =====================================================
            // INDICATIVO DEL ACTIVADOR
            // =====================================================

            ctx.save();

            ctx.translate(60, 200);

            ctx.rotate(-Math.PI / 2);

            ctx.font =
                'bold 70px Arial';

            ctx.textAlign =
                'center';

            ctx.fillStyle =
                "#fcfafb";

            ctx.fillText(
                activador,
                0,
                0
            );

            ctx.restore();


            // =====================================================
            // DATOS DEL QSO
            // =====================================================

            ctx.font =
                'bold 16px Arial';

            ctx.fillStyle =
                '#fcfafb';

            ctx.textAlign =
                'center';


            ctx.fillText(
                `QSO con ${contacto.call} | Fecha: ${contacto.date || ''}`,
                350,
                385
            );


            ctx.fillText(
                `${contacto.time || ''} UTC | ${contacto.band || ''} | ${contacto.mode || ''} | ${contacto.rst || ''}`,
                350,
                415
            );


            // =====================================================
            // TARJETA
            // =====================================================

            const card =
                document.createElement('div');

            card.className =
                'qslCard';


            card.appendChild(canvas);


            // =====================================================
            // BOTÓN DESCARGAR QSL
            // =====================================================

            const btn =
                document.createElement('button');


            btn.textContent =
                "⬇️ DESCARGAR QSL";


            btn.onclick = () =>
                descargarIndividual(
                    canvas,
                    `${activador}_QSO_${index}`,
                    contacto.call
                );


            card.appendChild(btn);


            document
                .getElementById('qslContainer')
                .appendChild(card);


            canvasesGenerados.push({

                canvas: canvas,

                name:
                    `QSL_${activador}_QSO_${index}_${contacto.call}`
            });


            resolve();
        };


        img.onerror = () => {

            console.error(
                "No se pudo cargar:",
                rutaImagen
            );

            resolve();
        };

    });
}


// =====================================================
// DESCARGAR QSL INDIVIDUAL
// =====================================================

function descargarIndividual(
    canvas,
    activador,
    visitante
) {

    const link =
        document.createElement('a');


    link.download =
        `QSL_${activador}_${visitante}.png`;


    link.href =
        canvas.toDataURL('image/png');


    link.click();
}


// =====================================================
// DESCARGAR TODAS LAS QSL
// =====================================================

function descargarTodas() {

    if (
        canvasesGenerados.length === 0
    ) {

        return alert(
            "No hay imágenes para descargar."
        );
    }


    if (
        typeof JSZip === "undefined"
    ) {

        return alert(
            "La librería JSZip no está cargada en el HTML."
        );
    }


    if (
        typeof saveAs === "undefined"
    ) {

        return alert(
            "La librería FileSaver no está cargada en el HTML."
        );
    }


    const zip =
        new JSZip();


    canvasesGenerados.forEach(item => {

        const dataUrl =
            item.canvas.toDataURL('image/png');


        const base64Data =
            dataUrl.replace(
                /^data:image\/(png|jpg);base64,/,
                ""
            );


        zip.file(
            `${item.name}.png`,
            base64Data,
            {
                base64: true
            }
        );

    });


    zip.generateAsync({
        type: "blob"
    })
    .then(function(content) {

        saveAs(
            content,
            "todas_las_qsls.zip"
        );

    });
}


// =====================================================
// PREPARAR DIPLOMA
// =====================================================

function prepararDiploma(visitante) {

    const campoNombre =
        document.getElementById(
            "nombreOperador"
        );

    if (!campoNombre) {
        return alert(
            "No se encontró el campo del nombre."
        );
    }

    const nombre =
        campoNombre.value.trim();

    if (!nombre) {
        return alert(
            "Por favor, ingresá tu nombre y apellido para el diploma."
        );
    }

    generarDiploma(
        visitante,
        nombre
    );
}


// =====================================================
// GENERAR DIPLOMA
// =====================================================

function generarDiploma(
    visitante,
    nombre
) {

    const canvas =
        document.createElement('canvas');


    // Tamaño horizontal aproximado A4
    canvas.width = 1600;
    canvas.height = 1131;


    canvas.style.width =
        "100%";

    canvas.style.maxWidth =
        "900px";


    const ctx =
        canvas.getContext('2d');


    const img =
        new Image();


    img.src =
        IMG_DIPLOMA;


    img.onload = () => {


        // =====================================================
        // IMAGEN DE FONDO
        // =====================================================

        ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
        );


        // =====================================================
        // NOMBRE Y LICENCIA EN LA MISMA LÍNEA
        // =====================================================

        const centroY = 455;

        // NOMBRE
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.font = "bold 30px Arial";

        ctx.fillText(
            nombre.toUpperCase(),
            650,
            centroY
        );

        // LICENCIA
        ctx.fillStyle = "#003366";
        ctx.textAlign = "center";
        ctx.font = "bold 42px Arial";

        ctx.fillText(
            visitante.toUpperCase(),
            1000,
            centroY
        );


        // =====================================================
        // CREAR TARJETA DEL DIPLOMA
        // =====================================================

        const card =
            document.createElement('div');


        card.className =
            "qslCard";


        card.style.maxWidth =
            "950px";


        card.style.border =
            "3px solid #d4af37";


        // =====================================================
        // TÍTULO
        // =====================================================

        const titulo =
            document.createElement('h2');


        titulo.textContent =
            "🏆 DIPLOMA OBTENIDO";


        titulo.style.color =
            "#003366";


        card.appendChild(
            titulo
        );


        card.appendChild(
            canvas
        );


        // =====================================================
        // BOTÓN DESCARGAR DIPLOMA
        // =====================================================

        const btn =
            document.createElement('button');


        btn.textContent =
            "⬇️ DESCARGAR DIPLOMA";


        btn.style.background =
            "#d4af37";


        btn.style.color =
            "#000";


        btn.style.marginTop =
            "15px";


        btn.onclick = () => {

            const link =
                document.createElement('a');


            link.download =
                `Diploma_SARA_65_Aniversario_${visitante}.png`;


            link.href =
                canvas.toDataURL(
                    'image/png'
                );


            link.click();
        };


        card.appendChild(
            btn
        );


        // =====================================================
        // MOSTRAR DIPLOMA ARRIBA DE LAS QSL
        // =====================================================

        const container =
            document.getElementById(
                'qslContainer'
            );


        container.prepend(
            card
        );


        // =====================================================
        // BAJAR AUTOMÁTICAMENTE HASTA EL DIPLOMA
        // =====================================================

        card.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    };


    img.onerror = () => {

        alert(
            "No se pudo cargar la imagen del diploma: " +
            IMG_DIPLOMA
        );

        console.error(
            "Error cargando:",
            IMG_DIPLOMA
        );
    };
}
