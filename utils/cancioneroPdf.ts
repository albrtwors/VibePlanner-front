// utils/cancioneroPdf.ts
import { jsPDF } from "jspdf";

export interface PdfSongPart {
    title: string;
    content: string;
}

export interface PdfSong {
    name: string;
    author?: string | null;
    genre?: string | null;
    key?: string | null;
    structure?: { parts?: PdfSongPart[] } | null;
}

export interface PdfOptions {
    fileName: string;
    tematica?: string | null;
    /** Se imprime arriba de la portada. Por defecto "VibePlanner". */
    brand?: string;
    /** Si viene, se agrega "Generado por <nombre>" al pie de la portada. */
    author?: string | null;
    includeIndex?: boolean;
    /** Estimación de canciones por página, solo usada como fallback. */
}

// Paleta: la misma que usa la app (slate/indigo).
const INDIGO: [number, number, number] = [99, 102, 241];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_600: [number, number, number] = [71, 85, 105];
const SLATE_400: [number, number, number] = [148, 163, 184];

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * Parte los acordes inline ([Am], [C]) del texto para poder imprimirlos
 * arriba de la sílaba, que es como se lee una letra con acordes.
 *
 * "Hoy [Am]necesito" -> [{ t: "Hoy " }, { chord: "Am", t: "necesito" }]
 */
function splitLine(line: string): Array<{ chord?: string; t: string }> {
    const out: Array<{ chord?: string; t: string }> = [];
    const re = /\[([^\]]+)\]/g;
    let last = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(line)) !== null) {
        if (match.index > last) out.push({ t: line.slice(last, match.index) });
        out.push({ chord: match[1].trim(), t: "" });
        last = match.index + match[0].length;
    }

    if (last < line.length) out.push({ t: line.slice(last) });
    if (out.length === 0) out.push({ t: line });

    return out;
}

function plainText(song: PdfSong): string {
    const parts = song.structure?.parts ?? [];
    return parts.map((p) => p.content).join("\n").trim();
}

function hasChords(song: PdfSong): boolean {
    return /\[[^\]]+\]/.test(plainText(song));
}

/**
 * Genera el PDF compilado del cancionero: portada, índice y las letras con
 * sus acordes. Todo en el navegador, el backend no toca el documento.
 */
