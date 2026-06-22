// components/events/InventorySelector.tsx
"use client";
import { useState, useEffect } from "react";

interface CatalogItem {
    id: number;
    name: string;
    category: string;
    unit_of_measure: string;
}

interface InventorySelectorProps {
    catalog: CatalogItem[];
    onAddItem: (itemId: number, quantity: number) => void;
}

export default function InventorySelector({ catalog, onAddItem }: InventorySelectorProps) {
    const [mounted, setMounted] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(1);

    // Se ejecuta únicamente al llegar al cliente para evitar Hydration Mismatch
    useEffect(() => {
        setMounted(true);
        if (catalog.length > 0) {
            setSelectedId(catalog[0].id);
        }
    }, [catalog]);

    // Filtrar catálogo localmente según la búsqueda
    const filteredCatalog = catalog.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    // Sincronizar el select si el catálogo filtrado cambia de golpe
    useEffect(() => {
        if (filteredCatalog.length > 0) {
            const isStillValid = filteredCatalog.some(item => item.id === selectedId);
            if (!isStillValid) {
                setSelectedId(filteredCatalog[0].id);
            }
        } else {
            setSelectedId(0);
        }
    }, [search, filteredCatalog, selectedId]);

    const handleAdd = () => {
        const idToSend = selectedId || filteredCatalog[0]?.id;
        if (!idToSend || quantity <= 0) return;
        onAddItem(idToSend, quantity);
        setQuantity(1); // Reset de cantidad por prolijidad
    };

    // Buscar el ítem actualmente seleccionado para extraer su unidad de medida (m, uds, etc.)
    const currentMatchedItem = catalog.find(c => c.id === selectedId);

    // Esqueleto de carga en lo que Next.js hidrata en el cliente
    if (!mounted) {
        return <div className="h-[74px] bg-slate-950/40 border border-slate-800/80 rounded-xl animate-pulse" />;
    }

    return (
        <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                🔍 Buscador Avanzado de Bodega
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
                {/* Input de filtro por texto */}
                <input
                    type="text"
                    placeholder="Filtrar por nombre o categoría (ej: Audio)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-slate-700"
                />

                {/* Selector de ítems filtrados */}
                <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-slate-700"
                >
                    {filteredCatalog.length === 0 ? (
                        <option value="0">No se encontraron artículos</option>
                    ) : (
                        filteredCatalog.map(item => (
                            <option key={item.id} value={item.id}>
                                [{item.category}] {item.name}
                            </option>
                        ))
                    )}
                </select>

                {/* Control de cantidad y botón */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5">
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                            className="w-14 bg-transparent text-center text-xs font-mono font-bold text-slate-200 focus:outline-none"
                        />
                        <span className="text-[10px] font-black text-slate-500 uppercase w-8 truncate">
                            {currentMatchedItem?.unit_of_measure || "uds"}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={filteredCatalog.length === 0 || quantity <= 0}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 whitespace-nowrap"
                    >
                        Asignar
                    </button>
                </div>
            </div>
        </div>
    );
}