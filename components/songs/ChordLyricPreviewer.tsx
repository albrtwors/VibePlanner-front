"use client";

interface SongPart {
    title: string;
    content: string;
}

interface ChordLyricPreviewerProps {
    structure: {
        parts: SongPart[];
    };
    songName?: string;
    author?: string;
}

export default function ChordLyricPreviewer({ structure, songName, author }: ChordLyricPreviewerProps) {

    // Nueva lógica de parseo ultra precisa carácter por carácter
    const parseLineToSegments = (line: string) => {
        if (!line || line.trim() === "") return [{ chord: "", text: "\u00A0" }];

        const segments: Array<{ chord: string; text: string }> = [];
        let i = 0;
        let pendingChord = "";

        while (i < line.length) {
            // Si detectamos la apertura de un acorde con corchete
            if (line[i] === "[") {
                const closeIdx = line.indexOf("]", i);
                if (closeIdx !== -1) {
                    // Extraemos el acorde interno
                    pendingChord = line.substring(i + 1, closeIdx);
                    i = closeIdx + 1; // Saltamos después del corchete de cierre
                    continue;
                }
            }

            // Tomamos el carácter actual de la letra o espacio
            let char = line[i];
            // Si es un espacio físico de la barra espaciadora, lo convertimos en espacio duro
            // para obligar al navegador a renderizar su ancho real en el Flexbox
            if (char === " ") {
                char = "\u00A0";
            }

            segments.push({ chord: pendingChord, text: char });
            pendingChord = ""; // Consumimos el acorde asociándolo a este carácter
            i++;
        }

        // Si la línea terminó y quedó un acorde colgado al final sin letras abajo
        if (pendingChord) {
            segments.push({ chord: pendingChord, text: "\u00A0" });
        }

        return segments;
    };

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-6 text-slate-200 font-sans max-h-[80vh] overflow-y-auto select-none">
            {/* Cabecera */}
            <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1">
                    👀 Previsualización Americana en Vivo
                </span>
                <h2 className="text-lg font-black uppercase truncate text-slate-100">
                    {songName || "Título de la Canción"}
                </h2>
                {author && (
                    <p className="text-xs text-slate-400 font-bold tracking-tight mt-0.5">
                        por {author}
                    </p>
                )}
            </div>

            {/* Renderizado de Secciones */}
            <div className="flex flex-col gap-8">
                {structure.parts.map((part, partIdx) => (
                    <div key={partIdx} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 flex flex-col gap-5">
                        {/* Etiqueta */}
                        <div className="w-fit bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase text-indigo-400">
                            {part.title || "Estrofa"}
                        </div>

                        {/* Bloque Armónico con tipografía monoespaciada estricta */}
                        <div className="flex flex-col gap-8 font-mono text-sm tracking-wide">
                            {part.content.split("\n").map((line, lineIdx) => {
                                const segments = parseLineToSegments(line);

                                return (
                                    <div key={lineIdx} className="flex flex-wrap items-end">
                                        {segments.map((seg, segIdx) => (
                                            <div key={segIdx} className="flex flex-col justify-end text-center min-w-fit leading-none">
                                                {/* Celda Superior del Acorde */}
                                                <div className="h-5 flex items-center justify-start">
                                                    {seg.chord ? (
                                                        <span className="text-xs font-black text-emerald-400 tracking-normal select-none transform -translate-y-0.5">
                                                            {seg.chord}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs opacity-0 select-none">&#10240;</span>
                                                    )}
                                                </div>

                                                {/* Celda Inferior de la Letra */}
                                                <span className="whitespace-pre text-slate-300 pt-1">
                                                    {seg.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}