export function buildCancioneroPdf(songs: PdfSong[], options: PdfOptions): jsPDF {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const brand = options.brand?.trim() || "VibePlanner";
    const includeIndex = options.includeIndex !== false;

    // ------------------------------------------------------------------
    // PORTADA
    // ------------------------------------------------------------------
    doc.setFillColor(...SLATE_900);
    doc.rect(0, 0, PAGE_W, 90, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(brand.toUpperCase(), PAGE_W / 2, 30, { align: "center" });

    doc.setFontSize(30);
    const titulo = doc.splitTextToSize(options.fileName, CONTENT_W);
    doc.text(titulo, PAGE_W / 2, 48, { align: "center" });

    if (options.tematica) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(13);
        doc.setTextColor(...SLATE_400);
        doc.text(doc.splitTextToSize(options.tematica, CONTENT_W), PAGE_W / 2, 78, {
            align: "center",
        });
    }

    doc.setTextColor(...SLATE_600);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${songs.length} canción${songs.length === 1 ? "" : "es"}`, PAGE_W / 2, 110, {
        align: "center",
    });

    if (options.author) {
        doc.setFontSize(9);
        doc.text(`Armado por ${options.author}`, PAGE_W / 2, 118, { align: "center" });
    }

    const hoy = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    doc.text(hoy, PAGE_W / 2, 126, { align: "center" });

    // ------------------------------------------------------------------
    // ÍNDICE
    // ------------------------------------------------------------------
    if (includeIndex && songs.length > 0) {
        doc.addPage();

        doc.setTextColor(...SLATE_900);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Índice", MARGIN, 30);

        doc.setDrawColor(...INDIGO);
        doc.setLineWidth(0.6);
        doc.line(MARGIN, 34, MARGIN + 18, 34);

        let y = 46;
        doc.setFontSize(11);

        songs.forEach((song, i) => {
            // Si no queda lugar, saltamos de página y seguimos la numeración.
            if (y > PAGE_H - 30) {
                doc.addPage();
                y = 30;
            }

            const numero = `${i + 1}.`;
            const nombre = doc.splitTextToSize(song.name, CONTENT_W - 40)[0] as string;

            doc.setFont("helvetica", "bold");
            doc.setTextColor(...SLATE_900);
            doc.text(numero, MARGIN, y);

            doc.setFont("helvetica", "normal");
            doc.text(nombre, MARGIN + 12, y);

            // Metadatos a la derecha, en gris y más chico.
            const meta = [song.author, song.key].filter(Boolean).join("  ·  ");
            if (meta) {
                doc.setFontSize(9);
                doc.setTextColor(...SLATE_400);
                doc.text(doc.splitTextToSize(meta, 70)[0] as string, PAGE_W - MARGIN, y, {
                    align: "right",
                });
                doc.setFontSize(11);
                doc.setTextColor(...SLATE_900);
            }

            // Línea punteada hasta el número de página solo si lo sabemos.
            y += 7;
        });
    }

    // ------------------------------------------------------------------
    // LETRAS
    // ------------------------------------------------------------------
    songs.forEach((song, i) => {
        doc.addPage();
        let y = 30;

        const asegurarEspacio = (alto: number) => {
            if (y + alto > PAGE_H - 22) {
                doc.addPage();
                y = 30;
            }
        };

        // -- encabezado de la canción
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...SLATE_900);
        const lineasTitulo = doc.splitTextToSize(song.name, CONTENT_W) as string[];
        doc.text(lineasTitulo, MARGIN, y);
        y += lineasTitulo.length * 7;

        const meta: string[] = [];
        if (song.author) meta.push(song.author);
        if (song.genre) meta.push(song.genre);
        if (song.key) meta.push(`Tono: ${song.key}`);

        if (meta.length) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(...SLATE_600);
            doc.text(meta.join("  ·  "), MARGIN, y + 1);
            y += 7;
        }

        // Línea de color bajo el título.
        doc.setDrawColor(...INDIGO);
        doc.setLineWidth(0.8);
        doc.line(MARGIN, y, MARGIN + 25, y);
        y += 10;

        // -- cuerpo
        const partes = song.structure?.parts ?? [];
        doc.setFontSize(10.5);

        if (partes.length === 0) {
            doc.setFont("helvetica", "italic");
            doc.setTextColor(...SLATE_400);
            doc.text("(Sin letra cargada)", MARGIN, y);
        }

        for (const parte of partes) {
            asegurarEspacio(16);

            // Nombre de sección (coro, verso 1...) en indigo.
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(...INDIGO);
            doc.text(parte.title.toUpperCase(), MARGIN, y);
            y += 5.5;
            doc.setFontSize(10.5);

            const conAcordes = /\[[^\]]+\]/.test(parte.content);
            const lineas = parte.content.split("\n");

            for (const linea of lineas) {
                if (!linea.trim()) {
                    y += 3;
                    continue;
                }

                asegurarEspacio(conAcordes ? 11 : 6);

                if (!conAcordes) {
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10.5);
                    doc.setTextColor(...SLATE_900);
                    for (const wrap of doc.splitTextToSize(linea, CONTENT_W) as string[]) {
                        asegurarEspacio(6);
                        doc.text(wrap, MARGIN, y);
                        y += 5.5;
                    }
                    continue;
                }

                // Con acordes: cada acorde se dibuja arriba de la silaba que
                // sigue, corrido segun el ancho del texto que lo precede.
                const chunks = splitLine(linea);
                const letra = chunks.map((c) => c.t).join("") || " ";

                doc.setFont("helvetica", "normal");
                doc.setFontSize(10.5);
                doc.setTextColor(...SLATE_900);

                // Guardamos la Y de la primera linea para colgar los acordes.
                asegurarEspacio(11);
                const yPrimeraLinea = y;

                // 1) Ubicacion de cada acorde, midiendo con la fuente de la letra.
                const posiciones: Array<{ x: number; chord: string }> = [];
                let x = MARGIN;
                for (const chunk of chunks) {
                    if (chunk.chord) {
                        posiciones.push({ x, chord: chunk.chord });
                    }
                    x += doc.getTextWidth(chunk.t);
                }

                // 2) Letra (puede ocupar varias lineas si es muy larga).
                for (const wrap of doc.splitTextToSize(letra, CONTENT_W) as string[]) {
                    asegurarEspacio(6);
                    doc.text(wrap, MARGIN, y);
                    y += 5.5;
                }

                // 3) Acordes arriba de la primera linea.
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8.5);
                doc.setTextColor(...INDIGO);
                for (const pos of posiciones) {
                    // Si el acorde se pasaria del margen, lo pegamos al borde.
                    const ancho = doc.getTextWidth(pos.chord);
                    const xFinal = Math.min(pos.x, PAGE_W - MARGIN - ancho);
                    doc.text(pos.chord, xFinal, yPrimeraLinea - 2.5);
                }

                doc.setFont("helvetica", "normal");
                doc.setFontSize(10.5);
                doc.setTextColor(...SLATE_900);
                y += 2.5; // aire entre renglones con acordes
            }

            y += 5; // aire entre secciones
        }

        // Número de canción al pie, discreto.
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_400);
        doc.text(`${i + 1} / ${songs.length}`, PAGE_W / 2, PAGE_H - 12, {
            align: "center",
        });
    });

    return doc;
}

/**
 * Genera y descarga el PDF del cancionero.
 * El nombre del archivo se sanea para que no rompa Windows ni el navegador.
 */
export function downloadCancioneroPdf(songs: PdfSong[], options: PdfOptions): void {
    if (songs.length === 0) {
        throw new Error("El cancionero no tiene canciones para exportar.");
    }

    const doc = buildCancioneroPdf(songs, options);
    const seguro = options.fileName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita acentos
        .replace(/[^a-zA-Z0-9]+/g, "-")   // guiones
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "cancionero";

    doc.save(`${seguro}.pdf`);
}

/** Devuelve true si alguna cancion trae acordes, para avisar en la UI. */
export function cancioneroTieneAcordes(songs: PdfSong[]): boolean {
    return songs.some(hasChords);
}