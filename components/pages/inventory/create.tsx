"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GenericButton from "@/components/buttons/GenericButton";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

// Importación de los componentes del chat
import ChatBotFAB from "@/components/chatbot/ChatbotFAB";
import InventoryChatAssistant from "@/components/chatbot/InventoryChatAssistant";

export default function CreateInventoryItem() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Estados atómicos para el formulario del artículo
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Audio");
    const [totalStock, setTotalStock] = useState<number>(1);
    const [unitOfMeasure, setUnitOfMeasure] = useState("uds");
    const [isConsumable, setIsConsumable] = useState(false);
    const [pricePerUnit, setPricePerUnit] = useState<number>(0); // NUEVO ESTADO

    // Catálogos coherentes
    const categories = ["Audio", "Iluminación", "Video", "Estructuras", "Cables", "Consumibles", "Logística"];
    const units = ["uds", "metros", "packs", "cajas", "sets"];

    // Callback para que la IA auto-rellene los campos desde el FAB flotante
    const handleAutofillForm = (singleItem: { name: string; category: string; total_stock: number; unit_of_measure: string; is_consumable: boolean; price_per_unit?: number }) => {
        setName(singleItem.name);
        setCategory(categories.includes(singleItem.category) ? singleItem.category : "Logística");
        setTotalStock(singleItem.total_stock);
        setUnitOfMeasure(units.includes(singleItem.unit_of_measure) ? singleItem.unit_of_measure : "uds");
        setIsConsumable(singleItem.is_consumable);
        setPricePerUnit(singleItem.price_per_unit || 0); // NUEVO Relleno
        notify.success("¡Campos cargados desde el Asistente IA!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || totalStock === null || totalStock < 0) {
            notify.error("Por favor completa los campos obligatorios correctamente, varón.");
            return;
        }

        setLoading(true);

        const payload = {
            name: name.trim(),
            category,
            total_stock: Number(totalStock),
            unit_of_measure: unitOfMeasure,
            is_consumable: isConsumable,
            price_per_unit: Number(pricePerUnit) // NUEVO ENVÍO
        };

        try {
            const res = await fetch(`${endpoint}api/inventory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Fallo al registrar el artículo.");

            notify.success("¡Insumo registrado en el almacén con éxito!");
            router.push("/inventory");
        } catch (error: any) {
            console.error(error);
            notify.error(error.message || "Error al registrar el artículo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 font-medium text-slate-100 flex flex-col gap-6 relative">
            <div className="border-b border-slate-800 pb-5">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 sm:text-3xl">
                    Registrar Nuevo Artículo
                </h1>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">
                    Ingresa las especificaciones del nuevo recurso o equipo técnico para la bodega global
                </p>
            </div>

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

                {/* 2. Categoría, Clasificación y Precio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Categoría</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Clasificación</label>
                        <select value={isConsumable ? "true" : "false"} onChange={(e) => setIsConsumable(e.target.value === "true")} className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
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

                {/* 3. Stock y Unidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Existencia Inicial (Stock) *</label>
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
                        <select value={unitOfMeasure} onChange={(e) => setUnitOfMeasure(e.target.value)} className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono">
                            {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-2 border-t border-slate-800/60 pt-4">
                    <button type="button" onClick={() => router.push("/inventory")} className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-black uppercase rounded-xl">Cancelar</button>
                    <GenericButton color="primary">{loading ? "Registrando..." : "Dar de Alta"}</GenericButton>
                </div>
            </form>

            <ChatBotFAB>
                {({ closeChat }: any) => <InventoryChatAssistant closeChat={closeChat} onAutofillForm={handleAutofillForm} />}
            </ChatBotFAB>
        </div>
    );
}