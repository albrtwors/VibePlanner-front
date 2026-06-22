// app/events/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8 font-medium">

            {/* Cabecera */}
            <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
                <h1 className="text-3xl font-black text-slate-100 tracking-tight sm:text-4xl uppercase">
                    Control de Eventos
                </h1>
                <p className="text-sm font-bold text-indigo-400 tracking-wide">
                    Planificador logístico, control de stock y estructuración de itinerarios en vivo.
                </p>
            </div>

            {/* Barra de Filtros Doble */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-xl">
                    {/* Búsqueda por público */}
                    <input
                        type="text"
                        placeholder="Filtrar por público (ej: General, 18-25)..."
                        value={audienceFilter}
                        onChange={(e) => setAudienceFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-700/60 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs"
                    />
                    {/* Búsqueda a partir de una fecha */}
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-700/60 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs"
                    />
                </div>

                <Link href="/events/create" className="shrink-0">
                    <GenericButton color="primary">
                        Nuevo Evento
                    </GenericButton>
                </Link>
            </div>

            {/* Lista Reactiva de Eventos */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest px-2">
                    <span>Cronograma Activo ({events.length})</span>
                    <span>Acciones</span>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-xs font-bold text-slate-500 animate-pulse uppercase tracking-wider">
                        Sincronizando agenda...
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-wider">
                        No hay eventos planificados que coincidan.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                id={event.id}
                                name={event.name}
                                date={event.date}
                                time={event.time}
                                targetAudience={event.target_audience}
                                staffCount={event.staff.length}
                                inventoryCount={event.inventory.length}
                                onDelete={() => handleDelete(event.id, event.name)}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}