// components/events/ItineraryFormCard.tsx
"use client";

interface ItineraryBlock {
    time: string;
    type: "song" | "file" | "generic";
    name: string;
}

interface ItineraryFormCardProps {
    block: ItineraryBlock;
    index: number;
    onUpdateBlock: (index: number, field: "time" | "name", value: string) => void;
    onRemoveBlock: (index: number) => void;
}

export default function ItineraryFormCard({ block, index, onUpdateBlock, onRemoveBlock }: ItineraryFormCardProps) {
    const isSong = block.type === "song";
    const isFile = block.type === "file";

    return (
        <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all gap-3 shadow-md shadow-black/20 group">

            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Input de Hora que dispara el reordenamiento al cambiar */}
                <input
                    type="time"
                    value={block.time}
                    onChange={(e) => onUpdateBlock(index, "time", e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-black text-indigo-400 focus:outline-none focus:border-indigo-500"
                />

                {/* Badge identificador de tipo */}
                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest shrink-0 border ${isSong ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                        isFile ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                            "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                    }`}>
                    {isSong ? "🎵 Tema" : isFile ? "📂 Setlist" : "⚙️ Gral"}
                </span>

                {/* Nombre o Título de la actividad */}
                {block.type === "generic" ? (
                    <input
                        type="text"
                        value={block.name}
                        onChange={(e) => onUpdateBlock(index, "name", e.target.value)}
                        placeholder="Ej: Palabras de apertura / Brindis"
                        className="flex-1 bg-transparent border-b border-dashed border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-200 px-1 py-0.5 truncate"
                    />
                ) : (
                    <span className="text-xs font-bold text-slate-100 truncate">
                        {block.name}
                    </span>
                )}
            </div>

            {/* Eliminar Bloque */}
            <button
                type="button"
                onClick={() => onRemoveBlock(index)}
                className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors text-sm font-black"
            >
                ✕
            </button>
        </div>
    );
}