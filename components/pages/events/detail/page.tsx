"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { endpoint } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";

interface ItineraryBlock {
    time: string;
    type: "song" | "file" | "generic";
    name: string;
}

interface EventStaff {
    email: string;
    role: string;
}

interface EventInventory {
    item_id: number;
    name: string;
    category?: string;
    quantity_used: number;
    unit: string;
}

interface EventDetail {
    id: number;
    name: string;
    date: string;
    time: string;
    target_audience: string;
    guests_count: number;
    estimated_logistic_budget: number;
    itinerary: ItineraryBlock[];
    staff: EventStaff[];
    inventory: EventInventory[];
    // Añadidos en tipado para reflejar contadores reales si el backend los manda
    groups?: any[];
    participants?: any[];
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EventDetailPagePage({ params }: PageProps) {
    const router = useRouter();
    const { id } = use(params);

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        fetch(`${endpoint}api/events/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("No se pudo obtener el detalle del evento.");
                return res.json();
            })
            .then((data) => setEvent(data))
            .catch((err) => {
                console.error(err);
                notify.error("Error al cargar el evento.");
                router.push("/events");
            })
            .finally(() => setLoading(false));
    }, [id, router]);

    const formattedDate = mounted && event
        ? new Date(event.date + "T00:00:00").toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : event?.date || "";

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-12 text-center text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">
                Sincronizando bitácora de producción...
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6 font-medium text-slate-100">

            {/* ENCABEZADO / ACCIONES */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
                <div className="min-w-0 flex-1">
                    <Link href="/events" className="text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:underline">
                        ← Volver al Listado
                    </Link>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 sm:text-3xl truncate mt-1">
                        {event.name}
                    </h1>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* ENLACE DIRECTO AL LOTE DINÁMICO DE PARTICIPANTES */}
                    <Link href={`/events/${id}/participants`}>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-950/20 active:scale-95">
                            👥 Gestionar Asistencia
                        </button>
                    </Link>
                    <Link href={`/events/${id}/edit`}>
                        <button className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">
                            Editar Plan
                        </button>
                    </Link>
                </div>
            </div>

            {/* CUADRICULA PRINCIPAL: METADATA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl shadow-black/10">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Cronología</span>
                    <span className="text-xs font-bold text-slate-200 capitalize">{formattedDate}</span>
                    <span className="text-xs font-mono font-bold text-indigo-400 mt-0.5">⏱ {event.time.slice(0, 5)} HRS</span>
                </div>
                <div className="flex flex-col gap-1 border-t sm:border-t-0 sm:border-x border-slate-800 pt-3 sm:pt-0 sm:px-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Público Target</span>
                    <span className="text-xs font-bold text-slate-200">{event.target_audience}</span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">● Activo</span>
                </div>
                <div className="flex flex-col gap-1 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 sm:pl-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Métricas Operacionales</span>
                    {/* RECUADRO CON LINK HACIA LOS PARTICIPANTES REGISTRADOS */}
                    <Link href={`/events/${id}/participants`} className="group flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300 mt-0.5 hover:text-indigo-400 transition-colors">
                        <span>👤 {event.staff?.length || 0} Operadores</span>
                        <span>📦 {event.inventory?.length || 0} Insumos</span>
                        <span className="text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            → Ver Asistentes ({event.participants?.length || 0})
                        </span>
                    </Link>
                </div>
            </div>

            {/* SECCIONES DIVIDIDAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUMNA ITINERARIO */}
                <div className="lg:col-span-2 flex flex-col gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl shadow-black/10">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Minuto a Minuto del Show</h3>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Bloques secuenciales ordenados cronológicamente.</p>
                    </div>

                    {(!event.itinerary || event.itinerary.length === 0) ? (
                        <p className="text-xs font-bold text-slate-500 text-center py-8 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl uppercase tracking-wider">
                            No se ha estructurado el itinerario para este evento.
                        </p>
                    ) : (
                        <div className="relative border-l-2 border-slate-800 pl-4 ml-2 flex flex-col gap-4 my-2">
                            {event.itinerary.map((block, index) => (
                                <div key={index} className="relative group">
                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-slate-900 group-hover:scale-125 transition-transform" />
                                    <div className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="font-mono text-xs font-bold text-indigo-400 shrink-0 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded-md">
                                                {block.time}
                                            </span>
                                            <span className="text-xs font-bold text-slate-200 truncate pr-2">
                                                {block.name}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 bg-slate-900 border border-slate-800/40 text-slate-400">
                                            {block.type === "song" ? "🎵 Tema" : block.type === "file" ? "📂 Setlist" : "⚙️ Protocolo"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* COLUMNA OPERACIONES Y RECURSOS */}
                <div className="flex flex-col gap-6">

                    {/* ENCARGADOS TÉCNICOS */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-4 shadow-xl shadow-black/10">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Staff Técnico</h3>
                        {(!event.staff || event.staff.length === 0) ? (
                            <p className="text-[11px] font-bold text-slate-500 text-center py-2 bg-slate-950/40 border border-slate-800 rounded-lg uppercase tracking-wider">
                                Sin personal asignado
                            </p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {event.staff.map((member, idx) => (
                                    <div key={idx} className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs flex flex-col gap-0.5">
                                        <span className="font-bold text-slate-200 truncate">{member.email}</span>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">{member.role}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RECURSOS DE BODEGA ASIGNADOS */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-4 shadow-xl shadow-black/10">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Insumos Despachados</h3>

                        {(!event.inventory || event.inventory.length === 0) ? (
                            <p className="text-[11px] font-bold text-slate-500 text-center py-2 bg-slate-950/40 border border-slate-800 rounded-lg uppercase tracking-wider">
                                Sin recursos requeridos
                            </p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {event.inventory.map((assignment) => (
                                    <div key={assignment.item_id} className="bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-lg flex justify-between items-center text-xs gap-3">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-slate-200 truncate">{assignment.name}</span>
                                            <span className="text-[9px] font-black uppercase text-slate-500">{assignment.category || "General"}</span>
                                        </div>
                                        <span className="font-mono font-bold text-indigo-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                                            {assignment.quantity_used} {assignment.unit !== "N/A" ? assignment.unit : "uds"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}