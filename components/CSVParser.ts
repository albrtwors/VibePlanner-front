// utils/csvParticipantsParser.ts
import Papa from "papaparse";

export interface ParsedCsvItem {
    item: string;
    quantity: number;
}

export interface ParsedCsvMember {
    name: string;
    email: string;
    monetaryContribution: number;
    logisticsToBring: ParsedCsvItem[];
}

export interface ParsedCsvBlock {
    type: "individual" | "group";
    displayName: string;
    contactEmail: string;
    monetaryContribution: number;
    logisticsToBring: ParsedCsvItem[];
    members: ParsedCsvMember[];
}

export type CsvFieldKey = "nombre" | "email" | "grupo" | "aporte" | "aporte_grupal" | "insumos";

// Sinónimos conocidos por campo canónico. Si el header del CSV no calza con
// ninguno de estos, ahí recién vale la pena pedirle ayuda a la IA (y solo con
// los NOMBRES de columna, nunca con los datos de la gente).
const CANONICAL_ALIASES: Record<CsvFieldKey, string[]> = {
    nombre: ["nombre", "name", "participante", "nombre completo", "full name", "asistente"],
    email: ["email", "correo", "correo electronico", "mail", "e-mail"],
    grupo: ["grupo", "group", "equipo", "mesa", "colectivo", "familia"],
    aporte: ["aporte", "contribucion", "monto", "aporte individual", "monetary contribution", "pago"],
    aporte_grupal: ["aporte_grupal", "fondo grupal", "aporte grupo", "fondo del grupo", "group fund", "fondo"],
    insumos: ["insumos", "items", "logistica", "recursos", "logistics", "que trae"],
};

function normalizeHeader(h: string): string {
    return h
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/** Intenta mapear cada campo canónico a un header real del CSV, sin usar IA. */
export function detectColumnMapping(headers: string[]): Record<CsvFieldKey, string> {
    const normalizedHeaders = headers.map((h) => ({ original: h, norm: normalizeHeader(h) }));
    const mapping = {} as Record<CsvFieldKey, string>;

    (Object.keys(CANONICAL_ALIASES) as CsvFieldKey[]).forEach((canonical) => {
        const aliasesNorm = CANONICAL_ALIASES[canonical].map(normalizeHeader);
        const found = normalizedHeaders.find((h) => aliasesNorm.includes(h.norm));
        mapping[canonical] = found ? found.original : "";
    });

    return mapping;
}

/** "sillas:2;hielo:1" -> [{item:'sillas',quantity:2},{item:'hielo',quantity:1}] */
function parseInsumos(raw: string | undefined): ParsedCsvItem[] {
    if (!raw || !raw.trim()) return [];
    return raw
        .split(/[;,]/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => {
            const [itemPart, qtyPart] = chunk.split(":").map((p) => p?.trim());
            const quantity = qtyPart ? parseInt(qtyPart, 10) || 1 : 1;
            return { item: itemPart || chunk, quantity };
        });
}

/** Convierte filas crudas del CSV + mapeo de columnas -> bloques listos para el formulario. */
export function csvRowsToBlocks(
    rows: Record<string, string>[],
    mapping: Record<CsvFieldKey, string>
): ParsedCsvBlock[] {
    const groupsByKey = new Map<string, ParsedCsvBlock>();
    const individuals: ParsedCsvBlock[] = [];

    for (const row of rows) {
        const nombre = (mapping.nombre ? row[mapping.nombre] : "")?.trim();
        if (!nombre) continue; // fila sin nombre = la saltamos, no inventamos gente

        const email = (mapping.email ? row[mapping.email] : "")?.trim() || "";
        const grupoRaw = (mapping.grupo ? row[mapping.grupo] : "")?.trim() || "";
        const aporte = mapping.aporte ? parseFloat(row[mapping.aporte]) || 0 : 0;
        const aporteGrupal = mapping.aporte_grupal ? parseFloat(row[mapping.aporte_grupal]) || 0 : 0;
        const insumos = parseInsumos(mapping.insumos ? row[mapping.insumos] : undefined);

        if (grupoRaw) {
            const key = normalizeHeader(grupoRaw);
            let grupo = groupsByKey.get(key);
            if (!grupo) {
                grupo = {
                    type: "group",
                    displayName: grupoRaw,
                    contactEmail: "",
                    monetaryContribution: 0,
                    logisticsToBring: [{ item: "", quantity: 1 }],
                    members: [],
                };
                groupsByKey.set(key, grupo);
            }
            if (aporteGrupal > 0 && grupo.monetaryContribution === 0) {
                grupo.monetaryContribution = aporteGrupal;
            }
            grupo.members.push({
                name: nombre,
                email,
                monetaryContribution: aporte,
                logisticsToBring: insumos.length > 0 ? insumos : [{ item: "", quantity: 1 }],
            });
        } else {
            individuals.push({
                type: "individual",
                displayName: nombre,
                contactEmail: email,
                monetaryContribution: aporte,
                logisticsToBring: insumos.length > 0 ? insumos : [{ item: "", quantity: 1 }],
                members: [],
            });
        }
    }

    return [...Array.from(groupsByKey.values()), ...individuals];
}

/** Lee el archivo y devuelve las filas crudas + headers, sin interpretar nada todavía. */
export function parseParticipantsCsvRaw(file: File): Promise<{ rows: Record<string, string>[]; headers: string[] }> {
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve({ rows: results.data, headers: results.meta.fields || [] });
            },
            error: (err) => reject(err),
        });
    });
}

/** Genera y descarga un CSV de ejemplo con el formato esperado. */
export function downloadCsvTemplate() {
    const contenido =
        "nombre,email,grupo,aporte,aporte_grupal,insumos\n" +
        "Juan Pérez,juan@correo.com,,50000,,sillas:2;hielo:1\n" +
        "María Gómez,,Mesa 3,20000,100000,mesa:1\n" +
        "Luis Torres,,Mesa 3,15000,,\n";

    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "plantilla_participantes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}