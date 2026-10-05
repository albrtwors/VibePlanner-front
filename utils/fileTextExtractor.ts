// utils/fileTextExtractor.ts
"use client";

/**
 * Saca texto plano de un archivo en el navegador, para no depender de que el
 * backend tenga librerías de PDF/DOCX (y para que en Vercel no haya binarios
 * nativos). El backend igual tiene su propio respaldo y es el que corta las
 * canciones.
 *
 * - .txt  -> FileReader / TextDecoder
 * - .docx -> mammoth (extraHTMLBody false para quedarnos con el texto)
 * - .pdf  -> pdfjs-dist (worker como módulo, sin CDN)
 */

export const SUPPORTED_EXTENSIONS = ["txt", "pdf", "docx"] as const;
export const MAX_FILE_MB = 8;

export type ExtractResult = { text: string; engine: "txt" | "docx" | "pdf" };

export function fileExtension(filename: string): string {
    const parts = filename.toLowerCase().split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function isSupportedFile(filename: string): boolean {
    return (SUPPORTED_EXTENSIONS as readonly string[]).includes(fileExtension(filename));
}

/**
 * pdfjs-dist necesita su worker. En Next lo importamos como módulo para que
 * Turbopack/Webpack lo empaquete y no dependamos de un CDN externo.
 */
async function getPdfJs() {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs")).default;

    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjs;
}

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
    const pdfjs = await getPdfJs();
    const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const doc = await task.promise;

    const paginas: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const pagina = await doc.getPage(i);
        const contenido = await pagina.getTextContent();

        // pdfjs te da los pedacitos sueltos; los pegamos con espacios y respetamos
        // los saltos de línea que marca cada item.
        const texto = contenido.items
            .map((item) => {
                if (!("str" in item)) return "";
                const itemConBreak = item as { str: string; hasEOL?: boolean };
                return itemConBreak.str + (itemConBreak.hasEOL ? "\n" : " ");
            })
            .join("");

        paginas.push(texto);
    }

    // destroy() cuelga de la tarea de carga, no del documento.
    await task.destroy();

    return paginas
        .join("\n\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
    const mammoth = await import("mammoth");
    const resultado = await mammoth.extractRawText({ arrayBuffer: buffer });
    return (resultado.value || "").trim();
}

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
    const ext = fileExtension(file.name);

    if (!isSupportedFile(file.name)) {
        throw new Error(
            `No puedo leer archivos .${ext || "?"}. Subí un .txt, .pdf o .docx.`
        );
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
        throw new Error(`El archivo supera los ${MAX_FILE_MB} MB.`);
    }

    if (ext === "txt") {
        // TextDecoder con utf-8 y reemplazo: no rompe si viene en latin1.
        const buffer = await file.arrayBuffer();
        const texto = new TextDecoder("utf-8").decode(buffer).trim();
        if (!texto) throw new Error("El archivo está vacío.");
        return { text: texto, engine: "txt" };
    }

    const buffer = await file.arrayBuffer();

    if (ext === "pdf") {
        const texto = await extractPdf(buffer);
        if (!texto) {
            throw new Error(
                "El PDF no tiene texto seleccionable. Si es un escaneo, pasalo a texto y subilo de nuevo."
            );
        }
        return { text: texto, engine: "pdf" };
    }

    const texto = await extractDocx(buffer);
    if (!texto) throw new Error("El DOCX está vacío.");
    return { text: texto, engine: "docx" };
}