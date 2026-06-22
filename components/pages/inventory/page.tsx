"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GenericButton from "@/components/buttons/GenericButton";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

interface InventoryItem {
    id: number;
    name: string;
    category: string;
    total_stock: number;
    unit_of_measure: string;
    is_consumable: boolean;
    price_per_unit: number; // Campo añadido
}

export default function InventoryPage() {
    const router = useRouter();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [isConsumable, setIsConsumable] = useState("");

    const categories = ["Audio", "Iluminación", "Video", "Estructuras", "Cables", "Consumibles", "Logística"];

    const fetchInventory = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (category) params.append("category", category);
        if (isConsumable) params.append("is_consumable", isConsumable);

        fetch(`${endpoint}api/inventory?${params.toString()}`)
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => setItems(data))
            .catch(() => notify.error("Error al sincronizar el inventario de la bodega."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInventory();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search, category, isConsumable]);

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`¿Estás seguro de remover '${name}' de la bodega, varón?`)) return;

        try {
            const res = await fetch(`${endpoint}api/inventory/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "No se pudo eliminar.");

            notify.success("Artículo removido con éxito.");
            setItems((prev) => prev.filter((item) => item.id !== id));
        } catch (error: any) {
            notify.error(error.message || "Error al eliminar el artículo.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 font-medium text-slate-100 flex flex-col gap-6">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 sm:text-3xl">
                        Control de Almacén e Inventario
                    </h1>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">
                        Catálogo global de equipos técnicos, insumos consumibles y balance de stock
                    </p>
                </div>
                <GenericButton color="primary" onClick={() => router.push("/inventory/create")}>
                    + Registrar Artículo
                </GenericButton>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xl shadow-black/10">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Buscar por Nombre</label>
                    <input type="text" placeholder="Ej: Micrófono Shure..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Categoría</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="">Todas las categorías</option>
                        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo de Recurso</label>
                    <select value={isConsumable} onChange={(e) => setIsConsumable(e.target.value)} className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="">Todos los tipos</option>
                        <option value="false">Equipo Fijo</option>
                        <option value="true">Material Gastable</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[250px] gap-2 bg-slate-900/40 border border-slate-800 rounded-xl">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl uppercase tracking-wider">
                    <p className="text-xs font-bold text-slate-500">No hay artículos registrados, varón.</p>
                </div>
            ) : (
                <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="py-3.5 px-4">ID</th>
                                    <th className="py-3.5 px-4">Nombre</th>
                                    <th className="py-3.5 px-4">Precio</th>
                                    <th className="py-3.5 px-4">Categoría</th>
                                    <th className="py-3.5 px-4 text-center">Stock</th>
                                    <th className="py-3.5 px-4 text-center">Tipo</th>
                                    <th className="py-3.5 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-xs font-bold text-slate-300">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-950/40 transition-colors">
                                        <td className="py-3 px-4 text-slate-500 font-mono">#{item.id}</td>
                                        <td className="py-3 px-4 text-slate-100 font-extrabold">{item.name}</td>
                                        <td className="py-3 px-4 text-emerald-400 font-mono">
                                            ${typeof item.price_per_unit === 'number' ? item.price_per_unit.toFixed(2) : "0.00"}
                                        </td>
                                        <td className="py-3 px-4"><span className="bg-slate-950 border border-slate-800 text-[10px] px-2 py-0.5 rounded-md text-slate-400">{item.category}</span></td>
                                        <td className="py-3 px-4 text-center text-indigo-400">{item.total_stock} <span className="text-[10px] text-slate-500">{item.unit_of_measure}</span></td>
                                        <td className="py-3 px-4 text-center">
                                            {item.is_consumable ? <span className="text-amber-400 text-[10px] font-black uppercase">Consumible</span> : <span className="text-emerald-400 text-[10px] font-black uppercase">Fijo</span>}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button onClick={() => router.push(`/inventory/edit/${item.id}`)} className="text-slate-400 hover:text-indigo-400 mr-4">EDITAR</button>
                                            <button onClick={() => handleDelete(item.id, item.name)} className="text-red-500">✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}