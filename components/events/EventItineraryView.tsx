// components/events/EventItineraryView.tsx
"use client";

interface ItineraryItem {
    time: string;
    type: "song" | "file" | "generic";
    name: string;
}

interface EventItineraryViewProps {
    itinerary: ItineraryItem[];
}

export default function EventItineraryView({ itinerary }: EventItineraryViewProps) {
    if (!itinerary || itinerary.length === 0) {
        return (
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide text-center py-6">
                El itinerario de este evento se encuentra vacío.
            </p>
        );
    }

    // Ordenar cronológicamente por hora por si acaso
    const sortedItinerary = [...itinerary].sort((a, b) => a.time.localeCompare(b.time));

    return (
        <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl shadow-black/10">
            <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
                    Cronograma de Actividades
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    Línea de tiempo estructurada para la ejecución en vivo.
                </p>
            </div>

            {/* Timeline Wrapper */}
            <div className="relative border-l border-slate-800 ml-2.5 pl-5 flex flex-col gap-4">
                {sortedItinerary.map((block, index) => {
                    // Configuración visual según el tipo de bloque
                    const isSong = block.type === "song";
                    const isFile = block.type === "file";

                    return (
                        <div key={index} className="relative flex flex-col gap-1 group">
                            {/* Nodo indicador en la línea de tiempo */}
                            <span className={`absolute -left-[26px] top-1 w-3 h-3 rounded-full border-2 bg-slate-950 transition-colors ${isSong ? "border-emerald-500" : isFile ? "border-amber-500" : "border-indigo-500"
                                }`} />

                            <div className="flex items-center gap-2">
                                {/* Hora de Inicio */}
                                <span className="font-mono text-xs font-black text-slate-200 tracking-tight bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                                    {block.time}
                                </span>

                                {/* Badge de Tipo */}
                                {isSong && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] uppercase font-black tracking-widest text-emerald-400">
                                        Tema
                                    </span>
                                )}
                                {isFile && (
                                    <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] uppercase font-black tracking-widest text-amber-400">
                                        Setlist
                                    </span>
                                )}
                            </div>

                            {/* Contenido / Descripción */}
                            <p className={`text-xs font-bold ${isSong || isFile ? "text-indigo-300" : "text-slate-300"
                                }`}>
                                {block.name}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}