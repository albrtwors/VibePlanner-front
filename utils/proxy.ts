export async function getClientProfile() {
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