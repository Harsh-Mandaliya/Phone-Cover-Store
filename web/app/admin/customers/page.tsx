'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Crown, UserPlus, Users, Wallet } from 'lucide-react';
import { EmptyRow, PageCard, SearchBox, StatCard, TableWrap, td, th } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { date, inr } from '@/lib/format';

type C = { id: string; name: string; email: string; phone: string | null; createdAt: string; city?: string; orders: number; spent: number; lastOrder: string | null };

export default function CustomersAdmin() {
  const [list, setList] = useState<C[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => api<C[]>(`/admin/customers?q=${encodeURIComponent(q)}`).then(setList), 200);
    return () => clearTimeout(t);
  }, [q]);
  const all = list || [];
  const month = all.filter((c) => Date.now() - +new Date(c.createdAt) < 30 * 86400000).length;
  const top = [...all].sort((a, b) => b.spent - a.spent)[0];
  return (
    <PageCard title="Customers" sub="Everyone who created an account. Guest checkouts appear under Orders.">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="teal" icon={<Users className="size-6" />} label="Registered customers" value={all.length} />
        <StatCard tone="yellow" icon={<UserPlus className="size-6" />} label="Joined last 30 days" value={month} />
        <StatCard tone="green" icon={<Crown className="size-6" />} label="Top customer" value={top ? inr(top.spent) : '—'} hint={top?.name} />
      </div>
      <SearchBox value={q} onChange={setQ} placeholder="Search name, email or phone" className="my-5 max-w-sm" />
      <TableWrap>
        <table className="w-full">
          <thead>
            <tr>
              {['Customer', 'Phone', 'City', 'Orders', 'Total spent', 'Last order', 'Joined', ''].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list === null && <EmptyRow cols={8} text="Loading…" />}
            {list?.length === 0 && <EmptyRow cols={8} text="No customers found." />}
            {all.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-brand-50 font-semibold text-brand-600">{c.name[0]}</span>
                    <span>
                      <span className="block font-medium text-zinc-900">{c.name}</span>
                      <span className="text-xs text-zinc-400">{c.email}</span>
                    </span>
                  </div>
                </td>
                <td className={td}>{c.phone || '—'}</td>
                <td className={td}>{c.city || '—'}</td>
                <td className={td}>{c.orders}</td>
                <td className={td}>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Wallet className="size-3.5 text-zinc-400" />
                    {inr(c.spent)}
                  </span>
                </td>
                <td className={td}>{c.lastOrder ? date(c.lastOrder) : '—'}</td>
                <td className={td}>{date(c.createdAt)}</td>
                <td className={td}>
                  <Link href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="text-sm font-medium text-brand-600">
                    Orders →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </PageCard>
  );
}
