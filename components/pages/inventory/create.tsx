"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    PackagePlus, ArrowLeft, Layers,
    Boxes, DollarSign, Archive, Scale, Loader2
} from "lucide-react";
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
    const [pricePerUnit, setPricePerUnit] = useState<number>(0);

    // Catálogos coherentes
    const categories = ["Audio", "Iluminación", "Video", "Estructuras", "Cables", "Consumibles", "Logística"];

    // CATÁLOGO EXPANDIDO ESTÁNDAR
    const units = [
        "uds", "unidades", "piezas", "metros", "rollos",
        "packs", "cajas", "sets", "litros", "ml", "kg", "gramos"
    ];

    // Callback para que la IA auto-rellene los campos desde el FAB flotante
    const handleAutofillForm = (singleItem: { name: string; category: string; total_stock: number; unit_of_measure: string; is_consumable: boolean; price_per_unit?: number }) => {
        setName(singleItem.name);
        setCategory(categories.includes(singleItem.category) ? singleItem.category : "Logística");
        setTotalStock(singleItem.total_stock);
        setUnitOfMeasure(units.includes(singleItem.unit_of_measure) ? singleItem.unit_of_measure : "uds");
        setIsConsumable(singleItem.is_consumable);
        setPricePerUnit(singleItem.price_per_unit || 0);
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
            price_per_unit: Number(pricePerUnit)
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
        <div className="max-w-3xl mx-auto px-4 py-12 font-medium text-slate-100 flex flex-col gap-6 relative selection:bg-indigo-500/30">
            {/* Efecto sutil de fondo */}
            <div className="absolute top-0 left-1/4 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Cabecera con botón de retorno rápido */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/60 pb-6"
            >
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-slate-100 bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-3">
                        <PackagePlus className="w-8 h-8 text-indigo-400 shrink-0" /> Registrar Artículo
                    </h1>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1.5">
                        Ingresa las especificaciones del nuevo recurso o equipo técnico para la bodega global
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02, x: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/inventory")}
                    className="flex items-center gap-2 self-start sm:self-auto text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-xl transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver
                </motion.button>
            </motion.div>

            {/* Formulario principal */}
            <motion.form
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                onSubmit={handleSubmit}
                className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-6 sm:p-8 rounded-xl flex flex-col gap-6 shadow-2xl"
            >
                {/* 1. Nombre */}
                <div className="flex flex-col gap-1.5 group">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1">
                        Nombre del Artículo / Equipo <span className="text-indigo-400 ml-0.5">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Consola Digital Behringer X32"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-3 text-xs font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                    />
                </div>

                {/* 2. Categoría, Clasificación y Precio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 group">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Categoría
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-3 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                        >
                            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 group">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1">
                            <Boxes className="w-3 h-3" /> Clasificación
                        </label>
                        <select
                            value={isConsumable ? "true" : "false"}
                            onChange={(e) => setIsConsumable(e.target.value === "true")}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-3 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                        >
                            <option value="false">Equipo Fijo</option>
                            <option value="true">Material Gastable</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 group">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Precio Unitario
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pricePerUnit}
                            onChange={(e) => setPricePerUnit(Number(e.target.value))}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-3 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                        />
                    </div>
                </div>

                {/* 3. Stock y Unidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 group">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1">
                            <Archive className="w-3 h-3" /> Existencia Inicial (Stock) <span className="text-indigo-400 ml-0.5">*</span>
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={totalStock}
                            onChange={(e) => setTotalStock(e.target.value === "" ? 0 : Number(e.target.value))}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-3 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 group">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1">
                            <Scale className="w-3 h-3" /> Unidad de Medida
                        </label>
                        <select
                            value={unitOfMeasure}
                            onChange={(e) => setUnitOfMeasure(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-3 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                        >
                            {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                    </div>
                </div>

                {/* Acciones del Formulario */}
                <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/60 pt-5">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => router.push("/inventory")}
                        className="px-5 py-2.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 text-slate-400 hover:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                        Cancelar
                    </motion.button>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <GenericButton color="primary" >
                            {loading ? (
                                <span className="flex items-center gap-2 font-black uppercase text-xs tracking-wider">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Registrando...
                                </span>
                            ) : (
                                <span className="font-black uppercase text-xs tracking-wider">Dar de Alta</span>
                            )}
                        </GenericButton>
                    </motion.div>
                </div>
            </motion.form>

            {/* Asistente Inteligente FAB */}
            <ChatBotFAB>
                {({ closeChat }: any) => (
                    <InventoryChatAssistant closeChat={closeChat} onAutofillForm={handleAutofillForm} />
                )}
            </ChatBotFAB>
        </div>
    );
}