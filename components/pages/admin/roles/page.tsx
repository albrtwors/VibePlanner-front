"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch, getClientProfile } from "@/utils/proxy";
import { hasPermission, roleLabel } from "@/utils/permissions";
import { notify } from "@/utils/toast";
import {
    ShieldCheck,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    Save,
    Lock,
    X,
    Loader2,
    Check
} from "lucide-react";

type PermissionItem = { key: string; label: string; description: string | null };

type RoleRow = {
    id: number;
    name: string;
    description: string | null;
    is_system: boolean;
    is_protected: boolean;
    users_count: number;
    permissions: string[];
};

const inputClass =
    "w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none";

const btnGhost =
    "rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors";

export default function AdminRolesPage() {
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [modules, setModules] = useState<Record<string, PermissionItem[]>>({});
    const [can, setCan] = useState({ view: false, manage: false });
    const [selected, setSelected] = useState<number | null>(null);
    const [draft, setDraft] = useState<Set<string>>(new Set());
    const [dirty, setDirty] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [newRole, setNewRole] = useState({ name: "", description: "" });
    const [editingMeta, setEditingMeta] = useState<RoleRow | null>(null);
    const [metaForm, setMetaForm] = useState({ name: "", description: "" });
    const [confirmDelete, setConfirmDelete] = useState<RoleRow | null>(null);

    const current = useMemo(() => roles.find(r => r.id === selected) ?? null, [roles, selected]);

    const loadRoles = useCallback(async () => {
        const data = await apiFetch<RoleRow[]>("/roles");
        setRoles(data);
        setSelected(prev => (prev && data.some(r => r.id === prev) ? prev : (data[0]?.id ?? null)));
    }, []);

    useEffect(() => {
        (async () => {
            const profile = await getClientProfile();
            const perms = profile?.permissions ?? [];
            const canManage = hasPermission(perms, "roles.manage");
            setCan({ view: hasPermission(perms, "roles.view"), manage: canManage });

            if (!hasPermission(perms, "roles.view")) {
                setLoading(false);
                return;
            }

            try {
                const [roleData, permData] = await Promise.all([
                    apiFetch<RoleRow[]>("/roles"),
                    apiFetch<{ modules: Record<string, PermissionItem[]> }>("/permissions")
                ]);
                setRoles(roleData);
                setModules(permData.modules);
                setSelected(roleData[0]?.id ?? null);
                setDraft(new Set(roleData[0]?.permissions ?? []));
            } catch (err) {
                notify.error((err as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Cambiar de rol = arrancar la matriz con lo que tiene guardado
    const selectRole = (id: number) => {
        const role = roles.find(r => r.id === id);
        setSelected(id);
        setDraft(new Set(role?.permissions ?? []));
        setDirty(false);
    };

    const togglePermission = (key: string) => {
        if (!can.manage || !current || current.is_protected) return;
        setDraft(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
        setDirty(true);
    };

    const toggleModule = (module: string, items: PermissionItem[]) => {
        if (!can.manage || !current || current.is_protected) return;
        setDraft(prev => {
            const next = new Set(prev);
            const allOn = items.every(item => next.has(item.key));
            items.forEach(item => (allOn ? next.delete(item.key) : next.add(item.key)));
            return next;
        });
        setDirty(true);
    };

    const saveMatrix = async () => {
        if (!current) return;
        setSaving(true);
        const toastId = notify.loading();
        try {
            const result = await apiFetch(`/roles/${current.id}/permissions`, {
                method: "PUT",
                body: JSON.stringify({ permissions: Array.from(draft) })
            });
            notify.close(toastId);
            notify.success(result?.message || "Permisos actualizados.");
            setDraft(new Set(result?.role?.permissions ?? Array.from(draft)));
            await loadRoles();
            setDirty(false);
        } catch (err) {
            notify.close(toastId);
            notify.error((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const restore = async () => {
        if (!current) return;
        const toastId = notify.loading();
        try {
            const result = await apiFetch(`/roles/${current.id}/restore-permissions`, { method: "POST" });
            notify.close(toastId);
            notify.success(result?.message || "Permisos originales restaurados.");
            setDraft(new Set(result?.role?.permissions ?? []));
            await loadRoles();
            setDirty(false);
        } catch (err) {
            notify.close(toastId);
            notify.error((err as Error).message);
        }
    };

    const createRole = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = notify.loading();
        try {
            const result = await apiFetch<RoleRow>("/roles", {
                method: "POST",
                body: JSON.stringify({ ...newRole, permissions: [] })
            });
            notify.close(toastId);
            notify.success(result?.message || "Rol creado.");
            setCreateOpen(false);
            setNewRole({ name: "", description: "" });
            await loadRoles();
            setSelected(result?.role?.id ?? null);
        } catch (err) {
            notify.close(toastId);
            notify.error((err as Error).message);
        }
    };

    const saveMeta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMeta) return;
        const toastId = notify.loading();
        try {
            const result = await apiFetch(`/roles/${editingMeta.id}`, {
                method: "PUT",
                body: JSON.stringify(metaForm)
            });
            notify.close(toastId);
            notify.success(result?.message || "Rol actualizado.");
            setEditingMeta(null);
            await loadRoles();
        } catch (err) {
            notify.close(toastId);
            notify.error((err as Error).message);
        }
    };

    const remove = async () => {
        if (!confirmDelete) return;
        const toastId = notify.loading();
        try {
            const result = await apiFetch(`/roles/${confirmDelete.id}`, { method: "DELETE" });
            notify.close(toastId);
            notify.success(result?.message || "Rol eliminado.");
            setConfirmDelete(null);
            await loadRoles();
        } catch (err) {
            notify.close(toastId);
            notify.error((err as Error).message);
        }
    };

    const totalPermissions = useMemo(
        () => Object.values(modules).reduce((sum, items) => sum + items.length, 0),
        [modules]
    );

    if (!can.view) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-24 text-center">
                <ShieldCheck className="w-12 h-12 mx-auto text-rose-500 mb-4" />
                <h1 className="text-xl font-black uppercase text-slate-200">Acceso restringido</h1>
                <p className="text-sm text-slate-500 mt-2">
                    Necesitás el permiso <span className="font-mono text-indigo-400">roles.view</span> para ver esta sección.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 font-medium text-slate-100 flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">Roles y Permisos</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Qué puede hacer cada rol dentro del sistema
                    </p>
                </div>
                {can.manage && (
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Nuevo rol
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                {/* Lista de roles */}
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <div className="bg-slate-950/60 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {roles.length} roles · {totalPermissions} permisos
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-800/70">
                            {roles.map(role => {
                                const active = role.id === selected;
                                return (
                                    <li key={role.id}>
                                        <button
                                            onClick={() => selectRole(role.id)}
                                            className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
                                                active ? "bg-indigo-500/10 border-l-2 border-indigo-500" : "hover:bg-slate-900/60"
                                            }`}
                                        >
                                            <div>
                                                <div className={`text-sm font-bold ${active ? "text-indigo-300" : "text-slate-200"}`}>
                                                    {roleLabel(role.name)}
                                                    {role.is_protected && <Lock className="inline w-3 h-3 ml-1 text-amber-400" />}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    {role.permissions.length} permisos · {role.users_count} usuario{role.users_count === 1 ? "" : "s"}
                                                </div>
                                            </div>
                                            {can.manage && (
                                                <span className="flex items-center gap-1">
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingMeta(role);
                                                            setMetaForm({ name: role.name, description: role.description || "" });
                                                        }}
                                                        onKeyDown={() => {}}
                                                        className="rounded-lg p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </span>
                                                    {!role.is_protected && (
                                                        <span
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(role); }}
                                                            onKeyDown={() => {}}
                                                            className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Matriz */}
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                    {current ? (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/60 px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">
                                        {roleLabel(current.name)}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                                        {current.description || "Sin descripción."}
                                    </p>
                                </div>
                                {can.manage && !current.is_protected && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={restore}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-50"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                                        </button>
                                        <button
                                            onClick={saveMatrix}
                                            disabled={!dirty || saving}
                                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40"
                                        >
                                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            Guardar cambios
                                        </button>
                                    </div>
                                )}
                            </div>

                            {current.is_protected && (
                                <div className="flex items-start gap-2 border-b border-amber-500/20 bg-amber-500/5 px-5 py-3 text-xs text-amber-300">
                                    <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>
                                        El administrador tiene todos los permisos siempre: es la garantía de que el sistema
                                        nunca queda sin alguien que pueda administrarlo.
                                    </span>
                                </div>
                            )}

                            <div className="divide-y divide-slate-800/70">
                                {Object.entries(modules).map(([module, items]) => {
                                    const granted = Array.from(draft);
                                    const allOn = items.every(item => granted.includes(item.key));
                                    return (
                                        <div key={module} className="px-5 py-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                                    {module}
                                                </h3>
                                                {can.manage && !current.is_protected && (
                                                    <button
                                                        onClick={() => toggleModule(module, items)}
                                                        className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300"
                                                    >
                                                        {allOn ? "Quitar todos" : "Marcar todos"}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {items.map(item => {
                                                    const on = draft.has(item.key);
                                                    return (
                                                        <label
                                                            key={item.key}
                                                            className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                                                                on
                                                                    ? "border-indigo-500/40 bg-indigo-500/5"
                                                                    : "border-slate-800 bg-slate-950/30"
                                                            } ${can.manage && !current.is_protected ? "cursor-pointer hover:border-slate-700" : "opacity-90"}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={on}
                                                                disabled={!can.manage || current.is_protected}
                                                                onChange={() => togglePermission(item.key)}
                                                                className="mt-0.5 accent-indigo-500"
                                                            />
                                                            <span className="min-w-0">
                                                                <span className="block text-sm font-semibold text-slate-200">
                                                                    {item.label}
                                                                </span>
                                                                <span className="block text-[11px] text-slate-500">
                                                                    {item.description}
                                                                </span>
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {dirty && (
                                <div className="flex items-center justify-between gap-3 border-t border-slate-800 bg-indigo-500/5 px-5 py-3">
                                    <span className="text-xs font-semibold text-indigo-300">
                                        Hay cambios sin guardar en la matriz de {roleLabel(current.name)}.
                                    </span>
                                    {can.manage && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setDraft(new Set(current.permissions));
                                                    setDirty(false);
                                                }}
                                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
                                            >
                                                Descartar
                                            </button>
                                            <button
                                                onClick={saveMatrix}
                                                disabled={saving}
                                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-20 text-center text-slate-500">Elegí un rol para ver sus permisos.</div>
                    )}
                </div>
            </div>

            {/* Modal nuevo rol */}
            {createOpen && (
                <Modal title="Nuevo rol" onClose={() => setCreateOpen(false)}>
                    <form onSubmit={createRole} className="flex flex-col gap-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Nombre técnico
                            </span>
                            <input
                                required
                                value={newRole.name}
                                onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                                placeholder="bajo_produccion"
                                className={inputClass}
                            />
                            <span className="text-[11px] text-slate-600">
                                Solo minúsculas, números y guiones bajos. Ej: <span className="font-mono">bajo_produccion</span>
                            </span>
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Descripción</span>
                            <input
                                value={newRole.description}
                                onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                                className={inputClass}
                            />
                        </label>
                        <p className="text-xs text-slate-500">
                            El rol nace sin permisos: después los tildás en la matriz de la derecha.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setCreateOpen(false)} className={btnGhost}>
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                <Check className="w-4 h-4" /> Crear rol
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal editar metadata */}
            {editingMeta && (
                <Modal title={`Editar ${roleLabel(editingMeta.name)}`} onClose={() => setEditingMeta(null)}>
                    <form onSubmit={saveMeta} className="flex flex-col gap-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Nombre técnico
                            </span>
                            <input
                                required
                                value={metaForm.name}
                                onChange={e => setMetaForm({ ...metaForm, name: e.target.value })}
                                className={inputClass}
                            />
                            <span className="text-[11px] text-slate-600">
                                Si lo cambiás, los {editingMeta.users_count} usuario{editingMeta.users_count === 1 ? "" : "s"} de este rol
                                pasan al nombre nuevo automáticamente.
                            </span>
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Descripción</span>
                            <input
                                value={metaForm.description}
                                onChange={e => setMetaForm({ ...metaForm, description: e.target.value })}
                                className={inputClass}
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingMeta(null)} className={btnGhost}>
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal borrar */}
            {confirmDelete && (
                <Modal title="Eliminar rol" onClose={() => setConfirmDelete(null)}>
                    <p className="text-sm text-slate-300">
                        ¿Eliminar el rol <span className="font-bold text-white">{roleLabel(confirmDelete.name)}</span>?
                    </p>
                    <p className="text-xs text-slate-500">
                        Solo se puede si ningún usuario lo tiene asignado.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setConfirmDelete(null)} className={btnGhost}>
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={remove}
                            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
                        >
                            Eliminar
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex flex-col gap-4 px-5 py-5">{children}</div>
            </div>
        </div>
    );
}