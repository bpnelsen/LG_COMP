import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBorrower } from '../api';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { ArrowLeft, Mail, Phone } from 'lucide-react';

const fmt = (n: number | string | undefined) => {
  if (!n) return '—';
  const v = parseFloat(String(n));
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${v.toLocaleString()}`;
};

export default function BorrowerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: borrower, isLoading } = useQuery({
    queryKey: ['borrower', id],
    queryFn: () => getBorrower(id!),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>;
  if (!borrower) return <p className="text-gray-500">Borrower not found.</p>;

  const contacts: Record<string, string>[] = borrower.contacts ?? [];
  const loans: Record<string, string>[] = borrower.loans ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/borrowers" className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{borrower.legal_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{borrower.entity_type?.replace(/_/g, ' ')}
            {borrower.industry ? ` · ${borrower.industry}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Financial profile */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Financial Profile</h2>
          <dl className="space-y-3">
            {[
              ['Credit Score', borrower.credit_score || '—'],
              ['Annual Revenue', fmt(borrower.annual_revenue)],
              ['Net Worth', fmt(borrower.net_worth)],
              ['Total Debt', fmt(borrower.total_debt)],
              ['Years in Business', borrower.years_in_business || '—'],
              ['Tax ID', borrower.tax_id ? '••••' + borrower.tax_id.slice(-4) : '—'],
              ['NAICS', borrower.naics_code || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <dt className="text-gray-500">{k}</dt>
                <dd className="text-gray-900 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Contacts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Contacts</h2>
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-400">No contacts on file</p>
          ) : (
            <div className="space-y-4">
              {contacts.map((c) => (
                <div key={c.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                    {c.is_primary === 'true' || c.is_primary === true as unknown as string
                      ? <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">Primary</span>
                      : null}
                  </div>
                  {c.title && <p className="text-xs text-gray-500 mt-0.5">{c.title}</p>}
                  {c.contact_type && <p className="text-xs text-gray-400 capitalize mt-0.5">{c.contact_type.replace(/_/g, ' ')}</p>}
                  <div className="flex gap-3 mt-1.5">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                        <Mail className="w-3 h-3" />{c.email}
                      </a>
                    )}
                    {c.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />{c.phone}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loans */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Loans ({loans.length})</h2>
          {loans.length === 0 ? (
            <p className="text-sm text-gray-400">No loans</p>
          ) : (
            <div className="space-y-3">
              {loans.map((l) => (
                <Link key={l.id} to={`/loans/${l.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-brand-600">{l.loan_number}</span>
                    <Badge value={l.status} />
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{l.loan_type?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-700 mt-0.5 font-medium">
                    ${parseFloat(l.committed_amount).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {borrower.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{borrower.notes}</p>
        </div>
      )}
    </div>
  );
}
