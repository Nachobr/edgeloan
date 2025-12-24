import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MarketState } from '../types';

interface PriceChartProps {
  data: MarketState['priceHistory'];
  currentPrice: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, currentPrice }) => {
  const isPositive = data.length > 1 && data[data.length - 1].price >= data[0].price;
  const color = isPositive ? '#00FF41' : '#FF2A00';

  return (
    <div className="h-full w-full bg-terminal-panel border border-terminal-border p-4 rounded-sm flex flex-col">
      <div className="flex justify-between items-end mb-4 border-b border-terminal-border pb-2">
        <div>
          <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest">ETH/USD Oracle</h3>
          <div className={`text-4xl font-mono font-bold tracking-tighter ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
            ${currentPrice.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 font-mono">LIVE FEED • 5s UPDATE</span>
        </div>
      </div>

      {/* 
         Fix for Recharts width(-1) error:
         We use a relative container with flex-grow, and an absolute child to fill it.
         This ensures ResponsiveContainer has definite dimensions to measure.
      */}
      <div className="flex-grow min-h-[200px] w-full relative" style={{ minHeight: '300px' }}>
        <div className="absolute inset-0" style={{ position: 'absolute', inset: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#666"
                tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#666"
                tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(value) => `$${value}`}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1115', borderColor: '#333', color: '#fff' }}
                itemStyle={{ color: color, fontFamily: 'monospace' }}
                labelStyle={{ color: '#888', marginBottom: '5px' }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};