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
  groups?: Array<{ id: number; name: string; monetary_contribution: number; contribution_status: string }>;
  participants?: EventoPdfParticipant[];
}

export interface EventoPdfOptions {
  fileName?: string;
  brand?: string;
  author?: string | null;
  includeTables?: boolean;
}

const INDIGO: [number, number, number] = [99, 102, 241];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_400: [number, number, number] = [148, 163, 184];

const MARGIN = 18;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

function contactDisplay(p: EventoPdfParticipant): string {
  if (p?.contact_type === "phone") return p.contact_phone || p.contact_value || "";
  if (p?.contact_type === "email") return p.contact_value || p.email || "";
  if (p?.email) return p.email;
  return p?.contact_value || p?.contact_phone || "";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function downloadEventoPdf(ev: EventoPdfData, options: EventoPdfOptions = {}): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const brand = options.brand?.trim() || "VibePlanner";
  const fileName = options.fileName?.trim() || `${ev.name.replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ\-_\s]/g, " ").trim()} - Evento.pdf`;

  // Portada
  doc.setFillColor(...SLATE_900);
  doc.rect(0, 0, PAGE_W, 85, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(brand.toUpperCase(), PAGE_W / 2, 28, { align: "center" });
  doc.setFontSize(24);
  const titulo = doc.splitTextToSize(ev.name, CONTENT_W);
  doc.text(titulo, PAGE_W / 2, 44, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_400);
  doc.text(`${formatDate(ev.date)} · ${ev.time.slice(0, 5)} hs · Público: ${ev.target_audience}`, PAGE_W / 2, 62, { align: "center" });
  if (ev.guests_count != null) {
    doc.text(`${ev.guests_count} invitados estimados`, PAGE_W / 2, 70, { align: "center" });
  }
  if (ev.estimated_logistic_budget != null) {
    doc.text(`Presupuesto logístico estimado: $${Number(ev.estimated_logistic_budget).toFixed(2)}`, PAGE_W / 2, 78, { align: "center" });
  }

  // Staff
  if ((ev.staff || []).length > 0) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...SLATE_900);
    doc.text("Staff Técnico", MARGIN, 30);
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, 34, MARGIN + 28, 34);
    autoTable(doc, {
      startY: 40,
      head: [["Rol", "Email"]],
      body: (ev.staff || []).map(s => [s.role, s.email]),
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { textColor: [15, 23, 42], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 60 } },
      margin: { left: MARGIN, right: MARGIN },
    });
  }

  // Inventario
  if ((ev.inventory || []).length > 0) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...SLATE_900);
    doc.text("Insumos Despachados", MARGIN, 30);
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, 34, MARGIN + 36, 34);
    autoTable(doc, {
      startY: 40,
      head: [["Ítem", "Categoría", "Cantidad", "Unidad"]],
      body: (ev.inventory || []).map(i => [i.name, i.category || "General", String(i.quantity_used), i.unit !== "N/A" ? i.unit : "uds"]),
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { textColor: [15, 23, 42], fontStyle: "bold" },
      margin: { left: MARGIN, right: MARGIN },
    });
  }

  // Itinerario
  if ((ev.itinerary || []).length > 0) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...SLATE_900);
    doc.text("Minuto a Minuto", MARGIN, 30);
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, 34, MARGIN + 32, 34);
    autoTable(doc, {
      startY: 40,
      head: [["Hora", "Tipo", "Detalle"]],
      body: (ev.itinerary || []).map(it => [it.time, it.type === "song" ? "Tema" : it.type === "file" ? "Setlist" : "Protocolo", it.name]),
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { textColor: [15, 23, 42], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 30 } },
      margin: { left: MARGIN, right: MARGIN },
    });
  }

  // Asistentes
  const participants = ev.participants || [];
  if (participants.length > 0) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...SLATE_900);
    doc.text("Asistentes / Participantes", MARGIN, 30);
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, 34, MARGIN + 44, 34);
    autoTable(doc, {
      startY: 40,
      head: [["Nombre", "Contacto", "Aporte ($)", "Estado"]],
      body: participants.map(p => [p.name, contactDisplay(p), String(p.monetary_contribution || 0), p.contribution_status || "-"]),
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { textColor: [15, 23, 42], fontStyle: "bold" },
      columnStyles: { 2: { cellWidth: 30 }, 3: { cellWidth: 28 } },
      margin: { left: MARGIN, right: MARGIN },
    });
  }

  doc.save(fileName);
}
