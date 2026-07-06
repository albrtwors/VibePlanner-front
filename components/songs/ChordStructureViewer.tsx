"use client";

interface SongPart {
    title: string;
    content: string;
}

interface SongStructureViewerProps {
    structure: {
        parts: SongPart[];
    } | string;
}

export default function SongStructureViewer({ structure }: SongStructureViewerProps) {
    const parsedStructure = typeof structure === "string" ? JSON.parse(structure) : structure;
    const parts: SongPart[] = parsedStructure?.parts || [];

    if (parts.length === 0) {
        return (
            <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-sm text-slate-500 font-medium">
                No hay acordes o letras cargadas en la estructura aún.
            </div>
        );
    }

    const getBadgeStyles = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes("coro")) return "bg-pink-500/10 text-pink-400 border-pink-500/20";
        if (t.includes("intro") || t.includes("outro")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        if (t.includes("solo") || t.includes("puente")) return "bg-violet-500/10 text-violet-400 border-violet-500/20";
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    };

    // Parsea una línea de texto inyectando los acordes en capas flotantes absolutas
    const renderLineWithChords = (line: string, lineIdx: number) => {
        // Expresión regular para separar los bloques delimitados por []
        const regex = /(\[[A-G][#b]?[mM]?[0-9]?\])/g;
        const subParts = line.split(regex);

        // Si la línea está completamente vacía, respetamos el espacio vertical
        if (line.trim() === "") return <div key={lineIdx} className="h-4" />;

        return (
            <div key={lineIdx} className="flex flex-wrap items-end min-h-[2.5rem] pt-5 relative leading-none">
                {subParts.map((part, partIdx) => {
                    // Si el fragmento es un acorde de corchete
                    if (part.startsWith("[") && part.endsWith("]")) {
                        const chordName = part.slice(1, -1);
                        return (
                            <span
                                key={partIdx}
                                className="absolute top-0 text-[11px] font-mono font-black text-emerald-400 bg-slate-950/80 px-1 rounded select-none pointer-events-none transform -translate-y-0.5 z-10 shadow-sm border border-slate-800/40"
                            >
                                {chordName}
                            </span>
                        );
                    }
                    // Fragmento de letra estándar
                    return (
                        <span key={partIdx} className="whitespace-pre text-slate-300 font-mono tracking-wide text-sm">
                            {part}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-5 bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl backdrop-blur-md w-full shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-800/60 pb-2.5">
                Vista de Ensayo (Acordes en Vivo)
            </h3>

            <div className="flex flex-col gap-5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {parts.map((part, index) => (
                    <div
                        key={index}
                        className="p-4 bg-slate-950/40 border border-slate-800/40 rounded-xl flex flex-col gap-3 shadow-inner"
                    >
                        <div className="flex">
                            <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getBadgeStyles(part.title)}`}>
                                {part.title}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {part.content.split("\n").map((line, lineIdx) => renderLineWithChords(line, lineIdx))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}