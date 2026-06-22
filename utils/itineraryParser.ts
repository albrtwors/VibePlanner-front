// utils/itineraryParser.ts

interface ItineraryBlock {
    time: string;
    type: "song" | "file" | "generic";
    id: number | null;
    name: string;
}

/**
 * Convierte el texto plano de un textarea en un JSON estructurado para el itinerario.
 * Formato esperado por línea: "HH:MM - Tipo: Nombre" o "HH:MM - Actividad Genérica"
 * Ejemplos:
 * 19:00 - Cancion: Creep
 * 19:30 - Repertorio: Setlist Rock Acustico
 * 20:00 - Palabras de bienvenida de los novios
 */
export function parseTextToItinerary(text: string): ItineraryBlock[] {
    if (!text.trim()) return [];

    const lines = text.split("\n");
    const itinerary: ItineraryBlock[] = [];

    // Regex para capturar la hora HH:MM y el resto de la línea
    const lineRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])\s*-\s*(.*)$/;

    lines.forEach((line) => {
        const cleanLine = line.strip ? (line as any).strip() : line.trim();
        if (!cleanLine) return;

        const match = cleanLine.match(lineRegex);
        if (match) {
            const time = `${match[1].padStart(2, "0")}:${match[2]}`;
            const content = match[3].trim();

            // Verificar si especifica un tipo integrado
            if (content.toLowerCase().startsWith("cancion:")) {
                const name = content.substring(8).trim();
                itinerary.push({ time, type: "song", id: null, name });
            } else if (content.toLowerCase().startsWith("repertorio:") || content.toLowerCase().startsWith("file:")) {
                const name = content.substring(11).trim();
                itinerary.push({ time, type: "file", id: null, name });
            } else {
                // Actividad genérica / Comida / Catering
                itinerary.push({ time, type: "generic", id: null, name: content });
            }
        }
    });

    return itinerary;
}