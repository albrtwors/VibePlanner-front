"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getClientProfile } from "@/utils/proxy";
import { hasPermission } from "@/utils/permissions";
import { ShieldCheck } from "lucide-react";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

/**
 * Ruta -> permiso necesario para verla. La primera coincidencia gana, así que
 * las rutas más específicas van antes (/admin/users antes que /admin).
 */
const ROUTE_PERMISSIONS: Array<[string, string[]]> = [
    ["/admin/users", ["users.view"]],
    ["/admin/roles", ["roles.view"]],
    ["/dashboard", ["dashboard.view"]],
    ["/events", ["events.view"]],
    ["/expenses", ["expenses.view"]],
    ["/songs", ["songs.view"]],
    ["/chords", ["songs.edit"]],
    ["/files", ["files.view"]],
    ["/inventory", ["inventory.view"]],
    ["/genre", ["songs.view"]],
    ["/authors", ["songs.view"]],
    ["/chatbot", ["ai.use"]],
];

function requiredPermission(pathname: string): string[] | null {
    const match = ROUTE_PERMISSIONS.find(([prefix]) => pathname.startsWith(prefix));
    return match ? match[1] : null;
}

export default function RouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [allowed, setAllowed] = useState<boolean | null>(null);

    const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    const required = requiredPermission(pathname);
    const requiredKey = required ? required.join("/") : "";

    useEffect(() => {
        if (!requiredKey) return;

        let cancelled = false;
        (async () => {
            const profile = await getClientProfile();

            if (cancelled) return;

            // El backend igual lo bloquea con 403: esto es para no mostrar
            // una página a medio cargar cuando el permiso no está.
            setAllowed(profile ? hasPermission(profile.permissions, ...requiredKey.split("/")) : false);
        })();

        return () => { cancelled = true; };
    }, [requiredKey]);

    // Rutas públicas o sin permiso declarado: siempre pasa
    if (isPublic || !requiredKey) return <>{children}</>;

    if (allowed !== false) return <>{children}</>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-rose-500 mb-4" />
            <h1 className="text-xl font-black uppercase text-slate-200">Acceso restringido</h1>
            <p className="text-sm text-slate-500 mt-2">
                Tu rol no tiene el permiso
                <span className="font-mono text-indigo-400 mx-1">{required?.join(" / ")}</span>
                para ver esta sección.
            </p>
            <p className="text-xs text-slate-600 mt-4">
                Si creés que es un error, pedile a un administrador que revise tu matriz de permisos.
            </p>
        </div>
    );
}