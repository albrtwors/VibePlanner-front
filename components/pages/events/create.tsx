"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateEvent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);

    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [targetAudience, setTargetAudience] = useState("General");

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
                notify.error("El archivo CSV está vacío o contiene solo la cabecera, varón.");
                return;
            }

            const dataLines = lines.slice(1);
            const totalGuests = dataLines.length;

            setGuestsCount(totalGuests);
            notify.success(`¡CSV procesado con éxito! Se detectaron ${totalGuests} invitados.`);
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

    const addGenericBlock = () => {
        addContentBlock("generic", "", time || "19:00");
    };

    const updateItineraryBlock = (index: number, field: "time" | "name", value: string) => {
        const updated = [...itinerary];
        updated[index][field] = value;
        setItinerary(field === "time" ? sortItinerary(updated) : updated);
    };

    const removeItineraryBlock = (index: number) => {
        setItinerary(itinerary.filter((_, i) => i !== index));
    };

    // ==========================================
    // HANDLER CENTRAL: TOTALMENTE DEPURADO DE AFOROS
    // ==========================================
    // ==========================================
    // HANDLER CENTRAL: ACOPLE DE RECURSOS DIRECTOS
    // ==========================================
    const handleApplyExtractedData = (extracted: {
        itinerary: any[];
        staff: any[];
        inventory: any[];
    }) => {
        const {
            itinerary: newItinerary,
            staff: newStaff,
            inventory: newInventory
        } = extracted;

        // 1. Acoplar bloques de Itinerario
        if (newItinerary && newItinerary.length > 0) {
            setItinerary((prev) => sortItinerary([...prev, ...newItinerary]));
            notify.success(`Asistente acopló ${newItinerary.length} bloques al cronograma.`);
        }

        // 2. Acoplar Miembros del Staff
        if (newStaff && newStaff.length > 0) {
            setStaff((prev) => [...prev, ...newStaff]);
            notify.success(`Asistente vinculó ${newStaff.length} encargados al staff.`);
        }

        // 3. Acoplar Inventario Físico Real de la DB
        if (newInventory && newInventory.length > 0) {
            setSelectedInventory((prev) => {
                let updated = [...prev];
                newInventory.forEach((newItem) => {
                    const idx = updated.findIndex((item) => item.item_id === newItem.item_id);
                    if (idx > -1) {
                        // Si ya existe, se actualiza con la cantidad limpia devuelta por el servicio
                        updated[idx].quantity_used = newItem.quantity_used;
                    } else {
                        // Si no existe, se inyecta el recurso directo de la bodega
                        updated.push({
                            item_id: newItem.item_id,
                            quantity_used: newItem.quantity_used, // Sincronizado con 'quantity_used' de tu Python
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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !date || !time) {
            notify.error("Por favor completa los campos obligatorios, varón.");
            return;
        }

        setLoading(true);

        const payload = {
            name,
            date,
            time,
            target_audience: targetAudience,
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
            console.error(error);
            notify.error(error.message || "Error al registrar el evento.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 font-medium text-slate-100 flex flex-col gap-8">
            <div className="border-b border-slate-800 pb-5">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 sm:text-3xl">
                    Agendar Nuevo Evento
                </h1>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">
                    Diseño interactivo de cronogramas, repertorio musical, control de insumos y presupuesto por lote
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-xl shadow-black/10">
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Nombre del Evento *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Boda Corporativa / Concierto en Vivo"
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Fecha *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Hora de Inicio *</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Público Objetivo</label>
                        <input
                            type="text"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-1">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Aforo / Invitados</label>
                        <input
                            type="number"
                            value={guestsCount || ""}
                            onChange={(e) => setGuestsCount(Number(e.target.value))}
                            placeholder="0"
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-1">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Cargar Lista en Lote (.CSV)</label>
                        <div className="relative w-full bg-slate-950 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all h-[42px]">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCSVUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                                📁 Importar Invitados
                            </span>
                        </div>
                    </div>
                </div>

                {budgetProjections.length > 0 && (
                    <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-xl flex flex-col gap-3 shadow-xl shadow-black/10">
                        <div>
                            <span className="text-[9px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                                Análisis Predictivo del Asistente
                            </span>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 mt-1.5">Proyección de Costos de Logística</h3>
                        </div>
                        <div className="flex flex-col gap-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                            {budgetProjections.map((proj, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                                    <span className="text-slate-400">
                                        {proj.name} <span className="text-[10px] text-slate-600 font-mono">({proj.quantity} x ${proj.price_per_unit})</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {!proj.in_stock && (
                                            <span className="text-[9px] font-black text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded-md border border-amber-500/10">Externo</span>
                                        )}
                                        <span className="font-mono text-slate-200">${proj.total_cost.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-between items-center border-t border-slate-800 pt-2 mt-1 text-xs font-black">
                                <span className="text-indigo-400">TOTAL LOGÍSTICA ESTIMADO:</span>
                                <span className="font-mono text-emerald-400 text-sm">${estimatedLogisticBudget.toFixed(2)} USD</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-4 shadow-xl shadow-black/10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Estructuración del Cronograma</h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Acopla canciones de la base de datos, cancioneros completos o bloques genéricos.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addGenericBlock}
                            className="px-3 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                        >
                            + Bloque General
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <ContentSelector type="generic" onAddBlock={(nameB, timeB) => addContentBlock("generic", nameB, timeB)} />
                        <ContentSelector type="song" onAddBlock={(nameB, timeB) => addContentBlock("song", nameB, timeB)} />
                        <ContentSelector type="file" onAddBlock={(nameB, timeB) => addContentBlock("file", nameB, timeB)} />
                    </div>

                    {itinerary.length === 0 ? (
                        <p className="text-xs font-bold text-slate-500 text-center py-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl uppercase tracking-wider">
                            El itinerario está vacío. Vincula temas o actividades arriba.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block px-1">Línea de Tiempo del Show:</span>
                            {itinerary.map((block, index) => (
                                <ItineraryFormCard
                                    key={index}
                                    block={block}
                                    index={index}
                                    onUpdateBlock={updateItineraryBlock}
                                    onRemoveBlock={removeItineraryBlock}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-4 shadow-xl shadow-black/10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Encargados Técnicos (Staff)</h3>
                        <button type="button" onClick={addStaffRow} className="text-[11px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300">
                            + Vincular Operador
                        </button>
                    </div>
                    {staff.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {staff.map((row, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        type="email"
                                        placeholder="Correo del operador"
                                        value={row.email}
                                        onChange={(e) => updateStaffRow(index, "email", e.target.value)}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Rol (ej: Iluminador)"
                                        value={row.role}
                                        onChange={(e) => updateStaffRow(index, "role", e.target.value)}
                                        className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                                    />
                                    <button type="button" onClick={() => removeStaffRow(index)} className="p-2 text-red-400 hover:text-red-500">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-4 shadow-xl shadow-black/10">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Asignación de Recursos</h3>

                    <InventorySelector catalog={catalog} onAddItem={handleAddInventoryItem} />

                    {selectedInventory.length > 0 && (
                        <div className="flex flex-col gap-2 border-t border-slate-800/60 pt-4">
                            <span className="text-[10px] font-black uppercase text-slate-500 block px-1">Artículos en Orden de Despacho:</span>
                            {selectedInventory.map((item) => (
                                <div key={item.item_id} className="flex justify-between items-center bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-all hover:border-slate-700/60">
                                    <span>[{item.category}] {item.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-indigo-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                                            {item.quantity_used} {item.unit !== "N/A" ? item.unit : "uds"}
                                        </span>
                                        <button type="button" onClick={() => removeInventoryItem(item.item_id)} className="text-slate-500 hover:text-red-400 text-sm font-black p-1">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-2 border-t border-slate-800/60 pt-4">
                    <button
                        type="button"
                        onClick={() => router.push("/events")}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <GenericButton color="primary">
                        {loading ? "Procesando..." : "Consolidar Evento"}
                    </GenericButton>
                </div>
            </form>

            <div className="flex flex-col gap-4 border-t-2 border-dashed border-slate-800 pt-8 mt-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded self-start">
                        Live Preview de Production
                    </span>
                    <h2 className="text-lg font-black uppercase text-slate-200">Vista Previa General</h2>
                </div>

                <EventItineraryView itinerary={itinerary as any} />
                <EventInventoryView inventory={selectedInventory as any} />
            </div>

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