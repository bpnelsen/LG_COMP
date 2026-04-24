import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProperty } from '../api';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { ArrowLeft, MapPin } from 'lucide-react';

const fmt = (n: number | string | undefined) => {
  if (!n) return '—';
  const v = parseFloat(String(n));
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : `$${v.toLocaleString()}`;
};

const VALUATION_TYPE_LABELS: Record<string, string> = {
  appraisal: 'Appraisal',
  bpo: 'BPO',
  avm: 'AVM',
  inspection: 'Inspection',
  tax_assessed: 'Tax Assessed',
};

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getProperty(id!),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>;
  if (!property) return <p className="text-gray-500">Property not found.</p>;

  const valuations: Record<string, string>[] = property.valuations ?? [];
  const loans: Record<string, string>[] = property.loans ?? [];
  const latestValuation = valuations[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/properties" className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{property.address_line1}</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {property.city}, {property.state} {property.zip_code}
            {property.property_type && ` · ${property.property_type.replace(/_/g, ' ')}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Property details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Property Details</h2>
          <dl className="space-y-3">
            {[
              ['Borrower', property.borrower_name || '—'],
              ['Type', property.property_type?.replace(/_/g, ' ') || '—'],
              ['Square Footage', property.square_footage ? `${parseFloat(property.square_footage).toLocaleString()} sq ft` : '—'],
              ['Lot Size', property.lot_size ? `${parseFloat(property.lot_size).toLocaleString()} sq ft` : '—'],
              ['Year Built', property.year_built || '—'],
              ['Units', property.units || '—'],
              ['Zoning', property.zoning || '—'],
              ['Occupancy Rate', property.occupancy_rate ? `${property.occupancy_rate}%` : '—'],
              ['NOI', fmt(property.noi)],
              ['Parcel #', property.parcel_number || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <dt className="text-gray-500">{k}</dt>
                <dd className="text-gray-900 font-medium capitalize">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Valuations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Valuations</h2>
            {latestValuation && (
              <span className="text-xs text-gray-500">
                Latest: {fmt(latestValuation.value)}
              </span>
            )}
          </div>
          {valuations.length === 0 ? (
            <p className="text-sm text-gray-400">No valuations on file</p>
          ) : (
            <div className="space-y-3">
              {valuations.map((v) => (
                <div key={v.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{fmt(v.value)}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {VALUATION_TYPE_LABELS[v.valuation_type] ?? v.valuation_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{v.valuation_date?.slice(0, 10)}</p>
                  {v.appraiser_name && (
                    <p className="text-xs text-gray-400 mt-0.5">{v.appraiser_name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loans */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Loans ({loans.length})</h2>
          {loans.length === 0 ? (
            <p className="text-sm text-gray-400">No loans on this property</p>
          ) : (
            <div className="space-y-3">
              {loans.map((l) => (
                <Link
                  key={l.id}
                  to={`/loans/${l.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-brand-600">{l.loan_number}</span>
                    <Badge value={l.status} />
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{l.loan_type?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-700 mt-0.5 font-medium">
                    {fmt(l.committed_amount)} committed
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
