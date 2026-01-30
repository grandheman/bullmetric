import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, format, isSameMonth, isSameDay, isToday, parseISO
} from 'date-fns';
import { cn } from '../utils/cn';
import './Calendar.css';

export default function Calendar({ currentDate, trades, onDayClick }) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayData = (day) => {
        // robustly check if trade date (ISO string) is same day as calendar day
        const daysTrades = trades.filter(t => {
            if (!t.date) return false;
            return isSameDay(parseISO(t.date), day);
        });
        const totalPnL = daysTrades.reduce((sum, t) => sum + t.pnl, 0);
        return { trades: daysTrades, pnl: totalPnL };
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                {weekDays.map(day => (
                    <div key={day} className="week-day-label">{day}</div>
                ))}
            </div>
            <div className="calendar-grid">
                {days.map(day => {
                    const { trades: dayTrades, pnl } = getDayData(day);
                    const hasTrades = dayTrades.length > 0;
                    const isPositive = pnl >= 0;

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "calendar-day",
                                !isSameMonth(day, monthStart) && "other-month",
                                isToday(day) && "today",
                                hasTrades && (isPositive ? "positive-day" : "negative-day")
                            )}
                            onClick={() => onDayClick(day, dayTrades, pnl)}
                        >
                            <span className="day-number">{format(day, 'd')}</span>

                            {hasTrades && (
                                <>
                                    <div className="day-pnl">
                                        <span className="pnl-amount">${Math.abs(pnl).toLocaleString()}</span>
                                    </div>
                                    <div className="trade-count">
                                        {dayTrades.length} {dayTrades.length === 1 ? 'trade' : 'trades'}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
