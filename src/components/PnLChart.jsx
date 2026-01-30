import React, { useState, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { subDays, subMonths, isAfter, startOfYear, format, parseISO } from 'date-fns';
import './PnLChart.css';

const TIMEFRAMES = {
    '1W': { label: '1 Week', days: 7 },
    '1M': { label: '1 Month', days: 30 },
    '3M': { label: '3 Months', months: 3 },
    'YTD': { label: 'YTD', isYTD: true },
    'ALL': { label: 'All Time', isAll: true }
};

export default function PnLChart({ trades }) {
    const [timeframe, setTimeframe] = useState('1M');

    const chartData = useMemo(() => {
        if (!trades.length) return [];

        const now = new Date();
        let startDate;

        const tf = TIMEFRAMES[timeframe];
        if (tf.days) startDate = subDays(now, tf.days);
        else if (tf.months) startDate = subMonths(now, tf.months);
        else if (tf.isYTD) startDate = startOfYear(now);
        else startDate = new Date(0); // All time

        // Filter trades
        const filteredTrades = trades.filter(t => isAfter(parseISO(t.date), startDate));

        // Sort by date
        filteredTrades.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Aggregate by Day for the chart
        const dailyData = filteredTrades.reduce((acc, t) => {
            const dateKey = format(parseISO(t.date), 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = 0;
            }
            acc[dateKey] += t.pnl;
            return acc;
        }, {});

        // Calculate Cumulative PnL
        let cumulative = 0;
        return Object.entries(dailyData)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([date, pnl]) => {
                cumulative += pnl;
                return {
                    date,
                    displayDate: format(parseISO(date), 'MMM d'),
                    dailyPnL: pnl,
                    cumulativePnL: cumulative
                };
            });
    }, [trades, timeframe]);

    const totalPnL = chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnL : 0;

    return (
        <div className="chart-container">
            <div className="chart-header">
                <div className="chart-title">
                    <h3>Performance Analytics</h3>
                    <span className={totalPnL >= 0 ? 'text-green' : 'text-red'}>
                        {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
                    </span>
                </div>
                <div className="timeframe-selector">
                    {Object.entries(TIMEFRAMES).map(([key, config]) => (
                        <button
                            key={key}
                            className={`tf-btn ${timeframe === key ? 'active' : ''}`}
                            onClick={() => setTimeframe(key)}
                        >
                            {config.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
                <ResponsiveContainer>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#475569" opacity={0.3} />
                        <XAxis
                            dataKey="displayDate"
                            tick={{ fill: '#94A3B8', fontSize: 13, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#94A3B8', fontSize: 13, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1E293B', borderColor: '#3B82F6', color: '#F1F5F9', borderRadius: '8px', padding: '12px' }}
                            itemStyle={{ color: '#60A5FA', fontWeight: 600 }}
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Cumulative PnL']}
                        />
                        <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" />
                        <Area
                            type="monotone"
                            dataKey="cumulativePnL"
                            stroke="#60A5FA"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorPnL)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
