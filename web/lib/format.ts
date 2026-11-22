import type { OrderStatus } from './types';

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
/** Escape text before putting it into raw HTML (e.g. the printable packing slip). */
export const escapeHtml = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
/** CSV cell that spreadsheet apps will not execute as a formula. */
export const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export const off = (price: number, mrp: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

export const date = (d: string | Date, withTime = false) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}) });

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const FLOW: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export const STATUS: Record<OrderStatus, { label: string; tone: string; dot: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting payment', tone: 'bg-yellow-50 text-yellow-800 ring-yellow-200', dot: 'bg-yellow-500' },
  PLACED: { label: 'Placed', tone: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-500' },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-500' },
  PACKED: { label: 'Packed', tone: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  SHIPPED: { label: 'Shipped', tone: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  DELIVERED: { label: 'Delivered', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  RETURNED: { label: 'Returned', tone: 'bg-zinc-100 text-zinc-700 ring-zinc-200', dot: 'bg-zinc-500' },
};

export const deliveryEta = (from = new Date(), min = 3, max = 5) => {
  const f = (n: number) => new Date(from.getTime() + n * 86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${f(min)} – ${f(max)}`;
};

export const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Chandigarh', 'Andaman & Nicobar', 'Dadra & Nagar Haveli and Daman & Diu', 'Lakshadweep'];
