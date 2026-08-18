import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Sparkles } from 'lucide-react';

interface ScoreTrendChartProps {
  trends: any[];
}

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ trends }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
            Progress Trajectory
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">Communication Score Progression</h3>
        </div>
      </div>

      {trends.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800/60 text-center p-6 space-y-2">
          <TrendingUp className="w-8 h-8 text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">No session history yet</p>
          <p className="text-xs text-slate-500 max-w-xs">
            Complete your first AI conversation to plot your real speaking score trajectory.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="session" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[40, 100]} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="overall"
                name="Overall Score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="grammar"
                name="Grammar"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="fluency"
                name="Fluency"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
