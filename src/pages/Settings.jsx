import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTrades } from '../context/TradeContext';
import { deleteAllTrades } from '../services/tradeService';
import { Trash2, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import './Settings.css';

export default function Settings() {
    const { currentUser } = useAuth();
    const { refreshTrades } = useTrades();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDeleteAll = async () => {
        if (!currentUser) return;

        setLoading(true);
        setStatus(null);
        try {
            await deleteAllTrades(currentUser.uid);
            await refreshTrades();
            setStatus({ type: 'success', message: 'All trades have been cleared successfully.' });
            setConfirmDelete(false);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Failed to clear trades: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account and data settings.</p>
            </div>

            <div className="settings-card danger-zone">
                <div className="card-header">
                    <ShieldAlert size={24} className="danger-icon" />
                    <h2>Danger Zone</h2>
                </div>
                <div className="card-body">
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Clear All Trade Data</h3>
                            <p>This will permanently delete all your imported trades from the database. This action cannot be undone.</p>
                        </div>
                        <div className="setting-action">
                            {!confirmDelete ? (
                                <button
                                    className="danger-btn"
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    <Trash2 size={18} /> Clear Data
                                </button>
                            ) : (
                                <div className="confirmation-group">
                                    <span className="confirm-text">Are you sure?</span>
                                    <button
                                        className="confirm-btn"
                                        onClick={handleDeleteAll}
                                        disabled={loading}
                                    >
                                        {loading ? 'Clearing...' : 'Yes, Delete Everything'}
                                    </button>
                                    <button
                                        className="cancel-btn"
                                        onClick={() => setConfirmDelete(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {status && (
                <div className={`status-modal ${status.type}`}>
                    {status.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    <span>{status.message}</span>
                    <button className="status-close" onClick={() => setStatus(null)}>Dismiss</button>
                </div>
            )}
        </div>
    );
}
