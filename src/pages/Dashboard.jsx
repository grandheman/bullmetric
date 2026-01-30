import React, { useState, useMemo } from 'react';
import { useTrades } from '../context/TradeContext';
import Calendar from '../components/Calendar';
import StatsPanel from '../components/StatsPanel';
import TransactionList from '../components/TransactionList';
import PnLChart from '../components/PnLChart';
import { startOfMonth, endOfMonth, addMonths, subMonths, format, parseISO, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
    const { filteredTrades, loading } = useTrades(); // Use global filtered trades
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null); // Just the date object or null

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    // Calculate Monthly Trades from the globally filtered trades
    const monthTrades = useMemo(() => {
        return filteredTrades.filter(t => t.date && isSameMonth(parseISO(t.date), currentDate));
    }, [filteredTrades, currentDate]);

    const handleDayClick = (day, dayTrades) => {
        // If clicking the same day, toggle off (or just keep it selected). Let's just select it.
        // If clicking a day with no trades, maybe we still want to show "No transactions"?
        // The previous logic only opened modal if trades > 0.
        // Let's allow selecting any day, but if it has trades or not is handled by Transaction List.
        if (selectedDay && isSameDay(selectedDay, day)) {
            setSelectedDay(null); // Toggle off
        } else {
            setSelectedDay(day);
        }
    };

    // Filter trades for the selected day if one is selected, otherwise show month trades
    const displayedTrades = useMemo(() => {
        if (selectedDay) {
            return filteredTrades.filter(t => t.date && isSameDay(parseISO(t.date), selectedDay));
        }
        return monthTrades;
    }, [selectedDay, filteredTrades, monthTrades]);

    const transactionListTitle = selectedDay
        ? `Transactions for ${format(selectedDay, 'MMM do, yyyy')}`
        : `Transactions for ${format(currentDate, 'MMMM yyyy')}`;

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className="dashboard-grid">
            {/* Top Left: Calendar */}
            <div className="dashboard-calendar-section">
                <div className="calendar-controls">
                    <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={24} /></button>
                    <h2>{format(currentDate, 'MMMM yyyy')}</h2>
                    <button onClick={nextMonth} className="nav-btn"><ChevronRight size={24} /></button>
                </div>
                <Calendar
                    currentDate={currentDate}
                    trades={filteredTrades}
                    onDayClick={handleDayClick}
                />
            </div>

            {/* Top Right: Stats & Transactions */}
            <div className="dashboard-sidebar">
                <StatsPanel trades={monthTrades} /> {/* Stats always for the visible month? Or selected day? Requirement says "Net PnL, Total Trades etc at top right". Usually implies Monthly Stats context. */}
                <TransactionList
                    trades={displayedTrades}
                    title={transactionListTitle}
                    description={selectedDay ? "this day" : "this month"}
                />
            </div>

            {/* Bottom: Chart */}
            <div className="dashboard-chart-section">
                <PnLChart trades={monthTrades} />
            </div>
        </div>
    );
}
