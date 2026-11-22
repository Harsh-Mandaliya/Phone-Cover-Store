// Client-side PDF export (jsPDF + autoTable) — free, no server or API needed.
// Libraries are loaded on demand so they don't slow down normal page loads.
// Built-in PDF fonts have no ₹ glyph, so amounts are written as "Rs.".
import type { Order, Settings } from './types';

const BRAND: [number, number, number] = [37, 99, 235];
const TEAL: [number, number, number] = [30, 41, 59];

export const rs = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-IN');

async function load() {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  return { jsPDF, autoTable };
}

type TableReport = {
  title: string;
  subtitle?: string;
  storeName: string;
  head: string[];
  rows: (string | number)[][];
  summary?: [string, string][]; // small stat boxes under the title
  filename: string;
  landscape?: boolean;
  rightAlign?: number[]; // column indexes to right-align (money / numbers)
};

/** Branded table report: header band, optional summary boxes, striped table, page numbers. */
export async function downloadTablePdf(r: TableReport) {
  const { jsPDF, autoTable } = await load();
  const doc = new jsPDF({ orientation: r.landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const generated = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 64, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold').setFontSize(18).text(r.storeName, 32, 30);
  doc.setFont('helvetica', 'normal').setFontSize(10).text(r.title, 32, 48);
  doc.setFontSize(9).text(`Generated ${generated}`, W - 32, 48, { align: 'right' });

  let y = 88;
  doc.setTextColor(21, 21, 21);
  if (r.subtitle) {
    doc.setFontSize(10).setTextColor(110, 110, 110).text(r.subtitle, 32, y);
    y += 16;
  }
  if (r.summary?.length) {
    const gap = 10;
    const bw = (W - 64 - gap * (r.summary.length - 1)) / r.summary.length;
    r.summary.forEach(([label, value], i) => {
      const x = 32 + i * (bw + gap);
      doc.setFillColor(233, 244, 241).roundedRect(x, y, bw, 46, 6, 6, 'F');
      doc.setFontSize(8).setTextColor(90, 90, 90).text(label.toUpperCase(), x + 10, y + 16);
      doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(21, 21, 21).text(value, x + 10, y + 36);
      doc.setFont('helvetica', 'normal');
    });
    y += 62;
  }

  const align: Record<number, { halign: 'right' }> = {};
  (r.rightAlign || []).forEach((i) => (align[i] = { halign: 'right' }));
  autoTable(doc, {
    startY: y,
    head: [r.head.map((h, i) => (r.rightAlign?.includes(i) ? { content: h, styles: { halign: 'right' as const } } : h))],
    body: r.rows.map((row) => row.map(String)),
    margin: { left: 32, right: 32, bottom: 40 },
    styles: { fontSize: 8.5, cellPadding: 6, lineColor: [226, 232, 240], textColor: [40, 40, 40] },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: align,
    didDrawPage: () => {
      const H = doc.internal.pageSize.getHeight();
      doc.setFontSize(8).setTextColor(150, 150, 150);
      doc.text(`${r.storeName} · ${r.title}`, 32, H - 20);
      doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, W - 32, H - 20, { align: 'right' });
    },
  });
  doc.save(r.filename);
}

/** A4 invoice / packing slip for one order, ready to print or send to the customer. */
export async function downloadInvoicePdf(o: Order, s: Settings) {
  const { jsPDF, autoTable } = await load();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(...BRAND).text(s.storeName, 40, 56);
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(110, 110, 110);
  doc.text(doc.splitTextToSize(`${s.address}\n${s.supportPhone} · ${s.supportEmail}`, 260), 40, 72);
  doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(21, 21, 21).text('INVOICE', W - 40, 56, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(10).text(`#${o.number}`, W - 40, 72, { align: 'right' });
  doc.setFontSize(9).setTextColor(110, 110, 110).text(new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), W - 40, 86, { align: 'right' });

  // ship-to box (dashed, like a label)
  const boxY = 112;
  doc.setDrawColor(21, 21, 21).setLineDashPattern([4, 3], 0).roundedRect(40, boxY, W - 80, 108, 8, 8);
  doc.setLineDashPattern([], 0);
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(21, 21, 21).text('SHIP TO', 56, boxY + 22);
  doc.setFont('helvetica', 'normal').setFontSize(11);
  const addr = [o.customerName, `${o.line1}${o.line2 ? ', ' + o.line2 : ''}`, `${o.city}, ${o.state} - ${o.pincode}`, `Phone: +91 ${o.phone}`];
  doc.text(addr, 56, boxY + 40, { lineHeightFactor: 1.4 });
  const due = o.paymentMethod === 'COD' && o.paymentStatus !== 'PAID';
  doc.setFillColor(...(due ? BRAND : TEAL)).roundedRect(W - 220, boxY + 26, 164, 52, 6, 6, 'F');
  doc.setTextColor(255, 255, 255).setFontSize(8).text(due ? 'COLLECT CASH ON DELIVERY' : 'PAID', W - 138, boxY + 44, { align: 'center' });
  doc.setFont('helvetica', 'bold').setFontSize(15).text(due ? rs(o.total) : 'Rs. 0 due', W - 138, boxY + 66, { align: 'center' });
  if (o.partner?.name || o.trackingNumber) {
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(90, 90, 90).text(`${o.partner?.name || ''}${o.trackingNumber ? '  AWB ' + o.trackingNumber : ''}`, W - 138, boxY + 94, { align: 'center' });
  }

  autoTable(doc, {
    startY: boxY + 130,
    head: [['Item', { content: 'Qty', styles: { halign: 'center' } }, { content: 'Price', styles: { halign: 'right' } }, { content: 'Amount', styles: { halign: 'right' } }]],
    body: o.items.map((i) => [`${i.name}\n${[i.sku, i.model, i.color].filter(Boolean).join(' · ')}`, String(i.qty), rs(i.price), rs(i.price * i.qty)]),
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9.5, cellPadding: 7, textColor: [40, 40, 40], lineColor: [226, 232, 240] },
    headStyles: { fillColor: [241, 245, 249], textColor: [21, 21, 21], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'center', cellWidth: 40 }, 2: { halign: 'right', cellWidth: 80 }, 3: { halign: 'right', cellWidth: 90 } },
  });

  // totals
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  const line = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(bold ? 12 : 10).setTextColor(21, 21, 21);
    doc.text(label, W - 170, y, { align: 'right' });
    doc.text(value, W - 40, y, { align: 'right' });
    y += bold ? 22 : 16;
  };
  line('Subtotal', rs(o.subtotal));
  if (o.discount) line(`Discount${o.couponCode ? ` (${o.couponCode})` : ''}`, '- ' + rs(o.discount));
  line('Shipping', o.shipping ? rs(o.shipping) : 'Free');
  if (o.codFee) line('COD fee', rs(o.codFee));
  doc.setDrawColor(220, 220, 220).line(W - 260, y - 8, W - 40, y - 8);
  y += 4;
  line('Total', rs(o.total), true);

  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(130, 130, 130);
  doc.text(`Thank you for shopping with ${s.storeName}!`, W / 2, doc.internal.pageSize.getHeight() - 40, { align: 'center' });
  doc.save(`invoice-${o.number}.pdf`);
}
