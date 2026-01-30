import React, { useState, useEffect } from 'react';
import { fetchMarketData, getMarketStatus } from '../services/marketData';
import { getCurrentFuturesSymbol, getRolloverStatus } from '../utils/futuresUtils';
import { RefreshCw, TrendingUp, Clock } from 'lucide-react';
import './Converter.css';

export default function Converter() {
    const [prices, setPrices] = useState({});
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [futuresInfo, setFuturesInfo] = useState({ es: null, nq: null });
    const [marketStatus, setMarketStatus] = useState({ isOpen: true, status: 'Checking...' });

    // User inputs
    const [values, setValues] = useState({
        es: '',
        spx: '',
        spy: '',
        nq: '',
        ndx: '',
        qqq: ''
    });

    // Ratios (Basis / Multiplier) - Calculated from live data
    const [ratios, setRatios] = useState({
        // SPX Group
        basisES: 0, // ES - SPX
        ratioSPY: 10, // SPX / SPY approx

        // NDX Group
        basisNQ: 0, // NQ - NDX
        ratioQQQ: 40 // NDX / QQQ approx can vary, historically ~40 but NDX is ~20k, QQQ ~500 -> 40x
    });

    useEffect(() => {
        // Initial setup for Futures Symbols
        const esInfo = getCurrentFuturesSymbol('ES');
        const nqInfo = getCurrentFuturesSymbol('NQ');
        const esRoll = getRolloverStatus();
        const nqRoll = getRolloverStatus(); // Same calendar usually

        setFuturesInfo({
            es: { ...esInfo, rollover: esRoll },
            nq: { ...nqInfo, rollover: nqRoll }
        });

        loadData();

        // Auto-sync schedule check every minute
        const intervalId = setInterval(() => {
            const now = new Date();
            const nyTime = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
            // Sync at 09:30, 12:00, 16:00 (approx)
            // Just checking minute 00 of hours 9, 12, 16? 
            // Better: Check if we just crossed a boundary. 
            // Simple approach: Sync if it's 9:31, 12:01, 16:01 to be safe data is ready?
            // Or just sync every 5 minutes if Open? User asked for specific times.
            // Let's sticking to "Auto sync" + Manual. 
            // We will just refresh market status every minute.
            setMarketStatus(getMarketStatus());

            // Auto-fetch at specific times if desired, or just rely on user. 
            // User said "We should pull data... about 4 times a day".
            if (nyTime.startsWith('09:31') || nyTime.startsWith('12:01') || nyTime.startsWith('16:01')) {
                loadData();
            }
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const status = getMarketStatus();
            setMarketStatus(status);

            const data = await fetchMarketData(['ES', 'SPX', 'SPY', 'NQ', 'NDX', 'QQQ']);
            setPrices(data);
            setLastUpdated(new Date());

            // Calculate current live ratios
            const newRatios = { ...ratios };
            if (data.ES && data.SPX) newRatios.basisES = data.ES - data.SPX;
            if (data.SPX && data.SPY) newRatios.ratioSPY = data.SPX / data.SPY;

            if (data.NQ && data.NDX) newRatios.basisNQ = data.NQ - data.NDX;
            if (data.NDX && data.QQQ) newRatios.ratioQQQ = data.NDX / data.QQQ;

            setRatios(newRatios);

            // Populate inputs with live data if they are empty or user just synced
            setValues({
                es: data.ES ? data.ES.toFixed(2) : '',
                spx: data.SPX ? data.SPX.toFixed(2) : '',
                spy: data.SPY ? data.SPY.toFixed(2) : '',
                nq: data.NQ ? data.NQ.toFixed(2) : '',
                ndx: data.NDX ? data.NDX.toFixed(2) : '',
                qqq: data.QQQ ? data.QQQ.toFixed(2) : ''
            });

        } catch (err) {
            console.error("Failed to sync data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (group, key, value) => {
        const val = parseFloat(value);
        if (isNaN(val)) {
            setValues(prev => ({ ...prev, [key]: value }));
            return;
        }

        const newValues = { ...values, [key]: value };

        if (group === 'SPX') {
            if (key === 'es') {
                newValues.spx = (val - ratios.basisES).toFixed(2);
                newValues.spy = ((val - ratios.basisES) / ratios.ratioSPY).toFixed(2);
            } else if (key === 'spx') {
                newValues.es = (val + ratios.basisES).toFixed(2);
                newValues.spy = (val / ratios.ratioSPY).toFixed(2);
            } else if (key === 'spy') {
                newValues.spx = (val * ratios.ratioSPY).toFixed(2);
                newValues.es = ((val * ratios.ratioSPY) + ratios.basisES).toFixed(2);
            }
        } else if (group === 'NDX') {
            if (key === 'nq') {
                newValues.ndx = (val - ratios.basisNQ).toFixed(2);
                newValues.qqq = ((val - ratios.basisNQ) / ratios.ratioQQQ).toFixed(2);
            } else if (key === 'ndx') {
                newValues.nq = (val + ratios.basisNQ).toFixed(2);
                newValues.qqq = (val / ratios.ratioQQQ).toFixed(2);
            } else if (key === 'qqq') {
                newValues.ndx = (val * ratios.ratioQQQ).toFixed(2);
                newValues.nq = ((val * ratios.ratioQQQ) + ratios.basisNQ).toFixed(2);
            }
        }

        setValues(newValues);
    };

    return (
        <div className="converter-page">
            <header className="page-header">
                <div>
                    <h1>Futures Converter</h1>
                    <p className="subtitle">Real-time fair value conversion & basis tracking</p>
                </div>
                <div className="header-controls">
                    <div className={`market-status ${marketStatus.isOpen ? 'status-open' : 'status-closed'}`}>
                        <Clock size={14} />
                        {marketStatus.status}
                    </div>
                    <button
                        onClick={loadData}
                        className={`sync-btn ${loading ? 'spinning' : ''}`}
                        disabled={loading}
                    >
                        <RefreshCw size={18} />
                        {loading ? 'Syncing...' : 'Sync Data'}
                    </button>
                </div>
            </header>

            {lastUpdated && (
                <div className="last-updated">
                    Data Source: Yahoo Finance • Updated: {lastUpdated.toLocaleTimeString()}
                    {!marketStatus.isOpen && marketStatus.isPostMarket && (
                        <span className="close-price-note"> (Closing Prices)</span>
                    )}
                </div>
            )}

            <div className="converter-grid">
                {/* S&P 500 Group */}
                <div className="converter-card">
                    <div className="card-header">
                        <h2>S&P 500</h2>
                        <span className="live-basis">Basis: {ratios.basisES.toFixed(2)}</span>
                    </div>

                    {futuresInfo.es && (
                        <div className={`contract-info ${futuresInfo.es.rollover ? 'rollover-active' : ''}`}>
                            <span className="contract-label">Active Contract:</span>
                            <strong>{futuresInfo.es.shortCode}</strong>
                            {futuresInfo.es.rollover && (
                                <div className="rollover-alert">
                                    ⚠️ {futuresInfo.es.rollover.message}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="input-group">
                        <label>
                            <span className="label-text">Futures (/ES)</span>
                            <input
                                type="number"
                                value={values.es}
                                onChange={(e) => handleInputChange('SPX', 'es', e.target.value)}
                                placeholder="Enter ES value"
                            />
                        </label>
                        <div className="eq-symbol">=</div>
                        <label>
                            <span className="label-text">Index (SPX)</span>
                            <input
                                type="number"
                                value={values.spx}
                                onChange={(e) => handleInputChange('SPX', 'spx', e.target.value)}
                                placeholder="Enter SPX value"
                            />
                        </label>
                        <div className="eq-symbol">=</div>
                        <label>
                            <span className="label-text">ETF (SPY)</span>
                            <input
                                type="number"
                                value={values.spy}
                                onChange={(e) => handleInputChange('SPX', 'spy', e.target.value)}
                                placeholder="Enter SPY value"
                            />
                        </label>
                    </div>
                </div>

                {/* Nasdaq 100 Group */}
                <div className="converter-card">
                    <div className="card-header">
                        <h2>Nasdaq 100</h2>
                        <span className="live-basis">Basis: {ratios.basisNQ.toFixed(2)}</span>
                    </div>

                    {futuresInfo.nq && (
                        <div className={`contract-info ${futuresInfo.nq.rollover ? 'rollover-active' : ''}`}>
                            <span className="contract-label">Active Contract:</span>
                            <strong>{futuresInfo.nq.shortCode}</strong>
                            {futuresInfo.nq.rollover && (
                                <div className="rollover-alert">
                                    ⚠️ {futuresInfo.nq.rollover.message}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="input-group">
                        <label>
                            <span className="label-text">Futures (/NQ)</span>
                            <input
                                type="number"
                                value={values.nq}
                                onChange={(e) => handleInputChange('NDX', 'nq', e.target.value)}
                                placeholder="Enter NQ value"
                            />
                        </label>
                        <div className="eq-symbol">=</div>
                        <label>
                            <span className="label-text">Index (NDX)</span>
                            <input
                                type="number"
                                value={values.ndx}
                                onChange={(e) => handleInputChange('NDX', 'ndx', e.target.value)}
                                placeholder="Enter NDX value"
                            />
                        </label>
                        <div className="eq-symbol">=</div>
                        <label>
                            <span className="label-text">ETF (QQQ)</span>
                            <input
                                type="number"
                                value={values.qqq}
                                onChange={(e) => handleInputChange('NDX', 'qqq', e.target.value)}
                                placeholder="Enter QQQ value"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
