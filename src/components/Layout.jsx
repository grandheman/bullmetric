import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrades } from '../context/TradeContext';
import AccountFilter from './AccountFilter';
import { LayoutDashboard, Upload, LogOut, Menu, X, RefreshCw, Settings } from 'lucide-react';
import './Layout.css';

export default function Layout() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { availableAccounts, selectedAccounts, setSelectedAccounts } = useTrades();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    React.useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error('Failed to log out');
        }
    }

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="header-content">
                    <div className="logo-section">
                        <img src="/images/bull_metric_logo_noglow.png" alt="Logo" className="app-logo" />
                        <span className="app-title">Trade Tracker Pro</span>
                    </div>

                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className={`header-actions ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                        <div className="mobile-menu-items">
                            <AccountFilter
                                accounts={availableAccounts}
                                selectedAccounts={selectedAccounts}
                                onSelectionChange={setSelectedAccounts}
                            />

                            <nav className="main-nav">
                                <Link to="/" className={`nav-btn-link ${location.pathname === '/' ? 'active' : ''}`}>
                                    <LayoutDashboard size={18} /> Dashboard
                                </Link>
                                <Link to="/upload" className={`nav-btn-link ${location.pathname === '/upload' ? 'active' : ''}`}>
                                    <Upload size={18} /> Upload Data
                                </Link>
                                {/* Assuming Converter was added in a previous unshown step or I should keep it if it was there. 
                                    The previous view_file showed it lines 45-47. I'll keep it. 
                                    Wait, the previous view_file showed <RefreshCw>. 
                                 */}
                                <Link to="/converter" className={`nav-btn-link ${location.pathname === '/converter' ? 'active' : ''}`}>
                                    <RefreshCw size={18} /> Converter
                                </Link>
                                <Link to="/settings" className={`nav-btn-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                                    <Settings size={18} /> Settings
                                </Link>
                            </nav>

                            <div className="user-menu">
                                {currentUser && (
                                    <button onClick={handleLogout} className="logout-btn" title="Logout">
                                        <LogOut size={18} /> <span className="mobile-only">Logout</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
