// utils/songParser.ts

interface SongPart {
    title: string;
    content: string;
}

interface ParsedStructure {
    parts: SongPart[];
}

/**
 * Convierte el texto plano con etiquetas tipo [CORO] o [VERSO]
 * al formato JSON estructurado que requiere la Base de Datos.
 */
export function parseRawTextToStructure(rawText: string): ParsedStructure {
    if (!rawText.trim()) return { parts: [] };

    // Regex para capturar bloques que inicien con [Nombre]
    const sectionRegex = /\[([^\]]+)\]/g;
    const parts: SongPart[] = [];

    const matches = [...rawText.matchAll(sectionRegex)];

    if (matches.length === 0) {
        // Si el usuario no usó corchetes, guardamos todo como un único verso por defecto
        parts.push({
            title: "verso 1",
            content: rawText.trim()
        });
        return { parts };
    }

    for (let i = 0; i < matches.length; i++) {
        const currentMatch = matches[i];
        const title = currentMatch[1].toLowerCase().trim();

        // El contenido empieza justo después del corchete de cierre del título actual
        const startIndex = currentMatch.index! + currentMatch[0].length;

        // Y termina donde empieza el próximo corchete (o al final de todo el texto)
        const endIndex = matches[i + 1] ? matches[i + 1].index : rawText.length;

        const content = rawText.substring(startIndex, endIndex).trim();

        parts.push({ title, content });
    }

    return { parts };
}