'use client';

import { useTranslations } from 'next-intl';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Header } from '@/components/Header';

interface BookStat {
  title: string;
  author: string;
  count: number;
}

interface Props {
  dau: number;
  wau: number;
  mau: number;
  totalUsers: number;
  avgCompletionPct: number;
  dailyData: Array<{ date: string; count: number }>;
  topByListens: BookStat[];
  topByCompletion: BookStat[];
  funnel: { registered: number; openedBook: number; played5min: number };
}

function TopList({ items, max, color }: { items: BookStat[]; max: number; color: string }) {
  const t = useTranslations();
  if (items.length === 0) {
    return <p className="text-white/30 text-sm">{t('analytics_no_data')}</p>;
  }
  return (
    <ol className="space-y-3">
      {items.map((book, i) => (
        <li key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-white/70 truncate max-w-[75%]">
              <span className="text-white/30 mr-1.5">{i + 1}.</span>
              {book.title}
            </span>
            <span className="text-white/50 shrink-0 ml-2 tabular-nums">{book.count}</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${(book.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function AnalyticsClient({
  dau, wau, mau, totalUsers, avgCompletionPct,
  dailyData, topByListens, topByCompletion, funnel,
}: Props) {
  const t = useTranslations();

  const maxListens     = Math.max(...topByListens.map(b => b.count), 1);
  const maxCompletions = Math.max(...topByCompletion.map(b => b.count), 1);
  const maxFunnel      = Math.max(funnel.registered, 1);

  const funnelSteps = [
    { label: t('analytics_funnel_registered'), count: funnel.registered, color: 'bg-blue-500/70' },
    { label: t('analytics_funnel_opened'),     count: funnel.openedBook,  color: 'bg-blue-400/70' },
    { label: t('analytics_funnel_played5min'), count: funnel.played5min,  color: 'bg-blue-300/70' },
  ];

  return (
    <div className="min-h-screen">
      <Header showAdminLink />
      <main id="main-content" className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('analytics')}</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: t('analytics_dau'),            value: dau,                    sub: '24h' },
            { label: t('analytics_wau'),            value: wau,                    sub: '7d'  },
            { label: t('analytics_mau'),            value: mau,                    sub: '30d' },
            { label: t('analytics_total_users'),    value: totalUsers,             sub: ''    },
            { label: t('analytics_avg_completion'), value: `${avgCompletionPct}%`, sub: 'all time' },
          ].map(c => (
            <div
              key={c.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{c.label}</p>
              <p className="text-4xl font-bold text-white tabular-nums">{String(c.value)}</p>
              {c.sub && <p className="text-xs text-white/30 mt-1">{c.sub}</p>}
            </div>
          ))}
        </div>

        {/* 30-day activity chart */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm mb-8">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-5">
            {t('analytics_30d_chart')}
          </h2>
          {dailyData.length === 0 ? (
            <p className="text-center text-white/30 py-12 text-sm">{t('analytics_no_data')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                  }}
                  cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name={t('analytics_active')}
                  stroke="#3b82f6"
                  fill="url(#blueGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top books — 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-5">
              {t('analytics_top_week')}
            </h2>
            <TopList items={topByListens} max={maxListens} color="bg-blue-500/60" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-5">
              {t('analytics_top_completions')}
            </h2>
            <TopList items={topByCompletion} max={maxCompletions} color="bg-green-500/60" />
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-6">
            {t('analytics_funnel')}
          </h2>
          <div className="space-y-5 max-w-2xl">
            {funnelSteps.map((step, i) => {
              const pct = maxFunnel > 0 ? Math.round((step.count / funnel.registered) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/70">{step.label}</span>
                    <span className="text-white tabular-nums">
                      {step.count}
                      <span className="text-white/30 text-xs ml-2">{pct}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${step.color}`}
                      style={{ width: `${(step.count / maxFunnel) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
