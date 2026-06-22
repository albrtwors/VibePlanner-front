// components/events/EventInventoryView.tsx (Actualizado)
"use client";

interface InventoryAssignment {
    item_id: number;
    name: string;
    quantity_used: number;
    unit: string;
    category?: string;
}

export default function EventInventoryView({ inventory }: { inventory: InventoryAssignment[] }) {
    if (!inventory || inventory.length === 0) {
        return (
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide text-center py-4 bg-slate-900 border border-slate-800 rounded-xl">
                No hay recursos de inventario asignados.
            </p>
        );
    }

    const groupedItems = inventory.reduce((acc, item) => {
        const category = item.category || "Otros";
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {} as Record<string, InventoryAssignment[]>);

    return (
        <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl shadow-black/10">
            <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Despacho de Bodega e Insumos</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Artículos y consumibles reservados por departamento.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(groupedItems).map(([category, items]) => (
                    // Corregido aquí: de cajas cuadradas ordinarias a bordes rounded-xl estilizados
                    <div key={category} className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-2.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 border-b border-slate-800/80 pb-2 block">
                            📦 {category}
                        </span>
                        <ul className="flex flex-col gap-2 pt-1">
                            {items.map((item) => (
                                <li key={item.item_id} className="flex justify-between items-center text-xs font-bold text-slate-300">
                                    <span className="truncate pr-2">{item.name}</span>
                                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-indigo-300 font-mono tracking-tight shrink-0">
                                        {item.quantity_used} {item.unit !== "N/A" ? item.unit : "uds"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}