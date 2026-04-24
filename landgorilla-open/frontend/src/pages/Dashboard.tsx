import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getPortfolioSummary, getPortfolioPerformance } from '../api';
import KpiCard from '../components/ui/KpiCard';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toFixed(0)}`;

const STATUS_COLORS: Record<string, string> = {
  performing:   '#22c55e',
  funded:       '#3b82f6',
  approved:     '#60a5fa',
  underwriting: '#facc15',
  application:  '#94a3b8',
  watchlist:    '#f97316',
  default:      '#ef4444',
  foreclosure:  '#dc2626',
  paid_off:     '#d1d5db',
  charged_off:  '#9ca3af',
};

export default function Dashboard() {
  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: getPortfolioSummary,
  });
  const { data: perf, isLoading: perfLoading } = useQuery({
    queryKey: ['portfolio', 'performance'],
    queryFn: () => getPortfolioPerformance(12),
  });

  if (sumLoading || perfLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const pieData = Object.entries(summary?.loans_by_status ?? {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  const monthlyData = (perf?.monthly_originations ?? []).map((m: Record<string, string>) => ({
    month: m.month?.slice(5) ?? '',
    loans: parseInt(m.new_loans),
    amount: parseFloat(m.total_disbursed) / 1_000_000,
  }));

  const overdueCovenants: Array<Record<string, string>> = perf?.overdue_covenants ?? [];
  const compliance = perf?.covenant_compliance ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Portfolio Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your loan portfolio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Loans"
          value={summary?.total_loans ?? 0}
          sub={`${summary?.performing_loans ?? 0} performing`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="bg-green-50 text-green-600"
        />
        <KpiCard
          label="Total Committed"
          value={fmt(summary?.total_committed ?? 0)}
          sub={`${fmt(summary?.total_outstanding ?? 0)} outstanding`}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-brand-50 text-brand-600"
        />
        <KpiCard
          label="Avg Interest Rate"
          value={`${((summary?.avg_interest_rate ?? 0) * 100).toFixed(2)}%`}
          sub={`Avg LTV ${((summary?.avg_ltv ?? 0) * 100).toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-purple-50 text-purple-600"
        />
        <KpiCard
          label="Watchlist / Default"
          value={`${summary?.watchlist_loans ?? 0} / ${summary?.default_loans ?? 0}`}
          sub="loans requiring attention"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly originations */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Originations (last 12 months)</h2>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No origination data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={20}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${v}M`} />
                <Tooltip formatter={(v, name) => name === 'amount' ? [`$${Number(v).toFixed(1)}M`, 'Volume'] : [v, 'Loans']} />
                <Bar yAxisId="left" dataKey="loans" fill="#3b82f6" name="loans" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="amount" fill="#bfdbfe" name="amount" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Loans by Status</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No loans yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={80}
                  dataKey="value" nameKey="name">
                  {pieData.map((entry) => (
                    <Cell key={entry.name}
                      fill={STATUS_COLORS[entry.name.replace(/ /g, '_')] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Covenant compliance + overdue */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Covenant Compliance</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Compliant', value: compliance.compliant ?? 0, color: 'text-green-600' },
              { label: 'Exception', value: compliance.exception ?? 0, color: 'text-orange-600' },
              { label: 'Breach', value: compliance.breach ?? 0, color: 'text-red-600' },
              { label: 'Waived', value: compliance.waived ?? 0, color: 'text-gray-500' },
            ].map((c) => (
              <div key={c.label} className="bg-gray-50 rounded-lg px-4 py-3">
                <p className={`text-2xl font-semibold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Overdue Covenants</h2>
            {overdueCovenants.length > 0 && (
              <span className="text-xs text-red-600 font-medium">{overdueCovenants.length} overdue</span>
            )}
          </div>
          {overdueCovenants.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No overdue covenants</p>
          ) : (
            <div className="space-y-2">
              {overdueCovenants.slice(0, 5).map((c) => (
                <Link key={c.id} to={`/loans/${c.loan_id}`}
                  className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded px-1 -mx-1 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{c.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Loan {c.loan_number} · Due {c.next_due_date?.slice(0, 10)}</p>
                  </div>
                  <Badge value={c.status} className="ml-2 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
