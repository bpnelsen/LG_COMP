import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getTasks, updateTask } from '../api';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { CheckCircle2, Circle } from 'lucide-react';

const STATUSES = ['', 'open', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['', 'urgent', 'high', 'medium', 'low'];

export default function Tasks() {
  const [status, setStatus] = useState('open');
  const [priority, setPriority] = useState('');
  const [mine, setMine] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', status, priority, mine],
    queryFn: () => getTasks({ per_page: 50, ...(status && { status }), ...(priority && { priority }), ...(mine && { mine: 'true' }) }),
  });

  const complete = useMutation({
    mutationFn: (id: string) => updateTask(id, { status: 'completed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const tasks: Record<string, string>[] = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data?.pagination?.total ?? 0} tasks</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p || 'All priorities'}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="rounded" />
          Assigned to me
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Spinner /></div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No tasks found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {tasks.map((task) => {
            const done = task.status === 'completed' || task.status === 'cancelled';
            return (
              <div key={task.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => !done && complete.mutate(task.id)}
                  disabled={done}
                  className="mt-0.5 shrink-0 text-gray-400 hover:text-green-500 disabled:cursor-default transition-colors"
                >
                  {done
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <Circle className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </span>
                    <Badge value={task.priority} />
                    <Badge value={task.status} />
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    {task.loan_number && (
                      <Link to={`/loans/${task.loan_id}`} className="text-brand-600 hover:text-brand-700 font-medium">
                        {task.loan_number}
                      </Link>
                    )}
                    {task.assigned_to_name && <span>→ {task.assigned_to_name}</span>}
                    {task.due_date && (
                      <span className={new Date(task.due_date) < new Date() && !done ? 'text-red-500 font-medium' : ''}>
                        Due {task.due_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
