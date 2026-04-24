import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getLoans } from '../api';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const fmt = (n: number | string) => {
  const v = parseFloat(String(n));
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;
};

const STATUSES = ['', 'application', 'underwriting', 'approved', 'funded', 'performing', 'watchlist', 'default', 'foreclosure', 'paid_off'];
const TYPES = ['', 'construction', 'bridge', 'permanent', 'mezzanine', 'equity'];

export default function Loans() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loanType, setLoanType] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['loans', page, status, loanType],
    queryFn: () => getLoans({ page, per_page: 20, ...(status && { status }), ...(loanType && { loan_type: loanType }) }),
  });

  const loans: Record<string, string>[] = data?.data ?? [];
  const pagination = data?.pagination;

  const filtered = search
    ? loans.filter((l) =>
        l.loan_number?.toLowerCase().includes(search.toLowerCase()) ||
        l.borrower_name?.toLowerCase().includes(search.toLowerCase())
      )
    : loans;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Loans</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination?.total ?? 0} total loans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search by loan # or borrower…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
        <select value={loanType} onChange={(e) => { setLoanType(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {TYPES.map((t) => <option key={t} value={t}>{t || 'All types'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No loans found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Loan #', 'Borrower', 'Type', 'Status', 'Committed', 'Balance', 'Rate', 'Maturity'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/loans/${loan.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                      {loan.loan_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{loan.borrower_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{loan.loan_type?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3"><Badge value={loan.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{fmt(loan.committed_amount)}</td>
                  <td className="px-4 py-3 text-gray-700">{fmt(loan.current_balance)}</td>
                  <td className="px-4 py-3 text-gray-700">{(parseFloat(loan.interest_rate) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-gray-500">{loan.maturity_date?.slice(0, 10) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {pagination.page} of {pagination.total_pages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.total_pages}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
