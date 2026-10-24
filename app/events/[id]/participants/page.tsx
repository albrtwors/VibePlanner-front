"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiUrl } from "@/consts/backEndpoint";
import ChatBotFAB from "@/components/chatbot/ChatbotFAB";
import ChatBotWindow from "@/components/chatbot/ChatbotParticipantsWindow";
import { notify } from "@/utils/toast";
import { useClientPermissions } from "@/hooks/useClientPermissions";
import {
    detectColumnMapping,
    csvRowsToBlocks,
    parseParticipantsCsvRaw,
    downloadCsvTemplate,
    type CsvFieldKey,
} from "@/components/CSVParser";

interface CollabItem {
    item: string;
    quantity: number;
}

interface GroupMember {
    name: string;
    email: string;
    contactType?: "email" | "phone" | "none";
    contactValue?: string;
    contactPhone?: string;
    monetaryContribution: number;
    logisticsToBring: CollabItem[];
}

interface ParticipantBlock {
    type: "individual" | "group";
    displayName: string;
    contactEmail: string;
    contactType?: "email" | "phone" | "none";
    contactValue?: string;
    contactPhone?: string;
    monetaryContribution: number;
    logisticsToBring: CollabItem[];
    members: GroupMember[];
}

// Normaliza lo que devuelve la IA para que siempre tenga la forma que espera el formulario
// (por si el modelo omite algún array opcional, evitamos romper el render).
function normalizeBlocks(rawBlocks: any[]): ParticipantBlock[] {
    if (!Array.isArray(rawBlocks)) return [];

        const normalizeCollab = (list: any[]): CollabItem[] => {
            const cleaned = (Array.isArray(list) ? list : [])
                .filter((it) => it && typeof it.item === "string")
                .map((it) => ({ item: it.item, quantity: Number(it.quantity) || 1 }));
            return cleaned.length > 0 ? cleaned : [{ item: "", quantity: 1 }];
        };

        return rawBlocks
            .filter((b) => b && typeof b.displayName === "string")
            .map((b) => ({
                type: b.type === "group" ? "group" : "individual",
                displayName: b.displayName || "",
                contactEmail: b.contactEmail || b.contactValue || "",
                contactType: b.contactType || (b.contactEmail || b.contactValue ? "email" : "none"),
                contactValue: b.contactValue || b.contactEmail || b.contactPhone || "",
                contactPhone: b.contactPhone || "",
                monetaryContribution: Number(b.monetaryContribution) || 0,
                logisticsToBring: normalizeCollab(b.logisticsToBring),
                members: b.type === "group"
                    ? (Array.isArray(b.members) ? b.members : [])
                        .filter((m: any) => m && typeof m.name === "string")
                        .map((m: any) => ({
                            name: m.name,
                            email: m.email || m.contactValue || "",
                            contactType: m.contactType || (m.email || m.contactValue ? "email" : "none"),
                            contactValue: m.contactValue || m.email || m.contactPhone || "",
                            contactPhone: m.contactPhone || "",
                            monetaryContribution: Number(m.monetaryContribution) || 0,
                            logisticsToBring: normalizeCollab(m.logisticsToBring),
                        }))
                    : [],
            }));
}

