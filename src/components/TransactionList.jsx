import React from 'react';
import { format, parseISO } from 'date-fns';
import './TransactionList.css';

export default function TransactionList({ trades, title, description }) {
    if (trades.length === 0) {
        return (
            <div className="transaction-list-container empty">
                <p>No transactions for {description || 'this period'}</p>
            </div>
        );
    }

    // Sort trades: newest first
    const sortedTrades = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="transaction-list-container">
            <h3>{title} <span className="count">({trades.length})</span></h3>
            <div className="transaction-list">
                {sortedTrades.map((trade, idx) => (
                    <div key={trade.id || idx} className="transaction-item">
                        <div className="trans-header">
                            <span className="trans-symbol">{trade.symbol}</span>
                            <span className={`trans-pnl ${trade.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                                ${trade.pnl.toLocaleString()}
                            </span>
                        </div>
                        <div className="trans-details">
                            <span>{trade.date ? format(parseISO(trade.date), 'MMM d') : '-'}</span>
                            <span className="trans-account">{trade.account}</span>
                            <span>{trade.type}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
