import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { fetchTrades } from '../services/tradeService';

const TradeContext = createContext();

export function useTrades() {
    return useContext(TradeContext);
}

export function TradeProvider({ children }) {
    const { currentUser } = useAuth();
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccounts, setSelectedAccounts] = useState([]);

    useEffect(() => {
        async function loadTrades() {
            if (!currentUser) return;
            setLoading(true);
            try {
                const allTrades = await fetchTrades(currentUser.uid);
                setTrades(allTrades);
                // Initialize selectedAccounts
                const accounts = [...new Set(allTrades.map(t => t.account || 'Unknown'))].sort();
                setSelectedAccounts(accounts);
            } catch (error) {
                console.error("Failed to load trades", error);
            } finally {
                setLoading(false);
            }
        }
        loadTrades();
    }, [currentUser]);

    const availableAccounts = useMemo(() => {
        return [...new Set(trades.map(t => t.account || 'Unknown'))].sort();
    }, [trades]);

    const filteredTrades = useMemo(() => {
        return trades.filter(t => selectedAccounts.includes(t.account || 'Unknown'));
    }, [trades, selectedAccounts]);

    const value = {
        trades,
        filteredTrades,
        loading,
        availableAccounts,
        selectedAccounts,
        setSelectedAccounts,
        refreshTrades: () => {
            // Re-fetch logic or just allow a trigger (simplified for now by just re-calling loadTrades if needed, 
            // but effectively we might just rely on useEffect triggers if we add a 'refresh' dependency)
            // For now, let's just assume simple reload or we can expose a reload function later.
            // A simple way to force reload is to essentially duplicate the load logic or just rely on other signals.
            // We can duplicate the fetch logic here if needed for manual refresh:
            if (currentUser) {
                setLoading(true);
                fetchTrades(currentUser.uid).then(allTrades => {
                    setTrades(allTrades);
                    setLoading(false);
                }).catch(() => setLoading(false));
            }
        }
    };

    return (
        <TradeContext.Provider value={value}>
            {children}
        </TradeContext.Provider>
    );
}
