import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLoan, getCovenants, getDisbursements, getPayments } from '../api';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { ArrowLeft } from 'lucide-react';

const fmt = (n: number | string) => {
  const v = parseFloat(String(n));
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const tabs = ['Overview', 'Covenants', 'Disbursements', 'Payments'];

export default function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState('Overview');

  const { data: loan, isLoading } = useQuery({ queryKey: ['loan', id], queryFn: () => getLoan(id!) });
  const { data: covenants = [] } = useQuery({ queryKey: ['covenants', id], queryFn: () => getCovenants(id!) });
  const { data: disbData } = useQuery({ queryKey: ['disbursements', id], queryFn: () => getDisbursements(id!) });
  const { data: payData } = useQuery({ queryKey: ['payments', id], queryFn: () => getPayments(id!) });

  const disbursements: Record<string, string>[] = disbData?.data ?? [];
  const payments: Record<string, string>[] = payData?.data ?? [];

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>;
  if (!loan) return <p className="text-gray-500">Loan not found.</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/loans" className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{loan.loan_number}</h1>
            <Badge value={loan.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{loan.borrower_name} · {loan.property_address}</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Loan Details</h2>
            <dl className="space-y-3">
              {[
                ['Type', loan.loan_type?.replace(/_/g, ' ')],
                ['Rate', `${(parseFloat(loan.interest_rate) * 100).toFixed(2)}% ${loan.rate_type}`],
                ['Committed', fmt(loan.committed_amount)],
                ['Outstanding', fmt(loan.current_balance)],
                ['LTV', loan.ltv_ratio ? `${(parseFloat(loan.ltv_ratio) * 100).toFixed(1)}%` : '—'],
                ['DSCR', loan.dscr ? parseFloat(loan.dscr).toFixed(2) : '—'],
                ['Origination', loan.origination_date?.slice(0, 10) || '—'],
                ['Maturity', loan.maturity_date?.slice(0, 10) || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="text-gray-900 font-medium capitalize">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Financial Summary</h2>
            <dl className="space-y-3">
              {[
                ['Committed', fmt(loan.committed_amount)],
                ['Outstanding Balance', fmt(loan.current_balance)],
                ['Disbursements', fmt(disbData?.meta?.total_disbursed ?? 0)],
                ['Total Payments', fmt(payData?.meta?.total_paid ?? 0)],
                ['Principal Paid', fmt(payData?.meta?.total_principal ?? 0)],
                ['Interest Paid', fmt(payData?.meta?.total_interest ?? 0)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="text-gray-900 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* Covenants */}
      {tab === 'Covenants' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {covenants.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No covenants on this loan</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Type', 'Description', 'Threshold', 'Frequency', 'Next Due', 'Status', 'Last Tested'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(covenants as Record<string, string>[]).map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 capitalize text-gray-600">{c.covenant_type?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{c.description}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.threshold_operator && c.threshold_value
                        ? `${c.threshold_operator} ${parseFloat(c.threshold_value).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{c.frequency?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-600">{c.next_due_date?.slice(0, 10) || '—'}</td>
                    <td className="px-4 py-3"><Badge value={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.last_tested_at ? new Date(c.last_tested_at).toLocaleDateString() : '—'}
                      {c.last_tested_value ? ` (${parseFloat(c.last_tested_value).toFixed(2)})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Disbursements */}
      {tab === 'Disbursements' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {disbursements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No disbursements yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Date', 'Amount', 'Description', 'Wire Ref', 'Requested By', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disbursements.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 text-gray-600">{d.disbursement_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fmt(d.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{d.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{d.wire_reference || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{d.requested_by_name || '—'}</td>
                    <td className="px-4 py-3"><Badge value={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payments */}
      {tab === 'Payments' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {payments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No payments recorded</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Date', 'Total', 'Principal', 'Interest', 'Fees', 'Balance After', 'Method'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-gray-600">{p.payment_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(p.principal)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(p.interest)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(p.fees)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{fmt(p.balance_after)}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{p.payment_method || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
