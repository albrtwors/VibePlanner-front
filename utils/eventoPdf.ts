// utils/eventoPdf.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface EventoPdfParticipant {
    id?: number;
    group_id?: number | null;
    name: string;
    email?: string | null;
    contact_type?: string;
    contact_value?: string | null;
    contact_phone?: string | null;
    monetary_contribution: number;
    contribution_status?: string;
    logistics_to_bring?: Array<{ item: string; quantity: number }>;
}

export interface EventoPdfData {
    id: number;
    name: string;
    date: string;
    time: string;
    target_audience: string;
    guests_count?: number;
    estimated_logistic_budget?: number;
    itinerary?: Array<{ time: string; type: string; name: string }>;
    staff?: Array<{ email: string; role: string }>;
    inventory?: Array<{ item_id?: number; name: string; category?: string; quantity_used: number; unit: string }>;
    groups?: Array<{
        id: number;
        name: string;
        monetary_contribution: number;
        contribution_status: string;
        logistics_to_bring?: Array<{ item: string; quantity: number }>;
        members_count?: number;
    }>;
    participants?: EventoPdfParticipant[];
}

export interface EventoPdfOptions {
    fileName?: string;
    brand?: string;
    author?: string | null;
    includeTables?: boolean;
    reportType?: string;
}

const INDIGO: [number, number, number] = [99, 102, 241];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_700: [number, number, number] = [51, 65, 85];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_400: [number, number, number] = [148, 163, 184];
const SLATE_200: [number, number, number] = [226, 232, 240];
const SLATE_100: [number, number, number] = [241, 245, 249];

const MARGIN = 16;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

function contactDisplay(p: EventoPdfParticipant): string {
    if (p?.contact_type === "phone") return p.contact_phone || p.contact_value || "—";
    if (p?.contact_type === "email") return p.contact_value || p.email || "—";
    if (p?.email) return p.email;
    return p?.contact_value || p?.contact_phone || "—";
}

