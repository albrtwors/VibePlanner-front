// app/inventory/edit/[id]/page.tsx
"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import GenericButton from "@/components/buttons/GenericButton";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditInventoryItem({ params }: PageProps) {
    const router = useRouter();
    // Desempaquetamos el ID de los parámetros asíncronos de Next.js
    const { id } = use(params);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Estados para los campos de la base de datos
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Audio");
    const [totalStock, setTotalStock] = useState<number>(0);
    const [unitOfMeasure, setUnitOfMeasure] = useState("uds");
    const [isConsumable, setIsConsumable] = useState(false);
    const [pricePerUnit, setPricePerUnit] = useState<number>(0);

    const categories = ["Audio", "Iluminación", "Video", "Estructuras", "Cables", "Consumibles", "Logística"];
    const units = ["uds", "metros", "packs", "cajas", "sets"];

    // Cargar los datos actuales del artículo al montar la página
    useEffect(() => {
        const fetchItemData = async () => {
            try {
                const res = await fetch(`${endpoint}api/inventory/${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "No se pudo obtener el artículo.");

                setName(data.name);
                setCategory(data.category || "Logística");
                setTotalStock(data.total_stock);
                setUnitOfMeasure(data.unit_of_measure);
                setIsConsumable(data.is_consumable);
                setPricePerUnit(data.price_per_unit || 0);
            } catch (error: any) {
                console.error(error);
                notify.error(error.message || "Error al conectar con la bodega.");
                router.push("/inventory");
            } finally {
                setFetching(false);
            }
        };

        if (id) fetchItemData();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || totalStock === null || totalStock < 0) {
            notify.error("Por favor completa los campos obligatorios, varón.");
            return;
        }

        setLoading(true);

        const payload = {
            name: name.trim(),
            category,
            total_stock: Number(totalStock),
            unit_of_measure: unitOfMeasure,
            is_consumable: isConsumable,
            price_per_unit: Number(pricePerUnit)
        };

        try {
            const res = await fetch(`${endpoint}api/inventory/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Fallo al actualizar el artículo.");

            notify.success("¡Insumo actualizado en bodega con éxito!");
            router.push("/inventory");
        } catch (error: any) {
            console.error(error);
            notify.error(error.message || "Error al actualizar el artículo.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-32 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando con la Bodega...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 font-medium text-slate-100 flex flex-col gap-6 relative">

            {/* Cabecera */}
            <div className="border-b border-slate-800 pb-5">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 sm:text-3xl">
                    Modificar Artículo # {id}
                </h1>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">
                    Edita los parámetros técnicos o costos del recurso logístico seleccionado
                </p>
            </div>

            {/* Formulario de Actualización */}
            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-5 shadow-xl shadow-black/10">

                {/* 1. Nombre */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Nombre del Artículo / Equipo *</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Consola Digital Behringer X32"
                        className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                {/* 2. Categoría, Clasificación y Precio Unitario */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Categoría</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Clasificación</label>
                        <select
                            value={isConsumable ? "true" : "false"}
                            onChange={(e) => setIsConsumable(e.target.value === "true")}
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="false">Equipo Fijo</option>
                            <option value="true">Material Gastable</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Precio Unitario ($)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pricePerUnit}
                            onChange={(e) => setPricePerUnit(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                    </div>
                </div>

                {/* 3. Stock y Unidad de Medida */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Stock Actual en Almacén *</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={totalStock}
                            onChange={(e) => setTotalStock(e.target.value === "" ? 0 : Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Unidad de Medida</label>
                        <select
                            value={unitOfMeasure}
                            onChange={(e) => setUnitOfMeasure(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        >
                            {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                    </div>
                </div>

                {/* Botonera de Salida */}
                <div className="flex justify-end gap-3 mt-2 border-t border-slate-800/60 pt-4">
                    <button
                        type="button"
                        onClick={() => router.push("/inventory")}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-black uppercase rounded-xl transition-all hover:border-slate-700"
                    >
                        Cancelar
                    </button>
                    <GenericButton color="primary">
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </GenericButton>
                </div>
            </form>
        </div>
    );
}