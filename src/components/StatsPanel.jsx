import React from 'react';
import './StatsPanel.css';

export default function StatsPanel({ trades }) {
    const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
    const totalTrades = trades.length;

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);

    const winRate = totalTrades > 0
        ? ((winningTrades.length / totalTrades) * 100).toFixed(1)
        : '0.0';

    const avgWin = winningTrades.length > 0
        ? winningTrades.reduce((acc, t) => acc + t.pnl, 0) / winningTrades.length
        : 0;

    const avgLoss = losingTrades.length > 0
        ? Math.abs(losingTrades.reduce((acc, t) => acc + t.pnl, 0) / losingTrades.length)
        : 0;

    // Risk to Reward: Avg Win / Avg Loss
    // If avgLoss is 0, we can't divide, show Infinity or N/A
    const riskReward = avgLoss > 0
        ? (avgWin / avgLoss).toFixed(2)
        : avgWin > 0 ? "∞" : "0.00";

    const StatCard = ({ label, value, subValue, className }) => (
        <div className={`stat-card ${className || ''}`}>
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
            {subValue && <span className="stat-sub">{subValue}</span>}
        </div>
    );

    return (
        <div className="stats-panel">
            <h3>Month Overview</h3>
            <StatCard
                label="Net P&L"
                value={`$${totalPnL.toLocaleString()}`}
                className={totalPnL >= 0 ? 'positive' : 'negative'}
            />
            <StatCard
                label="Win Rate"
                value={`${winRate}%`}
                subValue={`${winningTrades.length}W / ${losingTrades.length}L`}
            />
            <StatCard
                label="Total Trades"
                value={totalTrades}
            />
            <StatCard
                label="Avg Win"
                value={`$${Math.round(avgWin).toLocaleString()}`}
                className="text-green"
            />
            <StatCard
                label="Avg Loss"
                value={`$${Math.round(avgLoss).toLocaleString()}`}
                className="text-red"
            />
            <StatCard
                label="Risk : Reward"
                value={`1 : ${riskReward}`}
            />
        </div>
    );
}
