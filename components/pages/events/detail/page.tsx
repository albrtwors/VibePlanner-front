"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";
import { useClientPermissions } from "@/hooks/useClientPermissions";

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

interface PaymentSubmission {
    id: number;
    token: string;
    participant_id: number | null;
    participant_name: string | null;
    participant_email: string | null;
    amount: number;
    status: "pending" | "submitted" | "approved" | "rejected";
    payment_reference?: string | null;
    screenshot_url: string | null;
    requested_at: string | null;
    uploaded_at: string | null;
    reviewed_at: string | null;
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
    const [payments, setPayments] = useState<PaymentSubmission[]>([]);
    const [sendingPayments, setSendingPayments] = useState(false);
    const [reviewingPaymentId, setReviewingPaymentId] = useState<number | null>(null);

    // Cargar asistencia y editar el plan son cosas de organización (events.edit).
    const { can } = useClientPermissions();
    const canManageEvent = can("events.edit");
    const canExportEvent = can("events.export") || can("events.edit");
    const canManagePayments = can("events.payments");

    useEffect(() => {
        setMounted(true);

        fetch(apiUrl(`/api/events/${id}`))
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

    // El panel de pagos y aportes se refresca cuando se abre el evento.
    useEffect(() => {
        if (!id) return;
        fetch(apiUrl(`/api/events/${id}/payments`))
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((data) => setPayments(Array.isArray(data) ? data : []))
            .catch(() => setPayments([]));
    }, [id]);

    const formattedDate = mounted && event
        ? new Date(event.date + "T00:00:00").toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : event?.date || "";

    const refreshPayments = async () => {
        try {
            const res = await fetch(apiUrl(`/api/events/${id}/payments`));
            const data = await res.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch {
            setPayments([]);
        }
    };

    const handleSendPaymentRequests = async () => {
        const eligible = (event?.participants || []).filter(
            (p: { monetary_contribution?: number; email?: string; contact_value?: string; id: number }) =>
                Number(p?.monetary_contribution || 0) > 0 && !!(p?.email || p?.contact_value)
        );
        if (eligible.length === 0) {
            notify.error("No hay participantes con aporte definido para enviar solicitudes de pago.");
            return;
        }
        setSendingPayments(true);
        try {
            const res = await fetch(apiUrl(`/api/events/${id}/payments/send`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participant_ids: eligible.map((p) => p.id) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudieron enviar las solicitudes de pago.");
            notify.success(`Se generaron ${data.sent || 0} solicitudes de pago.`);
            await refreshPayments();
        } catch (err) {
            notify.error(err instanceof Error ? err.message : "Error al enviar solicitudes de pago.");
        } finally {
            setSendingPayments(false);
        }
    };

    const handleReviewPayment = async (paymentId: number, action: "approve" | "reject") => {
        setReviewingPaymentId(paymentId);
        try {
            const res = await fetch(apiUrl(`/api/events/${id}/payments/${paymentId}/review`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudo registrar la revisión del pago.");
            notify.success(action === "approve" ? "Pago aprobado correctamente." : "Pago rechazado.");
            await refreshPayments();
        } catch (err) {
            notify.error(err instanceof Error ? err.message : "Error al revisar el pago.");
        } finally {
            setReviewingPaymentId(null);
        }
    };

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

                {/* Acciones de organización: si el rol no puede, no se renderiza nada */}
                {(canManageEvent || canExportEvent) && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                        {canExportEvent && (
                            <button
                                onClick={() => {
                                    import("@/utils/eventoPdf").then(({ downloadEventoPdf }) => {
                                        downloadEventoPdf(event);
                                    });
                                }}
                                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/60 text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                            >
                                Exportar PDF
                            </button>
                        )}
                        {canManageEvent && (
                            <>
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
                            </>
                        )}
                    </div>
                )}
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
                    {/* Métricas: el acceso a la lista de asistentes es parte de la gestión del evento */}
                    {canManageEvent ? (
                        <Link href={`/events/${id}/participants`} className="group flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300 mt-0.5 hover:text-indigo-400 transition-colors">
                            <span>👤 {event.staff?.length || 0} Operadores</span>
                            <span>📦 {event.inventory?.length || 0} Insumos</span>
                            <span className="text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                → Ver Asistentes ({event.participants?.length || 0})
                            </span>
                        </Link>
                    ) : (
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300 mt-0.5">
                            <span>👤 {event.staff?.length || 0} Operadores</span>
                            <span>📦 {event.inventory?.length || 0} Insumos</span>
                            <span>👥 {event.participants?.length || 0} Asistentes</span>
                        </div>
                    )}
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

                {/* GESTIÓN DE PAGOS Y APODOS */}
                {canManagePayments && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-4 shadow-xl shadow-black/10">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">💰 Pagos y Aportes</h3>
                        <button
                            onClick={handleSendPaymentRequests}
                            disabled={sendingPayments}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                        >
                            {sendingPayments ? "Enviando..." : "💸 Enviar Solicitudes de Pago"}
                        </button>

                        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                            {(payments || []).length === 0 ? (
                                <p className="text-[11px] font-bold text-slate-500 text-center py-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-lg uppercase tracking-wider">
                                    Sin solicitudes de pago registradas.
                                </p>
                            ) : (
                                payments.map((p) => {
                                    const statusColors: Record<string, string> = {
                                        pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
                                        submitted: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
                                        approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                                        rejected: "bg-rose-500/15 text-rose-400 border-rose-500/30",
                                    };
                                    const statusColor = statusColors[p.status] || statusColors.pending;
                                    return (
                                        <div key={p.id} className="bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-lg flex flex-col gap-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-200 truncate">{p.participant_name || "Participante"}</span>
                                                <span className="font-mono font-bold text-emerald-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                                                    ${Number(p.amount || 0).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusColor}`}>
                                                    {p.status}
                                                </span>
                                                <span className="text-[9px] text-slate-500 truncate">{p.participant_email}</span>
                                            </div>
                                            {p.payment_reference && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Referencia</span>
                                                    <span className="text-[9px] font-mono font-bold text-slate-300 truncate">{p.payment_reference}</span>
                                                </div>
                                            )}
                                            {p.screenshot_url && (
                                                <a href={p.screenshot_url.startsWith("http") ? p.screenshot_url : apiUrl(p.screenshot_url)} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 underline">
                                                    Ver comprobante
                                                </a>
                                            )}
                                            {p.status === "submitted" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleReviewPayment(p.id, "approve")}
                                                        disabled={reviewingPaymentId === p.id}
                                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => handleReviewPayment(p.id, "reject")}
                                                        disabled={reviewingPaymentId === p.id}
                                                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                </div>
            </div>
        </div>
    );
}