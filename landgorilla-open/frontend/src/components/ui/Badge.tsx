const variants: Record<string, string> = {
  performing:   'bg-green-100 text-green-800',
  compliant:    'bg-green-100 text-green-800',
  funded:       'bg-blue-100 text-blue-800',
  approved:     'bg-blue-100 text-blue-800',
  application:  'bg-gray-100 text-gray-700',
  underwriting: 'bg-yellow-100 text-yellow-800',
  pending:      'bg-yellow-100 text-yellow-800',
  open:         'bg-yellow-100 text-yellow-800',
  watchlist:    'bg-orange-100 text-orange-800',
  exception:    'bg-orange-100 text-orange-800',
  in_progress:  'bg-blue-100 text-blue-800',
  disbursed:    'bg-green-100 text-green-800',
  default:      'bg-red-100 text-red-800',
  breach:       'bg-red-100 text-red-800',
  foreclosure:  'bg-red-100 text-red-800',
  cancelled:    'bg-gray-100 text-gray-500',
  paid_off:     'bg-gray-100 text-gray-600',
  charged_off:  'bg-gray-100 text-gray-500',
  completed:    'bg-green-100 text-green-800',
  waived:       'bg-gray-100 text-gray-600',
  urgent:       'bg-red-100 text-red-800',
  high:         'bg-orange-100 text-orange-800',
  medium:       'bg-yellow-100 text-yellow-800',
  low:          'bg-gray-100 text-gray-600',
};

interface Props { value: string; className?: string }

export default function Badge({ value, className = '' }: Props) {
  const cls = variants[value] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls} ${className}`}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}
