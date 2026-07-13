"use server";

import { cookies } from "next/headers";

export async function setAuthSession(token: string, user: any) {
    const cookieStore = await cookies();

    cookieStore.set("vibe_token", token, {
        httpOnly: true, // Anti-XSS indispensable
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 2, // 2 horas
    });

    return { success: true };
}