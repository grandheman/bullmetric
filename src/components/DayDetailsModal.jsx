import React from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../utils/cn';
import './DayDetailsModal.css';

export default function DayDetailsModal({ isOpen, onClose, date, trades, dailyPnL }) {
    if (!isOpen) return null;

    // Aggregate by Platform
    const platformStats = trades.reduce((acc, trade) => {
        if (!acc[trade.platform]) {
            acc[trade.platform] = { pnl: 0, trades: 0 };
        }
        acc[trade.platform].pnl += trade.pnl;
        acc[trade.platform].trades += 1;
        return acc;
    }, {});

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{date}</h2>
                        <div className={cn("daily-summary", dailyPnL >= 0 ? "text-green" : "text-red")}>
                            {dailyPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            <span>${Math.abs(dailyPnL).toLocaleString()}</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="modal-body">
                    <div className="platform-breakdown">
                        <h3>Platform Breakdown</h3>
                        <div className="platform-grid">
                            {Object.entries(platformStats).map(([platform, stats]) => (
                                <div key={platform} className="platform-card">
                                    <span className="platform-name">{platform}</span>
                                    <span className={cn("platform-pnl", stats.pnl >= 0 ? "text-green" : "text-red")}>
                                        ${Math.abs(stats.pnl).toLocaleString()}
                                    </span>
                                    <span className="trade-count">{stats.trades} trades</span>
                                </div>
                            ))}
                            {Object.keys(platformStats).length === 0 && <p className="no-data">No trades for this day.</p>}
                        </div>
                    </div>

                    <div className="trades-list">
                        <h3>Trades</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Symbol</th>
                                        <th>Type</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>PnL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trades.map((trade, i) => (
                                        <tr key={trade.id || i}>
                                            <td>{trade.time || '--:--'}</td>
                                            <td>{trade.symbol}</td>
                                            <td>
                                                <span className={cn("badge", trade.type === 'LONG' ? 'bg-green' : 'bg-red')}>
                                                    {trade.type}
                                                </span>
                                            </td>
                                            <td>{trade.quantity}</td>
                                            <td>{trade.entryPrice}</td>
                                            <td className={trade.pnl >= 0 ? "text-green" : "text-red"}>
                                                {trade.pnl}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
