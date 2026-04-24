import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getBorrowers } from '../api';
import Spinner from '../components/ui/Spinner';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ENTITY_TYPES = ['', 'individual', 'llc', 'corporation', 'partnership', 'trust'];

export default function Borrowers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['borrowers', page, search, entityType],
    queryFn: () => getBorrowers({ page, per_page: 25, ...(search && { search }), ...(entityType && { entity_type: entityType }) }),
  });

  const borrowers: Record<string, string>[] = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Borrowers</h1>
        <p className="text-sm text-gray-500 mt-0.5">{pagination?.total ?? 0} borrowers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t || 'All entity types'}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : borrowers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No borrowers found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Name', 'Type', 'Credit Score', 'Annual Revenue', 'Industry', 'Created'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {borrowers.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/borrowers/${b.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                      {b.legal_name}
                    </Link>
                    {b.dba_name && <p className="text-xs text-gray-400">dba {b.dba_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{b.entity_type?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-700">{b.credit_score || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {b.annual_revenue ? `$${(parseFloat(b.annual_revenue) / 1_000_000).toFixed(1)}M` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{b.industry || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{b.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
