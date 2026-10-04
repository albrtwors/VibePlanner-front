// utils/songParser.ts
import { isChordToken } from "@/utils/chords";

interface SongPart {
    title: string;
    content: string;
}

interface ParsedStructure {
    parts: SongPart[];
}

// Un marcador de sección ocupa la línea entera: [CORO], [Verso 1], [Puente].
const SECTION_LINE_RE = /^\s*\[([^\]]+)\]\s*$/;

/**
 * Devuelve el título de la sección si la línea es un marcador, o null si es
 * contenido normal.
 *
 * Clave: los acordes inline también usan corchetes ([Am], [C], [F#sus4]). Un
 * [Am] suelto tiene que ser una fila de acordes, no una sección "am". Si no
 * validáramos el acorde, cualquier letra con acordes se partiría en secciones
 * basura y la transposición no tendría dónde trabajar.
 */
function sectionTitle(line: string): string | null {
    const match = line.match(SECTION_LINE_RE);
    if (!match) return null;

    const tag = match[1].trim();
    if (!tag) return null;
    if (isChordToken(tag)) return null;

    return tag.toLowerCase();
}

/**
 * Convierte el texto plano con etiquetas tipo [CORO] o [VERSO] al formato JSON
 * estructurado que requiere la base. Los acordes inline [Am] se conservan
 * dentro del content de cada parte.
 */
export function parseRawTextToStructure(rawText: string): ParsedStructure {
    if (!rawText.trim()) return { parts: [] };

    const parts: SongPart[] = [];
    let currentTitle: string | null = null;
    let buffer: string[] = [];

    const pushBlock = (title: string) => {
        parts.push({ title, content: buffer.join("\n").trim() });
        buffer = [];
    };

    for (const line of rawText.split("\n")) {
        const title = sectionTitle(line);

        if (title !== null) {
            // Cerramos el bloque anterior; si había texto suelto antes de la
            // primera sección, no se pierde: cae en un "verso 1".
            if (buffer.some((l) => l.trim() !== "")) {
                pushBlock(currentTitle ?? "verso 1");
            } else {
                buffer = [];
            }
            currentTitle = title;
        } else {
            buffer.push(line);
        }
    }

    if (currentTitle !== null) {
        pushBlock(currentTitle);
    } else if (buffer.some((l) => l.trim() !== "")) {
        pushBlock("verso 1");
    }

    return { parts };
}
