import { ClientProfile } from "@/utils/permissions";

export async function getClientProfile(): Promise<ClientProfile | null> {
    try {
        // Al usar la ruta relativa /api/ el rewrite de next.config se activa solo
        const res = await fetch("/api/auth/profile", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include" // Esto asegura que las cookies HttpOnly se envíen automáticamente
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Error consultando el perfil:", error);
        return null;
    }
}

/** Lo que devuelve el backend cuando la operación fue exitosa. */
export type ApiResult<T> = {
    message?: string;
    error?: string;
    dev_code?: string;
    role?: T;
    user?: T;
} & T;

/**
 * Wrapper de fetch para el panel: siempre contra /api (proxy local) y siempre
 * con la cookie de sesión, que es donde viaja el JWT.
 */
export async function apiFetch<T = Record<string, never>>(
    path: string,
    options: RequestInit = {}
): Promise<ApiResult<T>> {
    const res = await fetch(`/api${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        credentials: "include"
    });

    if (res.status === 204) return {} as ApiResult<T>;

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const message = data?.error || data?.message || `Error ${res.status}`;
        throw new Error(message);
    }

    return data as ApiResult<T>;
}