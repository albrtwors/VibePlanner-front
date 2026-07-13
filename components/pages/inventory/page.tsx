"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package, Plus, Search, Layers, ShieldAlert,
    Trash2, Edit3, Loader2, PackageX, Boxes, Tag
} from "lucide-react";
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
    price_per_unit: number;
}

const tableContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
};

const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 26 }
    },
    exit: {
        opacity: 0,
        x: -15,
        transition: { duration: 0.18 }
    }
};

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
        <div className="max-w-6xl mx-auto px-4 py-12 font-medium text-slate-100 flex flex-col gap-6 relative overflow-x-hidden selection:bg-indigo-500/30">
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Cabecera */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/60 pb-6"
            >
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-slate-100 bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-3">
                        <Package className="w-8 h-8 text-indigo-400 shrink-0" /> Control de Almacén
                    </h1>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1.5">
                        Catálogo global de equipos técnicos, insumos consumibles y balance de stock
                    </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shrink-0">
                    <GenericButton color="primary" onClick={() => router.push("/inventory/create")}>
                        <span className="flex items-center gap-1.5 font-black uppercase text-xs tracking-wider">
                            <Plus className="w-4 h-4" /> Registrar Artículo
                        </span>
                    </GenericButton>
                </motion.div>
            </motion.div>

            {/* Barra de Filtros Avanzada */}
            <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/80 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-xl"
            >
                {/* Nombre */}
                <div className="flex flex-col gap-1.5 group">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1">
                        <Search className="w-3 h-3" /> Buscar por Nombre
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: Micrófono Shure..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                    />
                </div>
                {/* Categoría */}
                <div className="flex flex-col gap-1.5 group">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Categoría
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                {/* Tipo de Recurso */}
                <div className="flex flex-col gap-1.5 group">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1">
                        <Boxes className="w-3 h-3" /> Tipo de Recurso
                    </label>
                    <select
                        value={isConsumable}
                        onChange={(e) => setIsConsumable(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="false">Equipo Fijo</option>
                        <option value="true">Material Gastable</option>
                    </select>
                </div>
            </motion.div>

            {/* Renderizado Reactivo Dinámico */}
            <div className="relative min-h-[300px]">
                <AnimatePresence mode="popLayout" initial={false}>
                    {loading ? (
                        <motion.div
                            key="loading-inventory"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 py-16 bg-slate-900/10 border border-slate-800/40 rounded-xl"
                        >
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Sincronizando stock...</span>
                        </motion.div>
                    ) : items.length === 0 ? (
                        <motion.div
                            key="empty-inventory"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex flex-col items-center justify-center gap-3 py-16 bg-slate-900/10 border border-dashed border-slate-800 rounded-xl text-center"
                        >
                            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-600">
                                <PackageX className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">No hay artículos registrados que coincidan, mano.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="inventory-table-wrapper"
                            variants={tableContainerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="w-full bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950/80 border-b border-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-400 select-none">
                                            <th className="py-4 px-5">ID</th>
                                            <th className="py-4 px-5">Nombre</th>
                                            <th className="py-4 px-5">Precio Unitario</th>
                                            <th className="py-4 px-5">Categoría</th>
                                            <th className="py-4 px-5 text-center">Stock Disponible</th>
                                            <th className="py-4 px-5 text-center">Tipo</th>
                                            <th className="py-4 px-5 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40 text-xs font-bold text-slate-300">
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {items.map((item) => (
                                                <motion.tr
                                                    key={item.id}

                                                    layout
                                                    className="hover:bg-slate-950/40 transition-colors group"
                                                >
                                                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">#{item.id}</td>
                                                    <td className="py-3.5 px-5 text-slate-100 font-extrabold tracking-tight">{item.name}</td>
                                                    <td className="py-3.5 px-5 text-emerald-400 font-mono font-bold">
                                                        ${typeof item.price_per_unit === 'number' ? item.price_per_unit.toFixed(2) : "0.00"}
                                                    </td>
                                                    <td className="py-3.5 px-5">
                                                        <span className="bg-slate-950/80 border border-slate-800 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-md text-slate-400 flex items-center gap-1.5 w-fit">
                                                            <Tag className="w-2.5 h-2.5 text-indigo-500" /> {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-5 text-center text-indigo-400 font-mono font-bold text-sm">
                                                        {item.total_stock} <span className="text-[10px] text-slate-500 font-sans font-medium">{item.unit_of_measure}</span>
                                                    </td>
                                                    <td className="py-3.5 px-5 text-center">
                                                        {item.is_consumable ? (
                                                            <span className="text-amber-400 bg-amber-500/5 border border-amber-500/10 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">Gastable</span>
                                                        ) : (
                                                            <span className="text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">Fijo</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => router.push(`/inventory/edit/${item.id}`)}
                                                                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/5 border border-transparent hover:border-indigo-500/10 rounded-lg transition-all"
                                                                title="Editar Artículo"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleDelete(item.id, item.name)}
                                                                className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 rounded-lg transition-all"
                                                                title="Remover Artículo"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}