function formatDateLong(dateStr: string): string {
    try {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch {
        return dateStr;
    }
}

function monthYear(dateStr: string): string {
    try {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();
    } catch {
        return "";
    }
}

function drawMembrete(doc: jsPDF, brand: string, pageNum: number, totalPages: number, evId: number) {
    // Línea superior
    doc.setDrawColor(...SLATE_200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 12, PAGE_W - MARGIN, 12);

    // Logo tipo navbar
    doc.setFillColor(...INDIGO);
    doc.roundedRect(MARGIN, 6, 6.5, 6.5, 1.2, 1.2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("V", MARGIN + 3.25, 10.6, { align: "center" });

    // Nombre marca
    doc.setTextColor(...SLATE_900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(brand, MARGIN + 9, 10);

    // Info lateral
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_500);
    doc.text(`COD. EVENTO: EVT-${String(evId).padStart(5, "0")}`, PAGE_W / 2, 10, { align: "center" });
    doc.text(`PÁG. ${pageNum} / ${totalPages}`, PAGE_W - MARGIN, 10, { align: "right" });

    // Línea inferior
    doc.setDrawColor(...SLATE_200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 16, PAGE_W - MARGIN, 16);
}

function ensurePageWithMembrete(doc: jsPDF, brand: string, evId: number) {
    doc.addPage();
    const totalPages = (doc as any).internal.getNumberOfPages();
    drawMembrete(doc, brand, totalPages, totalPages, evId);
    return totalPages;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...SLATE_900);
    doc.text(title.toUpperCase(), MARGIN, y);
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(1);
    doc.line(MARGIN, y + 2, MARGIN + doc.getTextWidth(title.toUpperCase()) * 0.85, y + 2);
    return y + 10;
}

export function downloadEventoPdf(ev: EventoPdfData, options: EventoPdfOptions = {}): void {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const brand = options.brand?.trim() || "VibePlanner";
    const reportType = options.reportType?.trim() || "REPORTE COMPLETO DE EVENTO";
    const generatedAt = new Date();
    const fileName =
        options.fileName?.trim() ||
        `${ev.name.replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ\-_\s]/g, " ").trim()} - ${reportType}.pdf`;

    // ========== PORTADA ==========
    doc.setFillColor(...SLATE_900);
    doc.rect(0, 0, PAGE_W, 110, "F");

    // Decoración lateral
    doc.setFillColor(...INDIGO);
    doc.rect(0, 0, 3, 110, "F");

    // Logo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(MARGIN, 28, 14, 14, 2.5, 2.5, "F");
    doc.setTextColor(...INDIGO);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("V", MARGIN + 7, 37, { align: "center" });

    // Marca
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(brand.toUpperCase(), MARGIN + 18, 35);

    // Tipo de reporte
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_400);
    doc.text(reportType.toUpperCase(), MARGIN, 55);

    // Título del evento
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    const titulo = doc.splitTextToSize(ev.name.toUpperCase(), CONTENT_W);
    doc.text(titulo, MARGIN, 72);

    // Datos en portada
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_400);
    let yPort = 98;
    doc.text(`FECHA DEL EVENTO: ${formatDateLong(ev.date).toUpperCase()}`, MARGIN, yPort);
    yPort += 5;
    doc.text(`HORA: ${ev.time.slice(0, 5)} HS   |   PÚBLICO OBJETIVO: ${ev.target_audience.toUpperCase()}`, MARGIN, yPort);
    yPort += 5;
    doc.text(`PERIODO / MES-AÑO: ${monthYear(ev.date)}`, MARGIN, yPort);
    yPort += 5;
    doc.text(`CÓDIGO: EVT-${String(ev.id).padStart(5, "0")}`, MARGIN, yPort);

    // Pie de portada
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 110, PAGE_W, PAGE_H - 110, "F");
    doc.setDrawColor(...SLATE_200);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, 130, PAGE_W - MARGIN, 130);

    doc.setTextColor(...SLATE_700);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("INFORMACIÓN GENERAL DEL EVENTO", MARGIN, 138);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_700);
    let yInfo = 148;
    const info = [
        ["ID DE EVENTO", String(ev.id)],
        ["NOMBRE", ev.name],
        ["FECHA", formatDateLong(ev.date)],
        ["HORA", `${ev.time.slice(0, 5)} hs`],
        ["PÚBLICO OBJETIVO", ev.target_audience],
        ["INVITADOS ESTIMADOS", ev.guests_count != null ? String(ev.guests_count) : "No especificado"],
        ["PRESUPUESTO LOGÍSTICO ESTIMADO", ev.estimated_logistic_budget != null ? `$ ${Number(ev.estimated_logistic_budget).toFixed(2)}` : "No especificado"],
    ];
    for (const [label, val] of info) {
        doc.setTextColor(...SLATE_500);
        doc.text(label, MARGIN, yInfo);
        doc.setTextColor(...SLATE_900);
        doc.text(val, MARGIN + 48, yInfo);
        yInfo += 5;
    }

    doc.setDrawColor(...SLATE_200);
    doc.line(MARGIN, yInfo + 6, PAGE_W - MARGIN, yInfo + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_500);
    doc.text(`GENERADO POR: ${brand} | FECHA DE EMISIÓN: ${generatedAt.toLocaleDateString("es-ES")} ${generatedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`, MARGIN, yInfo + 14);
    doc.text("DOCUMENTO CONFIDENCIAL - USO INTERNO", PAGE_W - MARGIN, yInfo + 14, { align: "right" });

    // ========== STAFF ==========
    if ((ev.staff || []).length > 0) {
        doc.addPage();
        let totalPages = (doc as any).internal.getNumberOfPages();
        drawMembrete(doc, brand, totalPages, totalPages, ev.id);
        let y = addSectionTitle(doc, "STAFF TÉCNICO Y ORGANIZATIVO", 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_500);
        doc.text("Personal asignado al evento con sus funciones correspondientes.", MARGIN, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [["ROL / CARGO", "CORREO ELECTRÓNICO"]],
            body: (ev.staff || []).map((s) => [s.role || "—", s.email || "—"]),
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 3.5, textColor: SLATE_900, lineColor: SLATE_200, lineWidth: 0.2 },
            headStyles: { fillColor: SLATE_900, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
            alternateRowStyles: { fillColor: SLATE_100 },
            margin: { left: MARGIN, right: MARGIN, top: 20, bottom: 16 },
            didDrawPage: () => drawMembrete(doc, brand, (doc as any).internal.getNumberOfPages(), (doc as any).internal.getNumberOfPages(), ev.id),
        });
    }

    // ========== INVENTARIO ==========
    if ((ev.inventory || []).length > 0) {
        doc.addPage();
        let totalPages = (doc as any).internal.getNumberOfPages();
        drawMembrete(doc, brand, totalPages, totalPages, ev.id);
        let y = addSectionTitle(doc, "INSUMOS, MATERIALES Y DESPACHO", 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_500);
        doc.text("Detalle de inventario asignado para el correcto desarrollo del evento.", MARGIN, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [["ÍTEM", "CATEGORÍA", "CANTIDAD", "UNIDAD"]],
            body: (ev.inventory || []).map((i) => [i.name || "—", i.category || "General", String(i.quantity_used ?? "—"), i.unit && i.unit !== "N/A" ? i.unit : "uds"]),
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 3.5, textColor: SLATE_900, lineColor: SLATE_200, lineWidth: 0.2 },
            headStyles: { fillColor: SLATE_900, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
            alternateRowStyles: { fillColor: SLATE_100 },
            columnStyles: { 2: { halign: "center", cellWidth: 25 }, 3: { halign: "center", cellWidth: 25 } },
            margin: { left: MARGIN, right: MARGIN, top: 20, bottom: 16 },
            didDrawPage: () => drawMembrete(doc, brand, (doc as any).internal.getNumberOfPages(), (doc as any).internal.getNumberOfPages(), ev.id),
        });
    }

    // ========== ITINERARIO ==========
    if ((ev.itinerary || []).length > 0) {
        doc.addPage();
        let totalPages = (doc as any).internal.getNumberOfPages();
        drawMembrete(doc, brand, totalPages, totalPages, ev.id);
        let y = addSectionTitle(doc, "ITINERARIO - MINUTO A MINUTO", 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_500);
        doc.text("Cronograma propuesto para el desarrollo del evento.", MARGIN, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [["HORA", "TIPO", "ACTIVIDAD / DETALLE"]],
            body: (ev.itinerary || []).map((it) => [
                it.time || "—",
                it.type === "song" ? "TEMA MUSICAL" : it.type === "file" ? "SETLIST / ARCHIVO" : "PROTOCOLO / GENERAL",
                it.name || "—",
            ]),
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 3.5, textColor: SLATE_900, lineColor: SLATE_200, lineWidth: 0.2 },
            headStyles: { fillColor: SLATE_900, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
            alternateRowStyles: { fillColor: SLATE_100 },
            columnStyles: { 0: { cellWidth: 22, halign: "center" }, 1: { cellWidth: 38 } },
            margin: { left: MARGIN, right: MARGIN, top: 20, bottom: 16 },
            didDrawPage: () => drawMembrete(doc, brand, (doc as any).internal.getNumberOfPages(), (doc as any).internal.getNumberOfPages(), ev.id),
        });
    }

    // ========== GRUPOS/COLECTIVOS ==========
    const groups = ev.groups || [];
    if (groups.length > 0) {
        doc.addPage();
        let totalPages = (doc as any).internal.getNumberOfPages();
        drawMembrete(doc, brand, totalPages, totalPages, ev.id);
        let y = addSectionTitle(doc, "COLECTIVOS / GRUPOS REGISTRADOS", 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_500);
        doc.text("Listado de colectivos con aporte financiero asignado.", MARGIN, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [["GRUPO / COLECTIVO", "APORTE MONETARIO ($)", "ESTADO DE APORTE", "INSUMOS ASIGNADOS"]],
            body: groups.map((g) => [
                g.name || "—",
                `$ ${Number(g.monetary_contribution || 0).toFixed(2)}`,
                g.contribution_status === "paid" ? "PAGADO" : g.contribution_status === "partial" ? "PARCIAL" : "PENDIENTE",
                (g.logistics_to_bring || []).length > 0 ? (g.logistics_to_bring || []).map((l) => `${l.item} x${l.quantity}`).join(", ") : "—",
            ]),
            theme: "grid",
            styles: { fontSize: 7.5, cellPadding: 3.2, textColor: SLATE_900, lineColor: SLATE_200, lineWidth: 0.2 },
            headStyles: { fillColor: SLATE_900, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
            alternateRowStyles: { fillColor: SLATE_100 },
            columnStyles: { 1: { halign: "right", cellWidth: 32 }, 2: { halign: "center", cellWidth: 28 } },
            margin: { left: MARGIN, right: MARGIN, top: 20, bottom: 16 },
            didDrawPage: () => drawMembrete(doc, brand, (doc as any).internal.getNumberOfPages(), (doc as any).internal.getNumberOfPages(), ev.id),
        });
    }

    // ========== ASISTENTES / PARTICIPANTES ==========
    const participants = ev.participants || [];
    if (participants.length > 0) {
        doc.addPage();
        let totalPages = (doc as any).internal.getNumberOfPages();
        drawMembrete(doc, brand, totalPages, totalPages, ev.id);
        let y = addSectionTitle(doc, "NÓMINA DE ASISTENTES Y PARTICIPANTES", 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_500);
        doc.text("Registro completo con datos de contacto, aporte monetario e insumos a traer.", MARGIN, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [["NOMBRE COMPLETO / INTEGRANTE", "CONTACTO", "APORTE ($)", "ESTADO", "INSUMOS A TRAER"]],
            body: participants.map((p) => [
                p.name || "—",
                contactDisplay(p),
                `$ ${Number(p.monetary_contribution || 0).toFixed(2)}`,
                p.contribution_status === "paid" ? "PAGADO" : p.contribution_status === "partial" ? "PARCIAL" : "PENDIENTE",
                (p.logistics_to_bring || []).length > 0 ? (p.logistics_to_bring || []).map((l) => `${l.item} x${l.quantity}`).join(", ") : "—",
            ]),
            theme: "grid",
            styles: { fontSize: 7.2, cellPadding: 3, textColor: SLATE_900, lineColor: SLATE_200, lineWidth: 0.2 },
            headStyles: { fillColor: SLATE_900, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
            alternateRowStyles: { fillColor: SLATE_100 },
            columnStyles: { 2: { halign: "right", cellWidth: 24 }, 3: { halign: "center", cellWidth: 20 } },
            margin: { left: MARGIN, right: MARGIN, top: 20, bottom: 16 },
            didDrawPage: () => drawMembrete(doc, brand, (doc as any).internal.getNumberOfPages(), (doc as any).internal.getNumberOfPages(), ev.id),
        });

        // Resumen final
        const totalAporte = participants.reduce((acc, p) => acc + Number(p.monetary_contribution || 0), 0);
        const totalPagado = participants.filter((p) => p.contribution_status === "paid").reduce((acc, p) => acc + Number(p.monetary_contribution || 0), 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_900);
        const lastY = (doc as any).lastAutoTable?.finalY || y + 40;
        doc.text(`TOTAL APORTES REGISTRADOS: $ ${totalAporte.toFixed(2)}   |   TOTAL PAGADO: $ ${totalPagado.toFixed(2)}   |   SALDO: $ ${(totalAporte - totalPagado).toFixed(2)}`, MARGIN, lastY + 8);
    }

    // Actualizar números de página en membretes
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        // Redibujar membrete con total correcto
        doc.setDrawColor(...SLATE_200);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, 12, PAGE_W - MARGIN, 12);
        doc.setFillColor(...INDIGO);
        doc.roundedRect(MARGIN, 6, 6.5, 6.5, 1.2, 1.2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text("V", MARGIN + 3.25, 10.6, { align: "center" });
        doc.setTextColor(...SLATE_900);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(brand, MARGIN + 9, 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...SLATE_500);
        doc.text(`COD. EVENTO: EVT-${String(ev.id).padStart(5, "0")}`, PAGE_W / 2, 10, { align: "center" });
        doc.text(`PÁG. ${i} / ${totalPages}`, PAGE_W - MARGIN, 10, { align: "right" });
        doc.setDrawColor(...SLATE_200);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, 16, PAGE_W - MARGIN, 16);
    }

    doc.save(fileName);
}
