"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiUrl } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";

export default function PaymentPage() {
    const params = useParams();
    const token = params?.token as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!token) return;
        fetch(apiUrl(`/api/public/payments/${token}`))
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setData(d))
            .catch(() => notify.error("Enlace inválido o expirado"))
            .finally(() => setLoading(false));
    }, [token]);

    const upload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return notify.error("Seleccioná una captura de pantalla");
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(apiUrl(`/api/public/payments/${token}`), { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Error al subir");
            notify.success("Comprobante enviado correctamente");
            setData((d: any) => ({ ...d, status: "submitted", screenshot_url: json.screenshot_url || d?.screenshot_url }));
        } catch (err: any) {
            notify.error(err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center text-slate-400">Enlace inválido o expirado</div>;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 p-6 shadow-xl">
                <h1 className="text-xl font-black">Comprobante de Pago Móvil</h1>
                <p className="text-sm text-slate-500 mt-1">VibePlanner</p>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Evento</span><span>{data.event?.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Participante</span><span>{data.participant_name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Aporte</span><span className="font-bold text-emerald-600 dark:text-emerald-400">$ {Number(data.amount).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Estado</span><span className="uppercase font-bold">{data.status}</span></div>
                </div>
                {data.status === "approved" && <p className="mt-4 text-emerald-600 dark:text-emerald-400 font-bold">Pago aprobado</p>}
                {data.status === "rejected" && <p className="mt-4 text-rose-600 dark:text-rose-400 font-bold">Pago rechazado. Contactá al administrador.</p>}
                {data.status === "submitted" && <p className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold">Comprobante enviado, pendiente de revisión.</p>}
                {(data.status === "pending" || data.status === "rejected") && (
                    <form onSubmit={upload} className="mt-6 space-y-3">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Captura de pantalla / comprobante</label>
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />
                        <button disabled={uploading || !file} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50">{uploading ? "Enviando..." : "Enviar comprobante"}</button>
                    </form>
                )}
                {data.screenshot_url && (
                    <div className="mt-4">
                        <p className="text-xs text-slate-500 mb-2">Comprobante cargado</p>
                        <a href={data.screenshot_url.startsWith('http') ? data.screenshot_url : apiUrl(data.screenshot_url)} target="_blank" rel="noreferrer" className="text-indigo-500 underline text-sm">Ver archivo</a>
                    </div>
                )}
            </div>
        </div>
    );
}
