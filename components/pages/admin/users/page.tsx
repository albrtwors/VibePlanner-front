"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch, getClientProfile } from "@/utils/proxy";
import { hasPermission, roleLabel } from "@/utils/permissions";
import { notify } from "@/utils/toast";
import {
    Search,
    UserPlus,
    Pencil,
    Trash2,
    KeyRound,
    ShieldCheck,
    X,
    Loader2,
    Ban,
    CheckCircle2,
    MailCheck,
    Users as UsersIcon
} from "lucide-react";

type Role = {
    id: number;
    name: string;
    description: string | null;
    is_protected: boolean;
    users_count: number;
};

type UserRow = {
    id: number;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string | null;
};

const EMPTY_FORM = {
    id: 0,
    username: "",
    email: "",
    password: "",
    role: "usuario",
    is_active: true,
    is_verified: true
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [myId, setMyId] = useState<number | null>(null);
    const [can, setCan] = useState({
        view: false, create: false, edit: false, remove: false
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [formOpen, setFormOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pwOpen, setPwOpen] = useState<UserRow | null>(null);
    const [pwValue, setPwValue] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

    const loadUsers = useCallback(async () => {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (roleFilter) params.set("role", roleFilter);
        const query = params.toString();

        const data = await apiFetch<UserRow[]>(`/users${query ? `?${query}` : ""}`);
        setUsers(data);
    }, [search, roleFilter]);

    useEffect(() => {
        (async () => {
            const profile = await getClientProfile();
            const perms = profile?.permissions ?? [];
            setCan({
                view: hasPermission(perms, "users.view"),
                create: hasPermission(perms, "users.create"),
                edit: hasPermission(perms, "users.edit"),
                remove: hasPermission(perms, "users.delete")
            });
            setMyId(profile?.user_id ?? null);

            if (!hasPermission(perms, "users.view")) {
                setLoading(false);
                return;
            }

            try {
                const [userData, roleData] = await Promise.all([
                    apiFetch<UserRow[]>("/users"),
                    apiFetch<Role[]>("/roles")
                ]);
                setUsers(userData);
                setRoles(roleData);
            } catch (err) {
                notify.error((err as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Búsqueda con debounce para no pegarle al backend en cada tecla
    useEffect(() => {
        if (!can.view) return;
        const timer = setTimeout(() => {
            loadUsers().catch((err) => notify.error((err as Error).message));
        }, 300);
        return () => clearTimeout(timer);
    }, [search, roleFilter, can.view, loadUsers]);

    const stats = useMemo(() => ({
        total: users.length,
        admins: users.filter(u => u.role === "admin").length,
        inactive: users.filter(u => !u.is_active).length,
        unverified: users.filter(u => !u.is_verified).length
    }), [users]);

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, role: roles.find(r => r.name === "usuario")?.name ?? "usuario" });
        setFormOpen(true);
    };

    const openEdit = (user: UserRow) => {
        setForm({
            id: user.id,
            username: user.username,
            email: user.email,
            password: "",
            role: user.role,
            is_active: user.is_active,
            is_verified: user.is_verified
        });
        setFormOpen(true);
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const toastId = notify.loading();

        try {
            if (form.id) {
                await apiFetch(`/users/${form.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        username: form.username,
                        email: form.email,
                        role: form.role,
                        is_active: form.is_active,
                        is_verified: form.is_verified
                    })
                });
                notify.close(toastId);
                notify.success("Usuario actualizado.");
            } else {
                const result = await apiFetch<UserRow>("/users", {
                    method: "POST",
                    body: JSON.stringify({
                        username: form.username,
                        email: form.email,
                        password: form.password,
                        role: form.role,
                        is_active: form.is_active,
                        is_verified: form.is_verified
                    })
                });
                notify.close(toastId);
                notify.success(result?.message || "Usuario creado.");
                if (result?.dev_code) {
                    notify.warning(`Código de verificación (modo dev): ${result.dev_code}`);
                }
            }
            setFormOpen(false);
            await loadUsers();
        } catch (err) {
            notify.close(toastId);
            notify.error((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pwOpen) return;
        const toastId = notify.loading();
        try {
            await apiFetch(`/users/${pwOpen.id}/password`, {
                method: "PUT",
                body: JSON.stringify({ password: pwValue })
            });
            notify.close(toastId);
            notify.success(`Contraseña de '${pwOpen.username}' actualizada.`);
            setPwOpen(null);
            setPwValue("");
        } catch (err) {
            notify.close(toastId);
            notify.error((err as Error).message);
        }
    };

    const remove = async () => {
        if (!confirmDelete) return;
        const toastId = notify.loading();
        try {
            const result = await apiFetch(`/users/${confirmDelete.id}`, { method: "DELETE" });
            notify.close(toastId);
            notify.success(result?.message || "Usuario eliminado.");
            setConfirmDelete(null);
            await loadUsers();
        } catch (err) {
            notify.close(toastId);
            notify.error((err as Error).message);
        }
    };

    const toggle = async (user: UserRow, field: "is_active" | "is_verified") => {
        const toastId = notify.loading();
        try {
            await apiFetch(`/users/${user.id}`, {
                method: "PUT",
                body: JSON.stringify({ [field]: !user[field] })
            });
            notify.close(toastId);
            notify.success(field === "is_active"
                ? (user.is_active ? "Cuenta desactivada." : "Cuenta activada.")
                : (user.is_verified ? "Se quitó la verificación." : "Cuenta verificada."));
            await loadUsers();
        } catch (err) {
            notify.close(toastId);
            notify.error((err as Error).message);
        }
    };

    if (!can.view) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-24 text-center">
                <ShieldCheck className="w-12 h-12 mx-auto text-rose-500 mb-4" />
                <h1 className="text-xl font-black uppercase text-slate-200">Acceso restringido</h1>
                <p className="text-sm text-slate-500 mt-2">
                    Necesitás el permiso <span className="font-mono text-indigo-400">users.view</span> para ver esta sección.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 font-medium text-slate-100 flex flex-col gap-6">
            {/* Encabezado */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">Usuarios</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Cuentas, roles y estado de acceso
                    </p>
                </div>
                {can.create && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" /> Nuevo usuario
                    </button>
                )}
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Usuarios", value: stats.total, icon: UsersIcon, tone: "text-indigo-400" },
                    { label: "Admins", value: stats.admins, icon: ShieldCheck, tone: "text-amber-400" },
                    { label: "Inactivos", value: stats.inactive, icon: Ban, tone: "text-rose-400" },
                    { label: "Sin verificar", value: stats.unverified, icon: MailCheck, tone: "text-slate-400" }
                ].map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
                            <Icon className={`w-4 h-4 ${tone}`} />
                        </div>
                        <p className="mt-1 text-2xl font-black font-mono">{value}</p>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o correo..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none"
                >
                    <option value="">Todos los roles</option>
                    {roles.map(role => (
                        <option key={role.id} value={role.name}>{roleLabel(role.name)}</option>
                    ))}
                </select>
            </div>

            {/* Tabla */}
            {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando usuarios...
                </div>
            ) : users.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 py-16 text-center text-slate-500">
                    No hay usuarios que coincidan con el filtro.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-950/60 text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="text-left font-bold px-4 py-3">Usuario</th>
                                <th className="text-left font-bold px-4 py-3">Rol</th>
                                <th className="text-left font-bold px-4 py-3">Estado</th>
                                <th className="text-right font-bold px-4 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                                            {user.username}
                                            {user.id === myId && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/40 rounded px-1.5 py-0.5">
                                                    vos
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
                                            user.role === "admin"
                                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                                : "bg-slate-800/60 text-slate-300 border border-slate-700"
                                        }`}>
                                            {roleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {user.is_active ? (
                                                <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="rounded-lg bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-400 border border-rose-500/30">
                                                    Inactivo
                                                </span>
                                            )}
                                            {user.is_verified ? (
                                                <span title="Verificado">
                                                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                                </span>
                                            ) : (
                                                <span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-400 border border-slate-700">
                                                    Sin verificar
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {can.edit && (
                                                <>
                                                    <button
                                                        onClick={() => openEdit(user)}
                                                        title="Editar"
                                                        className="rounded-lg p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setPwOpen(user); setPwValue(""); }}
                                                        title="Cambiar contraseña"
                                                        className="rounded-lg p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                                    >
                                                        <KeyRound className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => toggle(user, "is_active")}
                                                        title={user.is_active ? "Desactivar" : "Activar"}
                                                        className="rounded-lg p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                                                    >
                                                        {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => toggle(user, "is_verified")}
                                                        title={user.is_verified ? "Quitar verificación" : "Marcar verificado"}
                                                        className="rounded-lg p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                                                    >
                                                        <MailCheck className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {can.remove && user.id !== myId && (
                                                <button
                                                    onClick={() => setConfirmDelete(user)}
                                                    title="Eliminar"
                                                    className="rounded-lg p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal alta / edición */}
            {formOpen && (
                <Modal title={form.id ? "Editar usuario" : "Nuevo usuario"} onClose={() => setFormOpen(false)}>
                    <form onSubmit={save} className="flex flex-col gap-4">
                        <Field label="Nombre de usuario">
                            <input
                                required
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Correo">
                            <input
                                required
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        {!form.id && (
                            <Field label="Contraseña" hint="Mínimo 6 caracteres">
                                <input
                                    required
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className={inputClass}
                                />
                            </Field>
                        )}
                        <Field label="Rol">
                            <select
                                value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value })}
                                className={inputClass}
                            >
                                {roles.map(role => (
                                    <option key={role.id} value={role.name}>{roleLabel(role.name)}</option>
                                ))}
                            </select>
                        </Field>
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                className="accent-indigo-500"
                            />
                            Cuenta activa
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                                type="checkbox"
                                checked={form.is_verified}
                                onChange={e => setForm({ ...form, is_verified: e.target.checked })}
                                className="accent-indigo-500"
                            />
                            Email verificado
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setFormOpen(false)} className={btnGhost}>
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Guardar
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal contraseña */}
            {pwOpen && (
                <Modal title={`Contraseña de ${pwOpen.username}`} onClose={() => setPwOpen(null)}>
                    <form onSubmit={savePassword} className="flex flex-col gap-4">
                        <Field label="Nueva contraseña" hint="Mínimo 6 caracteres">
                            <input
                                required
                                type="password"
                                value={pwValue}
                                onChange={e => setPwValue(e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <p className="text-xs text-slate-500">
                            El usuario no va a tener que usar el código de verificación: la contraseña queda lista para entrar.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setPwOpen(null)} className={btnGhost}>
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
                            >
                                Actualizar
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Confirmación de borrado */}
            {confirmDelete && (
                <Modal title="Eliminar usuario" onClose={() => setConfirmDelete(null)}>
                    <p className="text-sm text-slate-300">
                        ¿Vas a eliminar <span className="font-bold text-white">{confirmDelete.username}</span> ({confirmDelete.email})?
                        La acción no se puede deshacer.
                    </p>
                    <p className="text-xs text-slate-500">
                        Sus canciones, archivos y registros quedan sin dueño, pero no se borran.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
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

/* ---------- piezas visuales reutilizables ---------- */

const inputClass =
    "w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none";

const btnGhost =
    "rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {label}
                {hint && <span className="ml-2 normal-case tracking-normal text-slate-600">{hint}</span>}
            </span>
            {children}
        </label>
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