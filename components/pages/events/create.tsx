"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarPlus, Sparkles, UploadCloud, Users, Layers,
    Trash2, Plus, AlertCircle, FileText, Briefcase,
    TrendingUp, Eye, CheckCircle2, Loader2, ArrowLeft
} from "lucide-react";
import GenericButton from "@/components/buttons/GenericButton";
import InventorySelector from "@/components/events/InventorySelector";
import ContentSelector from "@/components/events/ContentSelector";
import ItineraryFormCard from "@/components/events/ItineraryFormCard";
import EventItineraryView from "@/components/events/EventItineraryView";
import EventInventoryView from "@/components/events/EventInventoryView";
import ChatBotFAB from "@/components/chatbot/ChatbotFAB";
import AssistantChatWindow from "@/components/chatbot/AssistantChatWindow";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

interface CatalogItem {
    id: number;
    name: string;
    category: string;
    unit_of_measure: string;
}

interface ItineraryBlock {
    time: string;
    type: "song" | "file" | "generic";
    name: string;
}

interface SelectedInventoryItem {
    item_id: number;
    quantity_used: number;
    name: string;
    unit: string;
    category: string;
}

interface BudgetProjection {
    name: string;
    quantity: number;
    price_per_unit: number;
    total_cost: number;
    in_stock: boolean;
}

interface FormErrors {
    name?: string;
    date?: string;
    time?: string;
    targetAudience?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const sectionVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.99 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 260, damping: 24 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, x: 15, transition: { duration: 0.15 } }
};

const errorVariants = {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18 } }
};

