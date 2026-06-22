// components/events/ContentSelector.tsx
"use client";
import { useState, useEffect } from "react";
import { endpoint } from "@/consts/backEndpoint";

interface ContentSelectorProps {
    type: "song" | "file" | "generic"; // Añadido "generic"
    onAddBlock: (name: string, time: string) => void;
}

export default function ContentSelector({ type, onAddBlock }: ContentSelectorProps) {
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<{ id: number; name: string }[]>([]);
    const [time, setTime] = useState("19:00");
    const [selectedName, setSelectedName] = useState("");

    const isGeneric = type === "generic";

    // Sincronizar el select únicamente si el componente consulta a la DB
    useEffect(() => {
        if (isGeneric) return;

        if (items.length > 0) {
            if (!selectedName || !items.some(item => item.name === selectedName)) {
                setSelectedName(items[0].name);
            }
        } else {
            setSelectedName("");
        }
    }, [items, selectedName, isGeneric]);

    // Efecto de búsqueda en el catálogo de Flask
    useEffect(() => {
        if (isGeneric) return; // Si es genérico, nos ahorramos llamadas HTTP de más

        const delayDebounce = setTimeout(() => {
            if (!search.trim()) {
                setItems([]);
                return;
            }

            const url = type === "song"
                ? `${endpoint}api/songs?name=${encodeURIComponent(search)}`
                : `${endpoint}api/files?name=${encodeURIComponent(search)}`;

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    let rawList = [];
                    if (data && typeof data === 'object') {
                        if (type === "song" && Array.isArray(data.songs)) {
                            rawList = data.songs;
                        } else if (type === "file" && Array.isArray(data.files)) {
                            rawList = data.files;
                        } else if (Array.isArray(data)) {
                            rawList = data;
                        }
                    }

                    const formatted = rawList.map((item: any) => ({
                        id: item.id || 0,
                        name: item.name || ""
                    })).filter((item: any) => item.name);

                    setItems(formatted);
                })
                .catch(err => console.error("Error en el fetch de contenidos:", err));
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search, type, isGeneric]);

    const handleAdd = () => {
        let nameToSend = "";

        if (isGeneric) {
            nameToSend = search.trim();
        } else {
            nameToSend = selectedName || search.trim();
        }

        if (!nameToSend || !time) return;

        onAddBlock(nameToSend, time);

        // Reset rápido
        setSearch("");
        setSelectedName("");
    };

    return (
        <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                {type === "song" ? "🎵 Acoplar Canción" : type === "file" ? "📂 Acoplar Setlist" : "⚙️ Añadir Actividad / Protocolo"}
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
                {/* Input de texto ajustable */}
                <input
                    type="text"
                    placeholder={
                        type === "song" ? "Buscar tema o escribir título manual..." :
                            type === "file" ? "Buscar cancionero o escribir manual..." :
                                "Ej: Brinca Brinca / Break de almuerzo / Animación..."
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-slate-700"
                />

                {/* Si es una actividad común, nos saltamos el selector de base de datos */}
                {!isGeneric && (
                    <select
                        value={selectedName}
                        onChange={(e) => setSelectedName(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-slate-700"
                    >
                        {items.length === 0 ? (
                            <option value="">(Usar texto del buscador como manual)</option>
                        ) : (
                            items.map(item => (
                                <option key={item.id} value={item.name}>{item.name}</option>
                            ))
                        )}
                    </select>
                )}

                {/* Reloj y Trigger */}
                <div className="flex items-center gap-2 shrink-0/10">
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold font-mono text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!search.trim() && !selectedName}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 whitespace-nowrap"
                    >
                        + Bloque
                    </button>
                </div>
            </div>
        </div>
    );
}