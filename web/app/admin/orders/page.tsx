'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Copy, Download, FileText, Mail, MapPin, Phone, Printer, Truck } from 'lucide-react';
import { downloadInvoicePdf, downloadTablePdf, rs } from '@/lib/pdf';
import { useSettings, useToast } from '@/components/providers';
import { OrderLines, StatusBadge } from '@/components/store/OrderTracker';
import { abtnLine, abtnTeal, ainput, Drawer, EmptyRow, Field, PageCard, Pill, SearchBox, TableWrap, td, th } from '@/components/admin/ui';
import { api, API_URL, getToken } from '@/lib/api';
import { cn, date, escapeHtml as h, FLOW, inr, STATUS } from '@/lib/format';
import type { Order, OrderStatus, Partner, Settings } from '@/lib/types';

export default function OrdersAdmin() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}

const TABS: (OrderStatus | '')[] = ['', 'PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'];

function Orders() {
  const sp = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [partners, setPartners] = useState<Partner[]>([]);
  const [status, setStatus] = useState(sp.get('status') || '');
  const [q, setQ] = useState(sp.get('q') || '');
  const [partner, setPartner] = useState('');
  const [open, setOpen] = useState<string | null>(sp.get('open'));

  const query = () => new URLSearchParams({ status, q, partner }).toString();
  const load = () =>
    api<{ orders: Order[]; counts: Record<string, number> }>(`/admin/orders?${query()}`).then((r) => {
      setOrders(r.orders);
      setCounts(r.counts);
    });
  useEffect(() => {
    api<Partner[]>('/admin/partners').then(setPartners);
  }, []);
  // keep filters in sync when the URL changes while this page is open (header bell, search, dashboard links)
  useEffect(() => {
    setQ(sp.get('q') || '');
    setStatus(sp.get('status') || '');
    if (sp.get('open')) setOpen(sp.get('open'));
  }, [sp]);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, partner]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const settings = useSettings();
  const [pdfBusy, setPdfBusy] = useState(false);
  const exportPdf = async () => {
    if (!orders?.length) return;
    setPdfBusy(true);
    const live = orders.filter((o) => !['CANCELLED', 'RETURNED'].includes(o.status));
    const filters = [status && STATUS[status as OrderStatus].label, q && `search "${q}"`, partner && partners.find((p) => p.id === partner)?.name].filter(Boolean).join(' · ');
    await downloadTablePdf({
      storeName: settings.storeName,
      title: 'Orders report',
      subtitle: filters ? `Filtered by: ${filters}` : 'All orders',
      landscape: true,
      summary: [
        ['Orders', String(orders.length)],
        ['Order value', rs(live.reduce((a, o) => a + o.total, 0))],
        ['Cash to collect', rs(live.filter((o) => o.paymentStatus !== 'PAID').reduce((a, o) => a + o.total, 0))],
        ['Items', String(orders.reduce((a, o) => a + o.items.reduce((b, i) => b + i.qty, 0), 0))],
      ],
      head: ['Order', 'Date', 'Customer', 'Phone', 'City / Pincode', 'Items', 'Total', 'Payment', 'Status', 'Partner / AWB'],
      rows: orders.map((o) => [
        o.number,
        date(o.createdAt),
        o.customerName,
        o.phone,
        `${o.city} ${o.pincode}`,
        o.items.map((i) => `${i.qty}x ${i.name}${i.model ? ` (${i.model})` : ''}`).join('\n'),
        rs(o.total),
        `${o.paymentMethod} ${o.paymentStatus === 'PAID' ? 'Paid' : 'Due'}`,
        STATUS[o.status].label,
        [o.partner?.name, o.trackingNumber].filter(Boolean).join('\n') || '-',
      ]),
      rightAlign: [6],
      filename: `orders-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
    setPdfBusy(false);
  };
  const exportCsv = async () => {
    const res = await fetch(`${API_URL}/api/admin/orders.csv?${query()}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(await res.blob());
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <PageCard
      title="Orders"
      sub="Confirm, pack, hand over to a delivery partner and track every order."
      actions={
        <>
          <button onClick={exportCsv} className={abtnLine}>
            <Download className="size-4" /> Export CSV
          </button>
          <button onClick={exportPdf} disabled={pdfBusy || !orders?.length} className={abtnLine}>
            <FileText className="size-4" /> {pdfBusy ? 'Preparing…' : 'Export PDF'}
          </button>
        </>
      }
    >
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const n = t ? counts[t] || 0 : total;
          const active = status === t;
          return (
            <button key={t || 'all'} onClick={() => setStatus(t)} className={cn('relative shrink-0 rounded-full px-4 py-2 text-sm transition', active ? 'font-semibold text-white' : 'text-zinc-600 hover:bg-zinc-100')}>
              {active && <motion.span layoutId="ord-tab" className="absolute inset-0 rounded-full bg-brand" />}
              <span className="relative">
                {t ? STATUS[t].label : 'All'} <span className={cn('ml-1 text-xs', active ? 'text-white/70' : 'text-zinc-400')}>{n}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="my-5 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Order no., customer, phone or email" className="w-full max-w-sm" />
        <div className="ml-auto">
          <Pill label="Delivery partner" value={partner} onChange={setPartner} options={partners.map((p) => [p.id, p.name])} />
        </div>
      </div>

      <TableWrap>
        <table className="w-full">
          <thead>
            <tr>
              {['Order', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Partner', ''].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders === null && <EmptyRow cols={9} text="Loading…" />}
            {orders?.length === 0 && <EmptyRow cols={9} text="No orders here yet." />}
            {orders?.map((o) => (
              <tr key={o.id} onClick={() => setOpen(o.id)} className="cursor-pointer hover:bg-zinc-50">
                <td className={cn(td, 'font-semibold text-zinc-900')}>#{o.number}</td>
                <td className={td}>{date(o.createdAt, true)}</td>
                <td className={td}>
                  <span className="block font-medium text-zinc-900">{o.customerName}</span>
                  <span className="text-xs text-zinc-400">
                    {o.city} · {o.phone}
                  </span>
                </td>
                <td className={td}>{o.items.reduce((a, i) => a + i.qty, 0)} pcs</td>
                <td className={cn(td, 'font-semibold')}>{inr(o.total)}</td>
                <td className={td}>
                  <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', o.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600')}>
                    {o.paymentMethod} · {o.paymentStatus === 'PAID' ? 'Paid' : 'Due'}
                  </span>
                </td>
                <td className={td}>
                  <StatusBadge status={o.status} />
                </td>
                <td className={td}>{o.partner?.name || <span className="text-zinc-300">—</span>}</td>
                <td className={td}>
                  <span className={cn(abtnTeal, 'px-3.5 py-1.5')}>View</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <OrderDrawer
        id={open}
        partners={partners}
        onClose={() => {
          setOpen(null);
          if (sp.get('open')) router.replace('/admin/orders');
        }}
        onChanged={load}
      />
    </PageCard>
  );
}

function OrderDrawer({ id, partners, onClose, onChanged }: { id: string | null; partners: Partner[]; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const settings = useSettings();
  const [o, setO] = useState<Order | null>(null);
  const [note, setNote] = useState('');
  const [ship, setShip] = useState({ partnerId: '', trackingNumber: '' });
  const [busy, setBusy] = useState(false);

  const load = () =>
    id &&
    api<Order>(`/admin/orders/${id}`).then((r) => {
      setO(r);
      setShip({ partnerId: r.partnerId || '', trackingNumber: r.trackingNumber || '' });
    });
  useEffect(() => {
    setO(null);
    setNote('');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const patch = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try {
      await api(`/admin/orders/${id}`, { method: 'PATCH', body });
      toast(msg);
      setNote('');
      await load();
      onChanged();
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const idx = o ? FLOW.indexOf(o.status) : -1;
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
  const needsPartner = next === 'SHIPPED' && !ship.partnerId;

  return (
    <Drawer open={!!id} onClose={onClose} wide title={o ? `Order #${o.number}` : 'Order'}>
      {!o ? (
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={o.status} />
            <span className="text-sm text-zinc-500">Placed {date(o.createdAt, true)}</span>
            <button onClick={() => printSlip(o, settings)} className={cn(abtnLine, 'ml-auto px-3 py-1.5')}>
              <Printer className="size-4" /> Print slip
            </button>
            <button onClick={() => downloadInvoicePdf(o, settings)} className={cn(abtnLine, 'px-3 py-1.5')}>
              <FileText className="size-4" /> Invoice PDF
            </button>
          </div>

          {/* next step */}
          {next && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-brand-50 p-5">
              <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">Next step</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the timeline" className={cn(ainput, 'flex-1 bg-white')} />
                <button disabled={busy || needsPartner} onClick={() => patch({ status: next, note, ...(next === 'SHIPPED' ? ship : {}) }, `Marked as ${STATUS[next].label}`)} className={abtnTeal}>
                  Mark as {STATUS[next].label} <ArrowRight className="size-4" />
                </button>
              </div>
              {needsPartner && <p className="mt-2 text-xs text-brand-600">Choose a delivery partner below before marking as shipped.</p>}
            </motion.div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 p-5">
              <p className="mb-3 font-semibold">Customer</p>
              <p className="font-medium">{o.customerName}</p>
              <div className="mt-2 space-y-1.5 text-sm text-zinc-600">
                <a href={`tel:+91${o.phone}`} className="flex items-center gap-2 hover:text-brand">
                  <Phone className="size-4" /> +91 {o.phone}
                </a>
                <a href={`mailto:${o.email}`} className="flex items-center gap-2 hover:text-brand">
                  <Mail className="size-4" /> {o.email}
                </a>
                <p className="flex gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {o.line1}
                    {o.line2 ? `, ${o.line2}` : ''}, {o.city}, {o.state} – {o.pincode}
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${o.customerName}\n${o.line1}${o.line2 ? ', ' + o.line2 : ''}\n${o.city}, ${o.state} - ${o.pincode}\nPh: ${o.phone}`);
                  toast('Address copied');
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600"
              >
                <Copy className="size-3.5" /> Copy shipping label
              </button>
              {o.note && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Note: {o.note}</p>}
            </section>

            <section className="rounded-2xl border border-zinc-200 p-5">
              <p className="mb-3 flex items-center gap-2 font-semibold">
                <Truck className="size-4" /> Delivery
              </p>
              <div className="space-y-3">
                <Field label="Delivery partner">
                  <select value={ship.partnerId} onChange={(e) => setShip({ ...ship, partnerId: e.target.value })} className={ainput}>
                    <option value="">Not assigned</option>
                    {partners.filter((p) => p.active || p.id === ship.partnerId).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {!p.codSupported ? ' (no COD)' : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tracking / AWB number">
                  <input value={ship.trackingNumber} onChange={(e) => setShip({ ...ship, trackingNumber: e.target.value })} className={ainput} placeholder="e.g. AWB123456" />
                </Field>
                <button disabled={busy} onClick={() => patch(ship, 'Delivery details saved')} className={cn(abtnLine, 'w-full')}>
                  Save delivery details
                </button>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-zinc-200 p-5">
            <p className="mb-1 font-semibold">Items</p>
            <OrderLines order={o} />
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 p-5">
              <p className="mb-3 font-semibold">Timeline</p>
              <ol className="space-y-3 border-l-2 border-zinc-100 pl-4">
                {o.events?.map((e) => (
                  <li key={e.id} className="relative text-sm">
                    <span className={cn('absolute top-1.5 -left-[21px] size-2.5 rounded-full', STATUS[e.status].dot)} />
                    <b>{STATUS[e.status].label}</b>
                    <span className="block text-xs text-zinc-500">
                      {date(e.createdAt, true)}
                      {e.note ? ` · ${e.note}` : ''}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
            <section className="space-y-3 rounded-2xl border border-zinc-200 p-5">
              <p className="font-semibold">Manual update</p>
              <Field label="Set status">
                <select value={o.status} onChange={(e) => patch({ status: e.target.value, note: note || 'Updated by admin' }, 'Status updated')} className={ainput}>
                  {(Object.keys(STATUS) as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS[s].label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Payment">
                <select value={o.paymentStatus} onChange={(e) => patch({ paymentStatus: e.target.value }, 'Payment status updated')} className={ainput}>
                  <option value="PENDING">Pending (collect on delivery)</option>
                  <option value="PAID">Paid</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </Field>
              <p className="text-xs text-zinc-400">Cancelling or returning puts the items back into stock automatically. The customer gets an email update for every status change.</p>
            </section>
          </div>
        </div>
      )}
    </Drawer>
  );
}

// every value from the database is escaped with h() — a customer could type HTML into their name
function printSlip(o: Order, s: Settings) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  const rows = o.items.map((i) => `<tr><td>${h(i.name)}<br><small>${h([i.sku, i.model, i.color].filter(Boolean).join(' · '))}</small></td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${i.price * i.qty}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><title>Invoice ${h(o.number)}</title><style>
    body{font-family:system-ui,sans-serif;color:#0F172A;padding:32px;max-width:720px;margin:auto}
    h1{margin:0;color:#2563EB}.row{display:flex;justify-content:space-between;gap:24px;margin:24px 0}
    table{width:100%;border-collapse:collapse;margin-top:16px}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #eee;font-size:14px}
    th{background:#F1F5F9}small{color:#888}.tot td{border:none;padding:4px 8px}.big{font-size:18px;font-weight:700}
    .box{border:2px dashed #0F172A;padding:16px;border-radius:12px;font-size:15px;line-height:1.5}
  </style></head><body>
  <div class="row"><div><h1>${h(s.storeName)}</h1><small>${h(s.address)}<br>${h(s.supportPhone)} · ${h(s.supportEmail)}</small></div>
  <div style="text-align:right"><b>INVOICE</b><br>#${h(o.number)}<br><small>${new Date(o.createdAt).toLocaleString('en-IN')}</small></div></div>
  <div class="box"><b>SHIP TO</b><br>${h(o.customerName)}<br>${h(o.line1)}${o.line2 ? ', ' + h(o.line2) : ''}<br>${h(o.city)}, ${h(o.state)} – <b>${h(o.pincode)}</b><br>Ph: +91 ${h(o.phone)}
  <br><br><b>${o.paymentMethod === 'COD' && o.paymentStatus !== 'PAID' ? `COLLECT CASH: ₹${o.total}` : 'PREPAID'}</b></div>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <table class="tot"><tr><td style="text-align:right">Subtotal</td><td style="width:120px">₹${o.subtotal}</td></tr>
  ${o.discount ? `<tr><td style="text-align:right">Discount ${h(o.couponCode || '')}</td><td>− ₹${o.discount}</td></tr>` : ''}
  <tr><td style="text-align:right">Shipping</td><td>${o.shipping ? '₹' + o.shipping : 'Free'}</td></tr>
  ${o.codFee ? `<tr><td style="text-align:right">COD fee</td><td>₹${o.codFee}</td></tr>` : ''}
  <tr><td style="text-align:right" class="big">Total</td><td class="big">₹${o.total}</td></tr></table>
  <p style="margin-top:40px;text-align:center"><small>Thank you for shopping with ${h(s.storeName)}!</small></p>
  <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}