export default function CreateEvent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);

    // Estados principales del Formulario
    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [targetAudience, setTargetAudience] = useState("General");

    const [errors, setErrors] = useState<FormErrors>({});
    const [guestsCount, setGuestsCount] = useState<number>(0);
    const [estimatedLogisticBudget, setEstimatedLogisticBudget] = useState<number>(0.00);
    const [budgetProjections, setBudgetProjections] = useState<BudgetProjection[]>([]);

    const [staff, setStaff] = useState<{ email: string; role: string }[]>([]);
    const [itinerary, setItinerary] = useState<ItineraryBlock[]>([]);
    const [selectedInventory, setSelectedInventory] = useState<SelectedInventoryItem[]>([]);

    useEffect(() => {
        fetch(`${endpoint}api/inventory`)
            .then((res) => res.json())
            .then((data) => setCatalog(data))
            .catch(() => notify.error("Error al sincronizar catálogo de bodega."));
    }, []);

    const validateForm = (): boolean => {
        const localErrors: FormErrors = {};
        const hasNumbers = /\d/;

        if (!name.trim()) {
            localErrors.name = "El nombre del evento es obligatorio, varón.";
        } else if (name.trim().length < 3) {
            localErrors.name = "El nombre debe contener al menos 3 caracteres.";
        } else if (hasNumbers.test(name)) {
            localErrors.name = "El nombre del evento no puede contener números.";
        }

        if (!date) localErrors.date = "La fecha es requerida.";
        if (!time) localErrors.time = "La hora de inicio es requerida.";

        if (targetAudience.trim()) {
            if (targetAudience.trim().length < 3) {
                localErrors.targetAudience = "El público objetivo debe tener al menos 3 caracteres.";
            } else if (hasNumbers.test(targetAudience)) {
                localErrors.targetAudience = "El público objetivo no puede contener números.";
            }
        }

        setErrors(localErrors);
        return Object.keys(localErrors).length === 0;
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split("\n")
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (lines.length <= 1) {
                notify.error("El archivo CSV está vacío o contiene solo la cabecera, mano.");
                return;
            }

            const totalGuests = lines.slice(1).length;
            setGuestsCount(totalGuests);
            notify.success(`¡CSV procesado! Se detectaron ${totalGuests} invitados.`);
        };
        reader.readAsText(file);
    };

    const addStaffRow = () => setStaff([...staff, { email: "", role: "" }]);
    const removeStaffRow = (index: number) => setStaff(staff.filter((_, i) => i !== index));
    const updateStaffRow = (index: number, field: "email" | "role", value: string) => {
        const updated = [...staff];
        updated[index][field] = value;
        setStaff(updated);
    };

    const handleAddInventoryItem = (itemId: number, qty: number) => {
        const itemInCatalog = catalog.find((c) => c.id === itemId);
        if (!itemInCatalog) return;

        const existingIndex = selectedInventory.findIndex((i) => i.item_id === itemId);
        if (existingIndex > -1) {
            const updated = [...selectedInventory];
            updated[existingIndex].quantity_used += qty;
            setSelectedInventory(updated);
        } else {
            setSelectedInventory([
                ...selectedInventory,
                {
                    item_id: itemId,
                    quantity_used: qty,
                    name: itemInCatalog.name,
                    unit: itemInCatalog.unit_of_measure,
                    category: itemInCatalog.category,
                },
            ]);
        }
        notify.success(`'${itemInCatalog.name}' acoplado a la orden.`);
    };

    const removeInventoryItem = (itemId: number) => {
        setSelectedInventory(selectedInventory.filter((i) => i.item_id !== itemId));
    };

    const sortItinerary = (list: ItineraryBlock[]) => {
        return [...list].sort((a, b) => a.time.localeCompare(b.time));
    };

    const addContentBlock = (type: "song" | "file" | "generic", nameBlock: string, timeBlock: string) => {
        const nuevoBloque: ItineraryBlock = { time: timeBlock, type, name: nameBlock };
        setItinerary((prev) => sortItinerary([...prev, nuevoBloque]));
        notify.success("Bloque añadido al cronograma.");
    };

    const addGenericBlock = () => addContentBlock("generic", "", time || "19:00");

    const updateItineraryBlock = (index: number, field: "time" | "name", value: string) => {
        const updated = [...itinerary];
        updated[index][field] = value;
        setItinerary(field === "time" ? sortItinerary(updated) : updated);
    };

    const removeItineraryBlock = (index: number) => {
        setItinerary(itinerary.filter((_, i) => i !== index));
    };

    const handleApplyExtractedData = (extracted: { itinerary: any[]; staff: any[]; inventory: any[]; }) => {
        const { itinerary: newItinerary, staff: newStaff, inventory: newInventory } = extracted;

        if (newItinerary && newItinerary.length > 0) {
            setItinerary((prev) => sortItinerary([...prev, ...newItinerary]));
            notify.success(`Asistente acopló ${newItinerary.length} bloques al cronograma.`);
        }
        if (newStaff && newStaff.length > 0) {
            setStaff((prev) => [...prev, ...newStaff]);
            notify.success(`Asistente vinculó ${newStaff.length} encargados al staff.`);
        }
        if (newInventory && newInventory.length > 0) {
            setSelectedInventory((prev) => {
                let updated = [...prev];
                newInventory.forEach((newItem) => {
                    const idx = updated.findIndex((item) => item.item_id === newItem.item_id);
                    if (idx > -1) {
                        updated[idx].quantity_used = newItem.quantity_used;
                    } else {
                        updated.push({
                            item_id: newItem.item_id,
                            quantity_used: newItem.quantity_used,
                            name: newItem.name,
                            unit: newItem.unit || "uds",
                            category: newItem.category || "General",
                        });
                    }
                });
                return updated;
            });
            notify.success(`Asistente inyectó ${newInventory.length} artículos a la orden.`);
        }
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            notify.error("Revisa las alertas en rojo del formulario, mano.");
            return;
        }

        setLoading(true);
        const payload = {
            name: name.trim(),
            date,
            time,
            target_audience: targetAudience.trim(),
            guests_count: guestsCount,
            estimated_logistic_budget: estimatedLogisticBudget,
            itinerary,
            staff: staff.filter((s) => s.email && s.role),
            inventory: selectedInventory.map((i) => ({ item_id: i.item_id, quantity: i.quantity_used })),
        };

        try {
            const res = await fetch(`${endpoint}api/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Fallo al procesar el guardado.");

            notify.success("¡Evento e inventario consolidados con éxito!");
            router.push("/events");
        } catch (error: any) {
            notify.error(error.message || "Error al registrar el evento.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 font-medium text-slate-100 flex flex-col gap-8 relative overflow-x-hidden selection:bg-indigo-500/30">
            <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

            {/* Cabecera */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border-b border-slate-800/60 pb-6"
            >
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" /> Logística Avanzada
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-100 sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-3">
                    <CalendarPlus className="w-8 h-8 text-indigo-400 shrink-0" /> Agendar Nuevo Evento
                </h1>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1.5">
                    Diseño interactivo de cronogramas, repertorio musical, control de insumos y presupuesto por lote
                </p>
            </motion.div>

            <motion.form
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                onSubmit={handleSubmit}
                className="flex flex-col gap-6 relative z-10"
            >
                {/* PARTE 1: DATOS GENERALES */}
                <motion.div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 sm:p-8 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-5 shadow-2xl">
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 pl-0.5">Nombre del Evento *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Boda Corporativa / Concierto en Vivo"
                            className={`w-full bg-slate-950/60 border rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.name ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-800 focus:border-indigo-500/70 focus:ring-indigo-500/5"
                                }`}
                        />
                        <AnimatePresence>
                            {errors.name && (
                                <motion.p variants={errorVariants} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 pl-0.5">Fecha *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={`w-full bg-slate-950/60 border rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-4 transition-all duration-300 grid-cleaner ${errors.date ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-800 focus:border-indigo-500/70 focus:ring-indigo-500/5"
                                }`}
                        />
                        <AnimatePresence>
                            {errors.date && (
                                <motion.p variants={errorVariants} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> {errors.date}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 pl-0.5">Hora de Inicio *</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className={`w-full bg-slate-950/60 border rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.time ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-800 focus:border-indigo-500/70 focus:ring-indigo-500/5"
                                }`}
                        />
                        <AnimatePresence>
                            {errors.time && (
                                <motion.p variants={errorVariants} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> {errors.time}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 pl-0.5">Público Objetivo</label>
                        <input
                            type="text"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            className={`w-full bg-slate-950/60 border rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.targetAudience ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-800 focus:border-indigo-500/70 focus:ring-indigo-500/5"
                                }`}
                        />
                        <AnimatePresence>
                            {errors.targetAudience && (
                                <motion.p variants={errorVariants} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> {errors.targetAudience}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 pl-0.5">Aforo / Invitados</label>
                        <input
                            type="number"
                            value={guestsCount || ""}
                            onChange={(e) => setGuestsCount(Number(e.target.value))}
                            placeholder="0"
                            className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none transition-all duration-300"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 pl-0.5">Cargar Lista en Lote (.CSV)</label>
                        <div className="relative w-full bg-slate-950/40 border-2 border-dashed border-slate-800 hover:border-indigo-500/40 rounded-xl px-4 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 h-[46px] group">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCSVUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                            />
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
                                <UploadCloud className="w-4 h-4" /> Importar Invitados
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* PROYECCIÓN PRESUPUESTARIA */}
                <AnimatePresence>
                    {budgetProjections.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.98 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 280, damping: 25 }}
                            className="bg-slate-900/30 border border-amber-500/20 p-6 rounded-2xl flex flex-col gap-3 shadow-xl overflow-hidden"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded flex items-center gap-1">
                                    <TrendingUp className="w-2.5 h-2.5" /> Análisis Predictivo AI
                                </span>
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Proyección de Costos de Logística</h3>

                            <div className="flex flex-col gap-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                                {budgetProjections.map((proj, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-900 pb-2 last:border-0 last:pb-0">
                                        <span className="text-slate-400 font-medium">
                                            {proj.name} <span className="text-[10px] text-slate-600 font-mono">({proj.quantity} x ${proj.price_per_unit})</span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {!proj.in_stock && (
                                                <span className="text-[9px] font-black text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10 uppercase">Externo</span>
                                            )}
                                            <span className="font-mono text-slate-200 font-bold">${proj.total_cost.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center border-t border-slate-800/80 pt-3 mt-1.5 text-xs font-black">
                                    <span className="text-indigo-400 uppercase tracking-wider">Total Logística Estimado:</span>
                                    <span className="font-mono text-emerald-400 text-sm bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-lg">${estimatedLogisticBudget.toFixed(2)} USD</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CRONOGRAMA */}
                <motion.div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 sm:p-8 rounded-2xl flex flex-col gap-4 shadow-2xl">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800/40 pb-4">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" /> Estructuración del Cronograma
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Acopla canciones de la base de datos, cancioneros completos o bloques genéricos.</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={addGenericBlock}
                            className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all self-start sm:self-auto"
                        >
                            + Bloque General
                        </motion.button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <ContentSelector type="generic" onAddBlock={(nameB, timeB) => addContentBlock("generic", nameB, timeB)} />
                        <ContentSelector type="song" onAddBlock={(nameB, timeB) => addContentBlock("song", nameB, timeB)} />
                        <ContentSelector type="file" onAddBlock={(nameB, timeB) => addContentBlock("file", nameB, timeB)} />
                    </div>

                    <div className="mt-2">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {itinerary.length === 0 ? (
                                <motion.p
                                    key="empty-itinerary"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="text-xs font-bold text-slate-500 text-center py-6 bg-slate-950/30 border border-dashed border-slate-800 rounded-xl uppercase tracking-wider"
                                >
                                    El itinerario está vacío. Vincula temas o actividades arriba.
                                </motion.p>
                            ) : (
                                <motion.div layout className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block px-1 mb-1">Línea de Tiempo del Show:</span>
                                    {itinerary.map((block, index) => (
                                        <motion.div key={`${block.type}-${index}`} layout>
                                            <ItineraryFormCard
                                                block={block}
                                                index={index}
                                                onUpdateBlock={updateItineraryBlock}
                                                onRemoveBlock={removeItineraryBlock}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* STAFF */}
                <motion.div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 sm:p-8 rounded-2xl flex flex-col gap-4 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-800/40 pb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-indigo-400" /> Encargados Técnicos (Staff)
                        </h3>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            type="button"
                            onClick={addStaffRow}
                            className="text-[11px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                            + Vincular Operador
                        </motion.button>
                    </div>

                    <div className="mt-1">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {staff.length === 0 ? (
                                <motion.p
                                    key="empty-staff"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs font-bold text-slate-500 text-center py-4 uppercase tracking-wider"
                                >
                                    No hay operadores asignados a este evento.
                                </motion.p>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {staff.map((row, index) => (
                                        <motion.div
                                            key={index}

                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            layout
                                            className="flex gap-3 items-center bg-slate-950/30 p-2 border border-slate-800/50 rounded-xl"
                                        >
                                            <input
                                                type="email"
                                                placeholder="Correo del operador"
                                                value={row.email}
                                                onChange={(e) => updateStaffRow(index, "email", e.target.value)}
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500/40 transition-colors"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Rol (ej: Iluminador)"
                                                value={row.role}
                                                onChange={(e) => updateStaffRow(index, "role", e.target.value)}
                                                className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500/40 transition-colors"
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                type="button"
                                                onClick={() => removeStaffRow(index)}
                                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 rounded-lg transition-all shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* RECURSOS */}
                <motion.div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 sm:p-8 rounded-2xl flex flex-col gap-4 shadow-2xl">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-2 border-b border-slate-800/40 pb-4">
                        <Users className="w-4 h-4 text-indigo-400" /> Asignación de Recursos en Bodega
                    </h3>

                    <InventorySelector catalog={catalog} onAddItem={handleAddInventoryItem} />

                    <div className="mt-2">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {selectedInventory.length > 0 && (
                                <motion.div layout className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-500 block px-1 mb-1">Artículos en Orden de Despacho:</span>
                                    {selectedInventory.map((item) => (
                                        <motion.div
                                            key={item.item_id}

                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            layout
                                            className="flex justify-between items-center bg-slate-950/60 border border-slate-800 px-4 py-3 rounded-xl text-xs font-bold text-slate-300 transition-all hover:border-slate-800/80"
                                        >
                                            <span><span className="text-slate-500 text-[10px] font-black uppercase tracking-wider mr-1.5">[{item.category}]</span> {item.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-indigo-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                                    {item.quantity_used} {item.unit !== "N/A" ? item.unit : "uds"}
                                                </span>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    type="button"
                                                    onClick={() => removeInventoryItem(item.item_id)}
                                                    className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* BOTONERA ACCIONES */}
                <motion.div className="flex justify-end items-center gap-4 mt-2 border-t border-slate-800/60 pt-6">
                    <button
                        type="button"
                        onClick={() => router.push("/events")}
                        className="text-sm font-semibold text-slate-400 hover:text-slate-200 px-2 transition-colors flex items-center gap-1.5"
                    >
                        <ArrowLeft className="w-4 h-4" /> Cancelar
                    </button>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <GenericButton color="primary">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Consolidando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 font-black uppercase text-xs tracking-wider">
                                    <CheckCircle2 className="w-4 h-4" /> Consolidar Evento
                                </span>
                            )}
                        </GenericButton>
                    </motion.div>
                </motion.div>
            </motion.form>

            {/* LIVE PREVIEW SECCIÓN */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex flex-col gap-4 border-t border-slate-800/80 pt-10 mt-6"
            >
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded self-start flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Live Preview de Production
                    </span>
                    <h2 className="text-xl font-black uppercase text-slate-200 tracking-tight">Vista Previa General</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 opacity-85 hover:opacity-100 transition-opacity duration-300">
                    <EventItineraryView itinerary={itinerary as any} />
                    <EventInventoryView inventory={selectedInventory as any} />
                </div>
            </motion.div>

            <ChatBotFAB>
                {({ closeChat }: any) => (
                    <AssistantChatWindow
                        closeChat={closeChat}
                        onApplyExtractedData={handleApplyExtractedData}
                    />
                )}
            </ChatBotFAB>
        </div>
    );
}