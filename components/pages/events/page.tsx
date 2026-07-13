"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, CalendarRange, Users, Loader2, CalendarX } from "lucide-react";
import GenericButton from "@/components/buttons/GenericButton";
import EventCard from "@/components/cards/EventCard";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

interface EventPayload {
    id: number;
    name: string;
    date: string;
    time: string;
    target_audience: string;
    staff: any[];
    inventory: any[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: {
        opacity: 0,
        x: -20,
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

export default function EventsIndex() {
    const [events, setEvents] = useState<EventPayload[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros de búsqueda
    const [audienceFilter, setAudienceFilter] = useState("");
    const [startDate, setStartDate] = useState("");

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (audienceFilter.trim() !== "") {
                queryParams.append("audience", audienceFilter);
            }
            if (startDate.trim() !== "") {
                queryParams.append("start_date", startDate);
            }

            const res = await fetch(`${endpoint}api/events?${queryParams.toString()}`);
            if (!res.ok) throw new Error("Error cargando el cronograma de eventos");

            const data = await res.json();
            setEvents(data || []);
        } catch (error) {
            console.error(error);
            notify.error("No se pudieron sincronizar los eventos.");
        } finally {
            setLoading(false);
        }
    };

    // Efecto reactivo con debounce automático para búsquedas fluidas
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchEvents();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [audienceFilter, startDate]);

    const handleDelete = async (id: number, name: string) => {
        const confirmed = window.confirm(`¿Estás seguro de suspender el evento "${name}"? Se liberará el stock.`);
        if (!confirmed) return;

        try {
            const res = await fetch(`${endpoint}api/events/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error();

            setEvents((prev) => prev.filter((ev) => ev.id !== id));
            notify.success(`Evento "${name}" removido de la agenda.`);
        } catch {
            notify.error("Ocurrió un error al intentar eliminar el evento.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-8 font-medium overflow-x-hidden selection:bg-indigo-500/30">

            {/* Cabecera */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-2 border-b border-slate-800/60 pb-6"
            >
                <h1 className="text-3xl font-black text-slate-100 tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-indigo-400 shrink-0" /> Control de Eventos
                </h1>
                <p className="text-sm font-bold text-indigo-400 tracking-wide">
                    Planificador logístico, control de stock y estructuración de itinerarios en vivo.
                </p>
            </motion.div>

            {/* Barra de Filtros Doble */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-slate-900/30 backdrop-blur-sm p-4 rounded-xl border border-slate-800/80 shadow-lg"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-2xl">
                    {/* Búsqueda por público */}
                    <div className="relative group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                            <Users className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Filtrar por público (ej: General, 18-25)..."
                            value={audienceFilter}
                            onChange={(e) => setAudienceFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all text-xs font-bold duration-300"
                        />
                    </div>
                    {/* Búsqueda a partir de una fecha */}
                    <div className="relative group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                            <CalendarRange className="w-4 h-4" />
                        </span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all text-xs font-bold duration-300 grid-cleaner"
                        />
                    </div>
                </div>

                <Link href="/events/create" className="shrink-0">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <GenericButton color="primary">
                            <span className="flex items-center gap-1.5 font-black uppercase text-xs tracking-wider">
                                <Plus className="w-4 h-4" /> Nuevo Evento
                            </span>
                        </GenericButton>
                    </motion.div>
                </Link>
            </motion.div>

            {/* Lista Reactiva de Eventos */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest px-2 select-none">
                    <span>Cronograma Activo ({events.length})</span>
                    <span>Acciones</span>
                </div>

                <div className="relative min-h-[220px]">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {loading ? (
                            <motion.div
                                key="loading-events"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-2 py-12 text-indigo-400"
                            >
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-xs uppercase tracking-widest text-slate-500 font-black">Sincronizando agenda...</span>
                            </motion.div>
                        ) : events.length === 0 ? (
                            <motion.div
                                key="empty-events"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center gap-3 py-14 bg-slate-900/10 border border-dashed border-slate-800 rounded-xl text-center"
                            >
                                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-600">
                                    <CalendarX className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500 max-w-xs normal-case">
                                    No hay eventos planificados que coincidan con los filtros aplicados, mano.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="events-list"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className="grid grid-cols-1 gap-3.5"
                            >
                                {events.map((event) => (
                                    <motion.div
                                        key={event.id}

                                        layout
                                    >
                                        <EventCard
                                            id={event.id}
                                            name={event.name}
                                            date={event.date}
                                            time={event.time}
                                            targetAudience={event.target_audience}
                                            staffCount={event.staff?.length || 0}
                                            inventoryCount={event.inventory?.length || 0}
                                            onDelete={() => handleDelete(event.id, event.name)}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

        </div>
    );
}