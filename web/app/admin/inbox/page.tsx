'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MailOpen, Phone, Reply, Trash2 } from 'lucide-react';
import { PageCard, abtnLine } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { cn, date } from '@/lib/format';

type Msg = { id: string; name: string; email: string; phone: string | null; subject: string; body: string; read: boolean; createdAt: string };

export default function InboxAdmin() {
  const [list, setList] = useState<Msg[]>([]);
  const [subs, setSubs] = useState<{ email: string; createdAt: string }[]>([]);
  const [open, setOpen] = useState<Msg | null>(null);
  const [tab, setTab] = useState<'messages' | 'subscribers'>('messages');
  const load = () => api<Msg[]>('/admin/messages').then(setList);
  useEffect(() => {
    load();
    api<{ email: string; createdAt: string }[]>('/admin/subscribers').then(setSubs);
  }, []);

  const select = async (m: Msg) => {
    setOpen(m);
    if (!m.read) {
      await api(`/admin/messages/${m.id}`, { method: 'PATCH', body: { read: true } });
      setList((l) => l.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
    }
  };
  const remove = async (m: Msg) => {
    await api(`/admin/messages/${m.id}`, { method: 'DELETE' });
    setOpen(null);
    load();
  };

  return (
    <PageCard title="Inbox" sub="Messages from the Contact page and newsletter sign-ups.">
      <div className="mb-5 flex gap-1">
        {(['messages', 'subscribers'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('relative rounded-full px-4 py-2 text-sm capitalize', tab === t ? 'font-semibold text-white' : 'text-zinc-600')}>
            {tab === t && <motion.span layoutId="inbox-tab" className="absolute inset-0 rounded-full bg-brand" />}
            <span className="relative">
              {t} ({t === 'messages' ? list.length : subs.length})
            </span>
          </button>
        ))}
      </div>
      {tab === 'messages' ? (
        <div className="grid min-h-96 gap-4 lg:grid-cols-[360px_1fr]">
          <ul className="space-y-2">
            {list.map((m) => (
              <li key={m.id}>
                <button onClick={() => select(m)} className={cn('w-full rounded-2xl border p-4 text-left transition', open?.id === m.id ? 'border-brand bg-brand-50' : 'border-zinc-200 hover:border-zinc-300')}>
                  <div className="flex items-center gap-2">
                    {m.read ? <MailOpen className="size-4 text-zinc-400" /> : <Mail className="size-4 text-brand" />}
                    <span className={cn('flex-1 truncate text-sm', !m.read && 'font-semibold')}>{m.name}</span>
                    <span className="text-xs text-zinc-400">{date(m.createdAt)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">{m.subject}</p>
                  <p className="truncate text-xs text-zinc-500">{m.body}</p>
                </button>
              </li>
            ))}
            {!list.length && <p className="py-10 text-center text-sm text-zinc-400">No messages yet.</p>}
          </ul>
          <div className="rounded-2xl border border-zinc-200 p-6">
            {open ? (
              <motion.div key={open.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-xs text-zinc-400">{date(open.createdAt, true)}</p>
                <h2 className="mt-1 font-display text-xl font-semibold">{open.subject}</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {open.name} · {open.email} {open.phone && `· ${open.phone}`}
                </p>
                <p className="mt-6 text-sm leading-relaxed whitespace-pre-wrap">{open.body}</p>
                <div className="mt-8 flex flex-wrap gap-2">
                  <a href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`} className={abtnLine}>
                    <Reply className="size-4" /> Reply by email
                  </a>
                  {open.phone && (
                    <a href={`https://wa.me/91${open.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer" className={abtnLine}>
                      <Phone className="size-4" /> WhatsApp
                    </a>
                  )}
                  <button onClick={() => remove(open)} className={cn(abtnLine, 'text-rose-600')}>
                    <Trash2 className="size-4" /> Delete
                  </button>
                </div>
              </motion.div>
            ) : (
              <p className="grid h-full place-items-center text-sm text-zinc-400">Select a message to read it.</p>
            )}
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
          {subs.map((s) => (
            <li key={s.email} className="flex justify-between px-5 py-3 text-sm">
              {s.email} <span className="text-zinc-400">{date(s.createdAt)}</span>
            </li>
          ))}
          {!subs.length && <li className="p-10 text-center text-sm text-zinc-400">No subscribers yet.</li>}
        </ul>
      )}
    </PageCard>
  );
}
