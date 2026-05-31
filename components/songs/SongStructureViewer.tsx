// components/songs/SongStructureViewer.tsx
"use client";

interface SongPart {
    title: string;
    content: string;
}

interface SongStructureViewerProps {
    structure: {
        parts: SongPart[];
    } | string; // Por si viene como string plano de la DB
}

export default function SongStructureViewer({ structure }: SongStructureViewerProps) {
    // Manejo de seguridad en caso de que la estructura venga vacía o corrupta
    const parsedStructure = typeof structure === "string" ? JSON.parse(structure) : structure;
    const parts: SongPart[] = parsedStructure?.parts || [];

    if (parts.length === 0) {
        return (
            <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-sm text-slate-500">
                No hay datos lógicos de estructura que mostrar.
            </div>
        );
    }

    // Estilos de color automáticos según el tipo de sección musical
    const getBadgeStyles = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes("coro")) return "bg-pink-500/10 text-pink-400 border-pink-500/20";
        if (t.includes("intro") || t.includes("outro")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        if (t.includes("solo") || t.includes("puente")) return "bg-violet-500/10 text-violet-400 border-violet-500/20";
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"; // Versos por defecto
    };

    return (
        <div className="flex flex-col gap-6 bg-slate-900/10 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/60 pb-3">
                Vista de Ensayo (Layout Estructurado)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parts.map((part, index) => (
                    <div
                        key={index}
                        className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-xl flex flex-col gap-2 shadow-sm transition-all hover:border-slate-700/60"
                    >
                        {/* Tag / Badge de la Sección */}
                        <div className="flex">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getBadgeStyles(part.title)}`}>
                                {part.title}
                            </span>
                        </div>

                        {/* Cuerpo de la letra respetando saltos de línea */}
                        <p className="text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                            {part.content}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}