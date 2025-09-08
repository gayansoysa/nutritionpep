"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ChartData {
  date: string;
  consumed: Record<string, number>;
  target: Record<string, number> | null;
}

interface HistoryChartProps {
  data: ChartData[];
  dataKey: string;
  targetKey: string;
  color: string;
  unit: string;
}

export default function HistoryChart({ data, dataKey, targetKey, color, unit }: HistoryChartProps) {
  // Transform data for the chart
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    consumed: d.consumed[dataKey] || 0,
    target: d.target?.[targetKey] || null,
  }));

  // Calculate average target for reference line
  const avgTarget = chartData.reduce((sum, d, _, arr) => {
    if (d.target) sum += d.target;
    return sum;
  }, 0) / chartData.filter(d => d.target).length;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 50', 'dataMax + 50']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number) => [`${Math.round(value)}${unit}`, 'Consumed']}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          
          {/* Target reference line */}
          {avgTarget && (
            <ReferenceLine 
              y={avgTarget} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ value: `Target: ${Math.round(avgTarget)}${unit}`, position: "top", fontSize: 10 }}
            />
          )}
          
          <Line 
            type="monotone" 
            dataKey="consumed" 
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}