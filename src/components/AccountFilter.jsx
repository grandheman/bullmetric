import React, { useState, useRef, useEffect } from 'react';
import { Filter, Check } from 'lucide-react';
import './AccountFilter.css';

export default function AccountFilter({ accounts, selectedAccounts, onSelectionChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const toggleAccount = (account) => {
        if (selectedAccounts.includes(account)) {
            onSelectionChange(selectedAccounts.filter(a => a !== account));
        } else {
            onSelectionChange([...selectedAccounts, account]);
        }
    };

    const selectAll = () => onSelectionChange([...accounts]);
    const deselectAll = () => onSelectionChange([]);

    return (
        <div className="account-filter" ref={dropdownRef}>
            <button
                className={`filter-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Filter size={18} />
                <span>Filter Accounts {selectedAccounts.length < accounts.length ? `(${selectedAccounts.length})` : ''}</span>
            </button>

            {isOpen && (
                <div className="filter-dropdown">
                    <div className="filter-actions">
                        <button onClick={selectAll}>Select All</button>
                        <button onClick={deselectAll}>Deselect All</button>
                    </div>
                    <div className="filter-list">
                        {accounts.map(account => (
                            <div
                                key={account}
                                className="filter-item"
                                onClick={() => toggleAccount(account)}
                            >
                                <div className={`checkbox ${selectedAccounts.includes(account) ? 'checked' : ''}`}>
                                    {selectedAccounts.includes(account) && <Check size={12} />}
                                </div>
                                <span>{account}</span>
                            </div>
                        ))}
                        {accounts.length === 0 && <div className="no-accounts">No accounts found</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