export default function AddParticipantsPage() {
    const { id: eventId } = useParams();
    const router = useRouter();

    // Esta pantalla SOLO sirve para cargar/injectar asistentes (endpoint events.edit).
    // Si el rol no puede, ni siquiera se dibuja el formulario.
    const { can, ready } = useClientPermissions();
    const canManageAttendance = can("events.edit");

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });

    // --- Estado de importación por CSV ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [csvImporting, setCsvImporting] = useState(false);
    const [csvPendingAi, setCsvPendingAi] = useState<{ rows: Record<string, string>[]; headers: string[] } | null>(null);

    const [blocks, setBlocks] = useState<ParticipantBlock[]>([
        { type: "individual", displayName: "", contactEmail: "", contactType: "email", contactValue: "", contactPhone: "", monetaryContribution: 0, logisticsToBring: [{ item: "", quantity: 1 }], members: [] }
    ]);

    useEffect(() => {
        if (!eventId) return;

        setFetching(true);
        fetch(apiUrl(`/api/events/${eventId}`))
            .then((res) => {
                if (!res.ok) throw new Error("Error al obtener los participantes existentes.");
                return res.json();
            })
            .then((data) => {
                const fetchedBlocks: ParticipantBlock[] = [];

                if (data.groups && data.groups.length > 0) {
                data.groups.forEach((g: any) => {
                    const groupMembers = (data.participants || [])
                        .filter((p: any) => p.group_id === g.id)
                        .map((p: any) => ({
                            name: p.name,
                            email: p.email || p.contact_value || "",
                            contactType: p.contact_type || (p.email ? "email" : p.contact_phone ? "phone" : "none"),
                            contactValue: p.contact_value || p.email || p.contact_phone || "",
                            contactPhone: p.contact_phone || "",
                            monetaryContribution: p.monetary_contribution || 0,
                            logisticsToBring: p.logistics_to_bring && p.logistics_to_bring.length > 0
                                ? p.logistics_to_bring.map((l: any) => ({ item: l.item, quantity: l.quantity }))
                                : [{ item: "", quantity: 1 }]
                        }));

                    fetchedBlocks.push({
                        type: "group",
                        displayName: g.name,
                        contactEmail: "",
                        contactType: "none",
                        contactValue: "",
                        contactPhone: "",
                        monetaryContribution: g.monetary_contribution || 0,
                        logisticsToBring: g.logistics_to_bring && g.logistics_to_bring.length > 0
                            ? g.logistics_to_bring.map((l: any) => ({ item: l.item, quantity: l.quantity }))
                            : [{ item: "", quantity: 1 }],
                        members: groupMembers
                    });
                });
                }

                const individuals = (data.participants || []).filter((p: any) => p.group_id === null);
                if (individuals.length > 0) {
                    individuals.forEach((p: any) => {
                        const cType = p.contact_type || (p.email ? "email" : p.contact_phone ? "phone" : "none");
                        const cVal = p.contact_value || p.email || p.contact_phone || "";
                        fetchedBlocks.push({
                            type: "individual",
                            displayName: p.name,
                            contactEmail: p.email || cVal,
                            contactType: cType,
                            contactValue: cVal,
                            contactPhone: p.contact_phone || (cType === "phone" ? cVal : ""),
                            monetaryContribution: p.monetary_contribution || 0,
                            logisticsToBring: p.logistics_to_bring && p.logistics_to_bring.length > 0
                                ? p.logistics_to_bring.map((l: any) => ({ item: l.item, quantity: l.quantity }))
                                : [{ item: "", quantity: 1 }],
                            members: []
                        });
                    });
                }

                if (fetchedBlocks.length > 0) {
                    setBlocks(fetchedBlocks);
                }
            })
            .catch((err) => {
                console.error("Error cargando el estado inicial:", err);
            })
            .finally(() => {
                setFetching(false);
            });
    }, [eventId]);

    // Aplica al estado del formulario los blocks que devuelve la IA del chatbot.
    // OJO: esto NO toca la base de datos, solo el borrador en pantalla; el usuario
    // sigue teniendo que apretar "Confirmar e Inyectar Asistentes" para guardar.
    const handleAIBlocksUpdated = (newBlocks: any[]) => {
        const normalized = normalizeBlocks(newBlocks);
        if (normalized.length > 0) {
            setBlocks(normalized);
        }
    };

    // --- Importación por CSV ---
    // 1) Intenta reconocer las columnas por sinónimos (sin IA, gratis e instantáneo).
    // 2) Si no reconoce el nombre (la columna clave), ofrece mandarle SOLO los
    //    encabezados a la IA para que los mapee, sin exponer datos de personas.
    const handleCsvFileSelected = async (file: File) => {
        setCsvImporting(true);
        setCsvPendingAi(null);
        try {
            const { rows, headers } = await parseParticipantsCsvRaw(file);
            const mapping = detectColumnMapping(headers);

            if (!mapping.nombre) {
                setCsvPendingAi({ rows, headers });
                notify.error("No reconocí las columnas de este CSV automáticamente. Podés pedirle a la IA que las interprete (abajo del botón de importar).");
                return;
            }

            const parsedBlocks = csvRowsToBlocks(rows, mapping);
            const normalized = normalizeBlocks(parsedBlocks);
            if (normalized.length === 0) {
                notify.error("El CSV no tiene ninguna fila válida con nombre.");
                return;
            }
            setBlocks(normalized);
            notify.success(`¡Listo! Se importaron ${normalized.length} bloques desde el CSV.`);
        } catch (err) {
            notify.error("No pude leer ese archivo. ¿Es un CSV válido?");
        } finally {
            setCsvImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleAiAssistedCsvImport = async () => {
        if (!csvPendingAi) return;
        setCsvImporting(true);
        try {
            const res = await fetch(apiUrl("/api/assistant/map-csv-headers"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ headers: csvPendingAi.headers }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudo mapear el CSV con IA.");

            const mapping = data.mapping as Record<CsvFieldKey, string>;
            if (!mapping.nombre) {
                notify.error("La IA tampoco pudo identificar una columna de nombre en este CSV. Revisá el formato o usá la plantilla.");
                return;
            }

            const parsedBlocks = csvRowsToBlocks(csvPendingAi.rows, mapping);
            const normalized = normalizeBlocks(parsedBlocks);
            if (normalized.length === 0) {
                notify.error("La IA mapeó las columnas pero no encontró filas válidas con nombre.");
                return;
            }
            setBlocks(normalized);
            setCsvPendingAi(null);
            notify.success(`¡Listo! La IA interpretó el CSV y se importaron ${normalized.length} bloques.`);
        } catch (err: any) {
            notify.error(err.message || "Error al interpretar el CSV con IA.");
        } finally {
            setCsvImporting(false);
        }
    };

    const handleAddBlock = (type: "individual" | "group") => {
        setBlocks([...blocks, {
            type,
            displayName: "",
            contactEmail: "",
            monetaryContribution: 0,
            logisticsToBring: [{ item: "", quantity: 1 }],
            members: type === "group" ? [{ name: "", email: "", monetaryContribution: 0, logisticsToBring: [{ item: "", quantity: 1 }] }] : []
        }]);
    };

    const handleRemoveBlock = (index: number) => {
        if (blocks.length === 1) return;
        setBlocks(blocks.filter((_, i) => i !== index));
    };

    const handleBlockChange = (index: number, field: keyof Omit<ParticipantBlock, "logisticsToBring" | "members">, value: any) => {
        setBlocks((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddCollabRow = (bIndex: number) => {
        setBlocks((prev) => {
            const updated = [...prev];
            updated[bIndex] = { ...updated[bIndex], logisticsToBring: [...updated[bIndex].logisticsToBring, { item: "", quantity: 1 }] };
            return updated;
        });
    };

    const handleRemoveCollabRow = (bIndex: number, cIndex: number) => {
        setBlocks((prev) => {
            const updated = [...prev];
            if (updated[bIndex].logisticsToBring.length === 1) return prev;
            updated[bIndex] = { ...updated[bIndex], logisticsToBring: updated[bIndex].logisticsToBring.filter((_, i) => i !== cIndex) };
            return updated;
        });
    };

    const handleCollabChange = (bIndex: number, cIndex: number, field: keyof CollabItem, value: any) => {
        setBlocks((prev) => {
            const updated = [...prev];
            const list = [...updated[bIndex].logisticsToBring];
            list[cIndex] = { ...list[cIndex], [field]: value };
            updated[bIndex] = { ...updated[bIndex], logisticsToBring: list };
            return updated;
        });
    };

    const handleAddMember = (bIndex: number) => {
        setBlocks((prev) => {
            const updated = [...prev];
            updated[bIndex] = {
                ...updated[bIndex],
                members: [
                    ...(updated[bIndex].members || []),
                    { name: "", email: "", contactType: "email", contactValue: "", contactPhone: "", monetaryContribution: 0, logisticsToBring: [{ item: "", quantity: 1 }] }
                ]
            };
            return updated;
        });
    };

    const handleRemoveMember = (bIndex: number, mIndex: number) => {
        setBlocks((prev) => {
            const updated = [...prev];
            updated[bIndex] = { ...updated[bIndex], members: (updated[bIndex].members || []).filter((_, i) => i !== mIndex) };
            return updated;
        });
    };

    const handleMemberChange = (bIndex: number, mIndex: number, field: keyof Omit<GroupMember, "logisticsToBring">, value: any) => {
        setBlocks((prev) => {
            const updated = [...prev];
            const members = [...(updated[bIndex].members || [])];
            members[mIndex] = { ...members[mIndex], [field]: value };
            updated[bIndex] = { ...updated[bIndex], members };
            return updated;
        });
    };

    const handleAddMemberCollab = (bIndex: number, mIndex: number) => {
        setBlocks((prev) => {
            const updated = [...prev];
            const members = [...(updated[bIndex].members || [])];
            members[mIndex] = { ...members[mIndex], logisticsToBring: [...(members[mIndex].logisticsToBring || []), { item: "", quantity: 1 }] };
            updated[bIndex] = { ...updated[bIndex], members };
            return updated;
        });
    };

    const handleMemberCollabChange = (bIndex: number, mIndex: number, cIndex: number, field: keyof CollabItem, value: any) => {
        setBlocks((prev) => {
            const updated = [...prev];
            const members = [...(updated[bIndex].members || [])];
            const list = [...(members[mIndex].logisticsToBring || [])];
            list[cIndex] = { ...list[cIndex], [field]: value };
            members[mIndex] = { ...members[mIndex], logisticsToBring: list };
            updated[bIndex] = { ...updated[bIndex], members };
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: "", type: "" });

        const cleanPayload = blocks
            .filter(b => b.displayName.trim() !== "")
            .map((b) => {
                const base: any = {
                    type: b.type,
                    displayName: b.displayName,
                    contactEmail: b.contactValue || b.contactEmail || "",
                    contactType: b.contactType || (b.contactValue || b.contactEmail ? "email" : "none"),
                    contactValue: b.contactValue || b.contactEmail || b.contactPhone || "",
                    contactPhone: b.contactPhone || "",
                    monetaryContribution: b.monetaryContribution,
                    logisticsToBring: b.logisticsToBring,
                    members: [],
                };
                if (b.type === "group") {
                    base.members = b.members.map((m) => ({
                        name: m.name,
                        email: m.contactValue || m.email || "",
                        contactType: m.contactType || ((m.contactValue || m.email) ? "email" : m.contactPhone ? "phone" : "none"),
                        contactValue: m.contactValue || m.email || m.contactPhone || "",
                        contactPhone: m.contactPhone || "",
                        monetaryContribution: m.monetaryContribution,
                        logisticsToBring: m.logisticsToBring,
                    }));
                }
                return base;
            });

        try {
            const res = await fetch(apiUrl(`/api/events/${eventId}/participants/json-sync`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participants: cleanPayload }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al procesar el lote.");

            setMessage({ text: "¡Lote de asistencia sincronizado con éxito!", type: "success" });
            router.push(`/events/${eventId}`);
        } catch (err: any) {
            setMessage({ text: err.message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    // Sin permiso no hay formulario: el POST /participants/json-sync pide events.edit.
    if (ready && !canManageAttendance) {
        return (
            <div className="max-w-xl mx-auto px-4 py-24 text-center">
                <h1 className="text-xl font-black uppercase text-slate-200">Acceso restringido</h1>
                <p className="text-sm text-slate-500 mt-2">
                    Tu rol no puede administrar la asistencia de los eventos.
                </p>
                <button
                    type="button"
                    onClick={() => router.push(`/events/${eventId}`)}
                    className="mt-6 px-4 py-2 text-xs font-bold bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 transition-all active:scale-95"
                >
                    ← Volver al evento
                </button>
            </div>
        );
    }

    if (fetching) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-12 text-center text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">
                Sincronizando perfiles y colectivos de asistencia...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 bg-slate-950 text-slate-100 min-h-screen mt-4 antialiased selection:bg-indigo-500/30 relative">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-300/80 dark:border-slate-800 pb-6 mb-8 gap-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Logística Flexible</span>
                    <h1 className="text-3xl font-black tracking-tight text-white mt-1">Lote Dinámico de Asistencia</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1.5">
                        Registra personas o colectivos asignando presupuestos y checklist de items.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => router.push(`/events/${eventId}`)}
                    className="px-4 py-2 text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl hover:bg-slate-200 transition-all text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-300 active:scale-95 shrink-0"
                >
                    ← Volver al evento
                </button>
            </div>

            {message.text && (
                <div className={`p-4 mb-8 rounded-xl text-xs font-bold border backdrop-blur-md ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30" : "bg-rose-50 text-rose-700 border-rose-300/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-500/30"
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Inserción Rápida */}
            <div className="bg-white/80 border border-slate-300/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 mb-6 shadow-sm dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-xl">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Inyectar estructura al lote:</span>
                <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => handleAddBlock("individual")}                         className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 transition-all active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200">
                        + Persona Individual
                    </button>
                    <button type="button" onClick={() => handleAddBlock("group")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl text-white transition-all shadow-lg active:scale-95">
                        + Colectivo / Grupo
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCsvFileSelected(file);
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={csvImporting}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl border border-dashed border-slate-400 text-slate-700 transition-all active:scale-95 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                    >
                        {csvImporting ? "Importando..." : "📄 Importar CSV"}
                    </button>
                    <button
                        type="button"
                        onClick={downloadCsvTemplate}
                        className="px-3 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                    >
                        Descargar plantilla
                    </button>
                </div>
            </div>

            {csvPendingAi && (
                <div className="p-4 mb-6 rounded-xl text-xs border border-amber-500/30 bg-amber-50 text-amber-800 flex flex-wrap items-center justify-between gap-3 dark:bg-amber-950/30 dark:text-amber-300">
                    <span className="font-semibold">
                        No reconocí automáticamente las columnas de ese CSV (le falta a la columna de nombre calzar con algo esperado).
                        ¿Querés que la IA intente interpretarlas? Solo le mando los nombres de columna, nunca los datos de las personas.
                    </span>
                    <div className="flex gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleAiAssistedCsvImport}
                            disabled={csvImporting}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-500 dark:text-slate-950"
                        >
                            {csvImporting ? "Interpretando..." : "Usar IA para interpretar"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCsvPendingAi(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}


            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                    {blocks.map((block, bIndex) => (
                        <div key={bIndex} className={`p-6 rounded-2xl border shadow-xl relative transition-all bg-gradient-to-b from-slate-900 to-slate-950 ${block.type === "group" ? "border-indigo-500/40" : "border-slate-800"}`}>

                            <div className={`absolute -top-2.5 left-4 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-md ${block.type === 'group' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                {block.type === "group" ? "👥 Bloque Colectivo" : "👤 Individual Fijo"}
                            </div>

                            {blocks.length > 1 && (
                                <button type="button" onClick={() => handleRemoveBlock(bIndex)} className="absolute top-4 right-4 text-xs font-bold text-slate-500 hover:text-rose-400">✕ Quitar</button>
                            )}

                            {/* Datos Base */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 mb-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{block.type === "group" ? "Nombre de la Mesa / Colectivo *" : "Nombre Completo *"}</label>
                                    <input type="text" required value={block.displayName} onChange={(e) => handleBlockChange(bIndex, "displayName", e.target.value)} placeholder={block.type === "group" ? "Ej: Protocolo, Familia Pérez" : "Ej: Juan Soto"} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white" />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Contacto</label>
                                    <select
                                        value={block.contactType || "email"}
                                        onChange={(e) => {
                                            const t = e.target.value as "email" | "phone" | "none";
                                            setBlocks((prev) => {
                                                const updated = [...prev];
                                                updated[bIndex] = {
                                                    ...updated[bIndex],
                                                    contactType: t,
                                                    contactPhone: t === "email" ? "" : updated[bIndex].contactPhone,
                                                    contactEmail: t === "phone" ? "" : updated[bIndex].contactEmail,
                                                };
                                                return updated;
                                            });
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                                    >
                                        <option value="email">Correo</option>
                                        <option value="phone">Teléfono</option>
                                        <option value="none">No aplica</option>
                                    </select>
                                    {block.contactType === "email" && (
                                        <input type="email" value={block.contactValue || block.contactEmail || ""} onChange={(e) => { handleBlockChange(bIndex, "contactValue", e.target.value); handleBlockChange(bIndex, "contactEmail", e.target.value); }} placeholder="correo@ejemplo.com" className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white" />
                                    )}
                                    {block.contactType === "phone" && (
                                        <input type="tel" value={block.contactValue || block.contactPhone || ""} onChange={(e) => { handleBlockChange(bIndex, "contactValue", e.target.value); handleBlockChange(bIndex, "contactPhone", e.target.value); }} placeholder="+56 9 1234 5678" className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white" />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5">{block.type === "group" ? "Fondo Financiero Grupal ($)" : "Aporte Monetario Individual ($)"}</label>
                                    <input type="number" min="0" step="0.01" value={block.monetaryContribution} onChange={(e) => handleBlockChange(bIndex, "monetaryContribution", parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-emerald-400 font-mono font-bold" />
                                </div>
                            </div>

                            {/* Logística Base */}
                            <div className="border-t border-slate-800/80 pt-4 mt-2">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Insumos Generales del Bloque</span>
                                    <button type="button" onClick={() => handleAddCollabRow(bIndex)} className="text-xs text-indigo-400 font-bold">+ Agregar Item</button>
                                </div>
                                <div className="space-y-2">
                                    {block.logisticsToBring.map((collab, cIndex) => (
                                        <div key={cIndex} className="flex space-x-2 items-center">
                                            <input type="text" value={collab.item} onChange={(e) => handleCollabChange(bIndex, cIndex, "item", e.target.value)} placeholder="Descripción del recurso..." className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-300" />
                                            <input type="number" min="1" value={collab.quantity} onChange={(e) => handleCollabChange(bIndex, cIndex, "quantity", parseInt(e.target.value) || 1)} className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center text-indigo-400 font-mono font-bold" />
                                            {block.logisticsToBring.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveCollabRow(bIndex, cIndex)} className="text-xs text-slate-600 hover:text-rose-400 px-2">✕</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Integrantes Colectivos */}
                            {block.type === "group" && (
                                <div className="border-t border-slate-800/80 pt-6 mt-6 bg-slate-950/40 p-4 rounded-xl border border-dashed border-slate-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-black uppercase tracking-widest text-indigo-400">👤 Integrantes del Colectivo</span>
                                        <button type="button" onClick={() => handleAddMember(bIndex)} className="px-3 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] font-bold rounded-lg text-slate-300 transition-colors">+ Añadir Integrante</button>
                                    </div>

                                    <div className="space-y-4">
                                        {block.members.map((member, mIndex) => (
                                            <div key={mIndex} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 relative">
                                                <button type="button" onClick={() => handleRemoveMember(bIndex, mIndex)} className="absolute top-3 right-3 text-[10px] text-slate-600 hover:text-rose-400 font-bold">✕ Quitar</button>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nombre Completo *</label>
                                                        <input type="text" required value={member.name} onChange={(e) => handleMemberChange(bIndex, mIndex, "name", e.target.value)} placeholder="Nombre del miembro" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Contacto</label>
                                                        <select
                                                            value={member.contactType || (member.email ? "email" : "none")}
                                                                onChange={(e) => {
                                                                    const t = e.target.value as "email" | "phone" | "none";
                                                                    setBlocks((prev) => {
                                                                        const updated = [...prev];
                                                                        const members = [...(updated[bIndex].members || [])];
                                                                        members[mIndex] = {
                                                                            ...members[mIndex],
                                                                            contactType: t,
                                                                            contactPhone: t === "email" ? "" : members[mIndex].contactPhone,
                                                                            email: t === "phone" ? "" : members[mIndex].email,
                                                                        };
                                                                        updated[bIndex] = { ...updated[bIndex], members };
                                                                        return updated;
                                                                    });
                                                                }}
                                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                                        >
                                                            <option value="email">Correo</option>
                                                            <option value="phone">Teléfono</option>
                                                            <option value="none">No aplica</option>
                                                        </select>
                                                        {member.contactType === "email" && (
                                                            <input type="email" value={member.contactValue || member.email || ""} onChange={(e) => { handleMemberChange(bIndex, mIndex, "contactValue", e.target.value); handleMemberChange(bIndex, mIndex, "email", e.target.value); }} placeholder="miembro@correo.com" className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                                                        )}
                                                        {member.contactType === "phone" && (
                                                            <input type="tel" value={member.contactValue || member.contactPhone || ""} onChange={(e) => { handleMemberChange(bIndex, mIndex, "contactValue", e.target.value); handleMemberChange(bIndex, mIndex, "contactPhone", e.target.value); }} placeholder="+56..." className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-indigo-400 mb-1">Aporte Propio ($)</label>
                                                        <input type="number" min="0" step="0.01" value={member.monetaryContribution} onChange={(e) => handleMemberChange(bIndex, mIndex, "monetaryContribution", parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold" />
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Items de este Miembro</span>
                                                        <button type="button" onClick={() => handleAddMemberCollab(bIndex, mIndex)} className="text-[10px] text-indigo-400 font-bold">+ Registrar Insumo</button>
                                                    </div>
                                                    {member.logisticsToBring.map((mCollab, mcIndex) => (
                                                        <div key={mcIndex} className="flex space-x-2 items-center mb-1.5">
                                                            <input type="text" value={mCollab.item} onChange={(e) => handleMemberCollabChange(bIndex, mIndex, mcIndex, "item", e.target.value)} placeholder="Ej: Cables, Laptop..." className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-300" />
                                                            <input type="number" min="1" value={mCollab.quantity} onChange={(e) => handleMemberCollabChange(bIndex, mIndex, mcIndex, "quantity", parseInt(e.target.value) || 1)} className="w-16 bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-center text-indigo-400 font-mono" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    ))}
                </div>

                <div className="flex justify-end border-t border-slate-800/80 pt-6">
                    <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-xs rounded-xl uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 disabled:bg-slate-900">
                        {loading ? "Sincronizando Payload..." : "Confirmar e Inyectar Asistentes"}
                    </button>
                </div>
            </form>

            {/* El chatbot ahora edita directamente el estado 'blocks' del formulario */}
            <ChatBotFAB>
                {({ closeChat }) => (
                    <ChatBotWindow
                        closeChat={closeChat}
                        currentBlocks={blocks}
                        onBlocksUpdated={handleAIBlocksUpdated}
                    />
                )}
            </ChatBotFAB>
        </div>
    );
}